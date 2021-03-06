import {
  ChatMessage,
  ChatRoom,
  ServerReaction,
  ExternalUser,
  GroupChannel,
  ListenChangeConfig,
} from '@arena-im/chat-types';
import { BaseRealtime } from '../interfaces/base-realtime';
import {
  listenToCollectionChange,
  listenToDocumentChange,
  fetchCollectionItems,
  listenToCollectionItemChange,
  addItem,
} from '../services/firestore-api';

/** Base realtime class implementation */
export class RealtimeAPI implements BaseRealtime {
  /** Unsubscribe functions */
  private unsbscribeFunctions: (() => void)[] = [];

  public constructor(private channel?: string) {}

  /**
   * @inheritDoc
   */
  public listenToMessage(callback: (messages: ChatMessage[]) => void, limit?: number): void {
    const unsubscribe = listenToCollectionChange(
      {
        path: `chat-rooms/${this.channel}/messages`,
        limit,
      },
      (response) => {
        const messages: ChatMessage[] = response.map((messageData) => ({
          createdAt: messageData.createdAt,
          key: messageData.key,
          message: messageData.message,
          publisherId: messageData.publisherId,
          referer: messageData.referer,
          replyMessage: messageData.replyMessage,
          sender: messageData.sender,
        }));

        callback(messages);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);
  }

  /**
   * @inheritdoc
   */
  public listenToBannedUsers(callback: () => void): void {
    console.log(callback);
    // const unsubscribe = listenToChange({
    //   path: 'banned-users',
    //   where: [
    //     {
    //       fieldPath: 'siteId',
    //       opStr: '==',
    //       value: this.channel,
    //     },
    //   ],
    //   callback,
    // });
    // this.unsbscribeFunctions.push(unsubscribe);
  }

  /**
   * @inheritdoc
   */
  public listenToChatConfigChanges(callback: (chatRoom: ChatRoom) => void): () => void {
    const unsubscribe = listenToDocumentChange(
      {
        path: `chat-rooms/${this.channel}`,
      },
      (data) => {
        const chatRoom: ChatRoom = data as ChatRoom;

        callback(chatRoom);
      },
    );
    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /** Unsubscribe from all listeners */
  public unsubscribeAll(): void {
    this.unsbscribeFunctions.forEach((fn) => fn());
  }

  /**
   * @inheritdoc
   */
  public async fetchRecentMessages(limit?: number): Promise<ChatMessage[]> {
    const config: ListenChangeConfig = {
      path: `chat-rooms/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
    };

    const messages = await fetchCollectionItems(config);

    return messages.reverse() as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public async fetchGroupRecentMessages(limit?: number, lastClearedTimestamp?: number): Promise<ChatMessage[]> {
    const config: ListenChangeConfig = {
      path: `group-channels/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
    };

    if (lastClearedTimestamp) {
      config.endAt = [lastClearedTimestamp];
    }

    const messages = await fetchCollectionItems(config);

    return messages.reverse() as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public async fetchPreviousMessages(firstMessage: ChatMessage, limit?: number): Promise<ChatMessage[]> {
    if (limit) {
      limit = limit + 1;
    }

    const messages = await fetchCollectionItems({
      path: `chat-rooms/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
      startAt: [firstMessage.createdAt],
    });

    messages.reverse();

    messages.pop();

    return messages as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public async fetchGroupPreviousMessages(
    firstMessage: ChatMessage,
    lastClearedTimestamp?: number,
    limit?: number,
  ): Promise<ChatMessage[]> {
    if (limit) {
      limit = limit + 1;
    }

    const config: ListenChangeConfig = {
      path: `group-channels/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
      startAt: [firstMessage.createdAt],
    };

    if (lastClearedTimestamp) {
      config.endAt = [lastClearedTimestamp];
    }

    const messages = await fetchCollectionItems(config);

    messages.reverse();

    messages.pop();

    return messages as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public listenToMessageReceived(callback: (message: ChatMessage) => void): () => void {
    const unsubscribe = listenToCollectionItemChange(
      {
        path: `chat-rooms/${this.channel}/messages`,
      },
      (data) => {
        callback(data as ChatMessage);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToGroupMessageReceived(callback: (message: ChatMessage) => void): () => void {
    const unsubscribe = listenToCollectionItemChange(
      {
        path: `group-channels/${this.channel}/messages`,
      },
      (data) => {
        callback(data as ChatMessage);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public async sendReaction(reaction: ServerReaction): Promise<ServerReaction> {
    try {
      return (await addItem('reactions', reaction)) as ServerReaction;
    } catch (e) {
      throw new Error('failed');
    }
  }

  /**
   * @inheritdoc
   */
  public listenToUserReactions(user: ExternalUser, callback: (reactions: ServerReaction[]) => void): () => void {
    const unsubscribe = listenToCollectionChange(
      {
        path: 'reactions',
        where: [
          {
            fieldPath: 'userId',
            opStr: '==',
            value: user.id,
          },
          {
            fieldPath: 'chatRoomId',
            opStr: '==',
            value: this.channel,
          },
        ],
      },
      (response) => {
        callback(response as ServerReaction[]);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToUserGroupChannels(user: ExternalUser, callback: (groupChannels: GroupChannel[]) => void): () => void {
    const unsubscribe = listenToCollectionChange(
      {
        path: 'group-channels',
        where: [
          {
            fieldPath: 'members',
            opStr: 'array-contains',
            value: user.id,
          },
        ],
      },
      (response) => {
        callback(response as GroupChannel[]);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }
}

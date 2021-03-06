import { RealtimeAPI } from '@services/realtime-api';
import { ChatMessage, ServerReaction, ExternalUser } from '@arena-im/chat-types';
import {
  listenToCollectionChange,
  listenToDocumentChange,
  fetchCollectionItems,
  listenToCollectionItemChange,
  addItem,
} from '@services/firestore-api';
import { ChatRoom } from '@arena-im/chat-types';

jest.mock('@services/firestore-api', () => ({
  listenToCollectionChange: jest.fn(),
  listenToDocumentChange: jest.fn(),
  fetchCollectionItems: jest.fn(),
  listenToCollectionItemChange: jest.fn(),
  addItem: jest.fn(),
}));

describe('RealtimeAPI', () => {
  describe('listenToMessage()', () => {
    it('should call the callback function with a list of chat message', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionChange.mockImplementation((_, callback) => {
        const message: ChatMessage = {
          createdAt: 1592342151026,
          key: 'fake-key',
          message: {
            text: 'testing',
          },
          publisherId: 'site-id',
          sender: {
            displayName: 'Test User',
            photoURL: 'http://www.google.com',
          },
        };
        const messages: ChatMessage[] = new Array(20).fill(message);

        callback(messages);
      });

      realtimeAPI.listenToMessage((messages: ChatMessage[]) => {
        expect(messages.length).toEqual(20);
        done();
      }, 20);
    });
  });

  describe('listenToUserReactions()', () => {
    it('should call the callback function with a list of reactions', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionChange.mockImplementation((_, callback) => {
        const reaction: ServerReaction = {
          itemType: 'chatMessage',
          reaction: 'love',
          publisherId: 'fake-site-id',
          itemId: 'fake-message-key',
          chatRoomId: 'fake-chat-room-key',
          userId: 'fake-user-uid',
        };

        const reactions: ServerReaction[] = new Array(20).fill(reaction);

        callback(reactions);
      });

      const user: ExternalUser = {
        id: 'fake-user',
        name: 'Face user',
        image: 'https://www.google.com',
      };

      realtimeAPI.listenToUserReactions(user, (reactions: ServerReaction[]) => {
        expect(reactions.length).toBe(20);

        done();
      });
    });
  });

  describe('listenToChatConfigChanges()', () => {
    it('should call the callback function with the chat config', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToDocumentChange.mockImplementation((_, callback) => {
        const chatRoom: ChatRoom = {
          allowSendGifs: true,
          allowShareUrls: true,
          chatAutoOpen: false,
          chatClosedIsEnabled: false,
          chatPreModerationIsEnabled: false,
          chatPreviewEnabled: true,
          chatRequestModeratorIsEnabled: false,
          createdAt: 1592335254033,
          _id: 'new-chatroom',
          lang: 'en-us',
          language: 'en-us',
          name: 'My First ChatRoom',
          presenceId: 'pesence-id',
          reactionsEnabled: true,
          showOnlineUsersNumber: true,
          signUpRequired: false,
          signUpSettings: {
            suggest: true,
            type: 'REQUIRED',
          },
          siteId: 'site-id',
          slug: 'crsl',
          standalone: false,
        };

        callback(chatRoom);
      });

      realtimeAPI.listenToChatConfigChanges((chatRoom: ChatRoom) => {
        expect(chatRoom._id).toEqual('new-chatroom');
        done();
      });
    });
  });

  describe('fetchRecentMessages()', () => {
    it('should fetch recent messages', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const message: ChatMessage = {
          createdAt: 1592342151026,
          key: 'fake-key',
          message: {
            text: 'testing',
          },
          publisherId: 'site-id',
          sender: {
            displayName: 'Test User',
            photoURL: 'http://www.google.com',
          },
        };
        const messages: ChatMessage[] = new Array(10).fill(message);

        return messages;
      });

      const messages = await realtimeAPI.fetchRecentMessages(10);

      expect(messages.length).toBe(10);
    });
  });

  describe('listenToMessageReceived()', () => {
    it('should receive a added message', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionItemChange.mockImplementation((_, callback: (message: ChatMessage) => void) => {
        const message: ChatMessage = {
          createdAt: 1592342151026,
          key: 'fake-key',
          message: {
            text: 'testing',
          },
          publisherId: 'site-id',
          sender: {
            displayName: 'Test User',
            photoURL: 'http://www.google.com',
          },
          changeType: 'added',
        };

        callback(message);
      });

      realtimeAPI.listenToMessageReceived((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');

        done();
      });
    });
  });

  describe('fetchPreviousMessages()', () => {
    it('should fetch previous messages', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      const message: ChatMessage = {
        createdAt: 1592342151026,
        key: 'fake-key',
        message: {
          text: 'testing',
        },
        publisherId: 'site-id',
        sender: {
          displayName: 'Test User',
          photoURL: 'http://www.google.com',
        },
      };

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = [
          {
            ...message,
            key: 'fake-key',
          },
          {
            ...message,
            key: 'fake-key-1',
          },
          {
            ...message,
            key: 'fake-key-2',
          },
          {
            ...message,
            key: 'fake-key-3',
          },
        ];

        return messages;
      });

      const messages = await realtimeAPI.fetchPreviousMessages(message, 3);

      expect(messages).toEqual([
        {
          ...message,
          key: 'fake-key-3',
        },
        {
          ...message,
          key: 'fake-key-2',
        },
        {
          ...message,
          key: 'fake-key-1',
        },
      ]);
    });
  });

  describe('sendReaction()', () => {
    it('should react to a message', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      const reaction: ServerReaction = {
        itemType: 'chatMessage',
        reaction: 'love',
        publisherId: 'fake-site-id',
        itemId: 'fake-message-key',
        chatRoomId: 'fake-chat-room-key',
        userId: 'fake-user-uid',
      };

      // @ts-ignore
      addItem.mockImplementation(async () => {
        return;
      });

      realtimeAPI.sendReaction(reaction).then(() => {
        done();
      });
    });

    it('should handle a react error', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      const reaction: ServerReaction = {
        itemType: 'chatMessage',
        reaction: 'love',
        publisherId: 'fake-site-id',
        itemId: 'fake-message-key',
        chatRoomId: 'fake-chat-room-key',
        userId: 'fake-user-uid',
      };

      // @ts-ignore
      addItem.mockImplementation(async () => {
        throw new Error('cannot set this doc');
      });

      realtimeAPI.sendReaction(reaction).catch((e) => {
        expect(e.message).toEqual('failed');
        done();
      });
    });
  });
});

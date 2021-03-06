import { GraphQLAPI } from '@services/graphql-api';
import * as GraphQLTransport from '@services/graphql-transport';
import { exampleSite, exampleGroupChannel, exampleChatMessage, examplePublicUser } from '../../fixtures/examples';
import { RequestDocument } from 'graphql-request/dist/types';
import { ChatMessageContent } from '@arena-im/chat-types';

jest.mock('@services/graphql-transport', () => ({
  GraphQLTransport: jest.fn(),
}));

describe('GraphQLAPI', () => {
  describe('fetchGroupChannels()', () => {
    it('should fetch the user group channels', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              me: {
                groupChannels: [exampleGroupChannel],
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const groupChannels = await graphqlAPI.fetchGroupChannels();

      expect(groupChannels).toEqual([exampleGroupChannel]);
    });
  });

  describe('fetchGroupChannelTotalUnreadCount()', () => {
    it('should fetch the group channel total unread messages count', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              me: {
                totalGroupChannelUnreadCount: 10,
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const total = await graphqlAPI.fetchGroupChannelTotalUnreadCount();

      expect(total).toEqual(10);
    });

    it('should return 0 as total of unread message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              me: {
                totalGroupChannelUnreadCount: 0,
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const total = await graphqlAPI.fetchGroupChannelTotalUnreadCount();

      expect(total).toEqual(0);
    });
  });

  describe('createGroupChannel()', () => {
    it('should create a group channel', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async (
            _: RequestDocument,
            variables: {
              input: {
                userIds: string[];
                siteId: string;
                firstMessage?: ChatMessageContent;
              };
            },
          ) => {
            const groupChannel = { ...exampleGroupChannel };

            if (groupChannel.members) {
              groupChannel.members[0]._id = variables.input.userIds[0];
              groupChannel.members[1]._id = variables.input.userIds[1];
            }

            return {
              createGroupChannel: groupChannel,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const groupChannel = await graphqlAPI.createGroupChannel({
        userIds: ['u1234', 'u5678'],
        siteId: 'fake-site',
      });

      const newGroupChannel = { ...exampleGroupChannel };
      if (newGroupChannel.members) {
        newGroupChannel.members[0]._id = 'u1234';
        newGroupChannel.members[1]._id = 'u5678';
      }

      expect(groupChannel).toEqual(newGroupChannel);
    });

    it('should create a group channel with a first message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async (
            _: RequestDocument,
            variables: {
              input: {
                userIds: string[];
                siteId: string;
                firstMessage?: ChatMessageContent;
              };
            },
          ) => {
            const groupChannel = { ...exampleGroupChannel };

            if (groupChannel.members) {
              groupChannel.members[0]._id = variables.input.userIds[0];
              groupChannel.members[1]._id = variables.input.userIds[1];
            }

            const message = { ...exampleChatMessage };

            if (variables.input.firstMessage) {
              message.message = variables.input.firstMessage;
            }

            groupChannel.lastMessage = message;

            return {
              createGroupChannel: groupChannel,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const groupChannel = await graphqlAPI.createGroupChannel({
        userIds: ['u1234', 'u5678'],
        siteId: 'fake-site',
        firstMessage: exampleChatMessage.message,
      });

      const newGroupChannel = { ...exampleGroupChannel };
      if (newGroupChannel.members) {
        newGroupChannel.members[0]._id = 'u1234';
        newGroupChannel.members[1]._id = 'u5678';
      }

      newGroupChannel.lastMessage = exampleChatMessage;

      expect(groupChannel).toEqual(newGroupChannel);
    });
  });

  describe('fetchMembers()', () => {
    it('should fetch the chat members', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              chatRoom: {
                members: {
                  items: [examplePublicUser],
                },
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const members = await graphqlAPI.fetchMembers('chat-id-fake');

      expect(members).toEqual([examplePublicUser]);
    });
  });

  describe('fetchGroupChannel()', () => {
    it('should fetch a group channel', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async (_: RequestDocument, variables: { id: string }) => {
            return {
              groupChannel: { ...exampleGroupChannel, _id: variables.id },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const groupChannel = await graphqlAPI.fetchGroupChannel('fake-channel');

      expect(groupChannel._id).toEqual('fake-channel');
    });
  });

  describe('sendPrivateMessage()', () => {
    it('should send a privagte message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              sendMessage: 'fake-message',
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const messageId = await graphqlAPI.sendPrivateMessage({
        groupChannelId: 'group-channel-fake',
        message: exampleChatMessage.message,
      });

      expect(messageId).toEqual('fake-message');
    });
  });

  describe('markGroupChannelRead()', () => {
    it('should mark a group channel as read', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              markRead: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const result = await graphqlAPI.markGroupChannelRead('fake-group-channel');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              markRead: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      graphqlAPI.markGroupChannelRead('fake-group-channel').catch((e) => {
        expect(e.message).toEqual('failed');
        done();
      });
    });
  });

  describe('deletePrivateMessage()', () => {
    it('should delete a message on a group channel', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteMessage: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const result = await graphqlAPI.deletePrivateMessage('fake-group-channel', 'fake-massage');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteMessage: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      graphqlAPI.deletePrivateMessage('fake-group-channel', 'fake-massage').catch((e) => {
        expect(e.message).toEqual('failed');
        done();
      });
    });
  });

  describe('removeGroupChannel()', () => {
    it('should delete a group channel for a user', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              removeGroupChannel: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const result = await graphqlAPI.removeGroupChannel('fake-group-channel');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              removeGroupChannel: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      graphqlAPI.removeGroupChannel('fake-group-channel').catch((e) => {
        expect(e.message).toEqual('failed');
        done();
      });
    });
  });

  describe('blockPrivateUser()', () => {
    it('should block a user on private group', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              blockUser: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const result = await graphqlAPI.blockPrivateUser('fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              blockUser: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      graphqlAPI.blockPrivateUser('fake-user').catch((e) => {
        expect(e.message).toEqual('failed');
        done();
      });
    });
  });

  describe('unblockPrivateUser()', () => {
    it('should unblock a user on private group', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              unblockUser: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      const result = await graphqlAPI.unblockPrivateUser('fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              unblockUser: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = new GraphQLAPI(exampleSite);

      graphqlAPI.unblockPrivateUser('fake-user').catch((e) => {
        expect(e.message).toEqual('failed');
        done();
      });
    });
  });
});

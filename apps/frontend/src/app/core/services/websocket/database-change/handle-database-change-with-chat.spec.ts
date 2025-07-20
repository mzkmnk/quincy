import { describe, it, expect, vi } from 'vitest';

import type { DatabaseChangeEventWithChat } from '../../../types/websocket.types';

import { handleDatabaseChangeWithChat } from './handle-database-change-with-chat';

describe('handleDatabaseChangeWithChat', () => {
  describe('valid database change events', () => {
    it('should handle database change event with chat content', () => {
      const mockCallback = vi.fn();
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        filePath: '/Users/test/.config/amazon-q/developer/data.sqlite3',
        changeType: 'modified',
        latestChat: {
          userMessage: 'Hello, how are you?',
          aiResponse: 'I am doing well, thank you!',
          timestamp: '2024-01-01T10:01:00Z',
          turnId: 'turn_123',
        },
      };

      const result = handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(result).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'LATEST_CHAT_UPDATED',
        payload: {
          userMessage: 'Hello, how are you?',
          aiResponse: 'I am doing well, thank you!',
          timestamp: '2024-01-01T10:01:00Z',
          turnId: 'turn_123',
          changeInfo: {
            filePath: '/Users/test/.config/amazon-q/developer/data.sqlite3',
            changeType: 'modified',
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        },
      });
    });

    it('should handle database change event without chat content', () => {
      const mockCallback = vi.fn();
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        filePath: '/Users/test/.config/amazon-q/developer/data.sqlite3',
        changeType: 'modified',
        latestChat: null,
      };

      const result = handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(result).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'DATABASE_CHANGED_NO_CHAT',
        payload: {
          filePath: '/Users/test/.config/amazon-q/developer/data.sqlite3',
          changeType: 'modified',
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
      });
    });

    it('should handle different change types correctly', () => {
      const mockCallback = vi.fn();
      const changeTypes: Array<'add' | 'modified' | 'deleted'> = ['add', 'modified', 'deleted'];

      changeTypes.forEach(changeType => {
        const eventData: DatabaseChangeEventWithChat = {
          type: 'database-changed-with-chat',
          timestamp: new Date(),
          filePath: '/test/database.sqlite3',
          changeType,
          latestChat: {
            userMessage: 'Test message',
            aiResponse: 'Test response',
            timestamp: '2024-01-01T10:00:00Z',
            turnId: 'test_turn',
          },
        };

        const result = handleDatabaseChangeWithChat(eventData, mockCallback);

        expect(result).toBe(true);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'LATEST_CHAT_UPDATED',
            payload: expect.objectContaining({
              changeInfo: expect.objectContaining({
                changeType,
              }),
            }),
          })
        );
      });

      expect(mockCallback).toHaveBeenCalledTimes(3);
    });

    it('should handle empty chat messages gracefully', () => {
      const mockCallback = vi.fn();
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        filePath: '/test/database.sqlite3',
        changeType: 'modified',
        latestChat: {
          userMessage: '',
          aiResponse: '',
          timestamp: '',
          turnId: '',
        },
      };

      const result = handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(result).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'LATEST_CHAT_UPDATED',
        payload: {
          userMessage: '',
          aiResponse: '',
          timestamp: '',
          turnId: '',
          changeInfo: {
            filePath: '/test/database.sqlite3',
            changeType: 'modified',
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
        },
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid event data gracefully', () => {
      const mockCallback = vi.fn();
      const invalidData = null;

      const result = handleDatabaseChangeWithChat(invalidData as unknown, mockCallback);

      expect(result).toBe(false);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle missing required fields', () => {
      const mockCallback = vi.fn();
      const incompleteData = {
        type: 'database-changed-with-chat',
        timestamp: new Date(),
        // missing filePath and changeType
      } as unknown;

      const result = handleDatabaseChangeWithChat(incompleteData, mockCallback);

      expect(result).toBe(false);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date(),
        filePath: '/test/database.sqlite3',
        changeType: 'modified',
        latestChat: null,
      };

      const result = handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(result).toBe(false);
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should validate event type', () => {
      const mockCallback = vi.fn();
      const wrongTypeData = {
        type: 'wrong-event-type',
        timestamp: new Date(),
        filePath: '/test/database.sqlite3',
        changeType: 'modified',
        latestChat: null,
      } as unknown;

      const result = handleDatabaseChangeWithChat(wrongTypeData, mockCallback);

      expect(result).toBe(false);
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('chat content validation', () => {
    it('should handle malformed chat content', () => {
      const mockCallback = vi.fn();
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date(),
        filePath: '/test/database.sqlite3',
        changeType: 'modified',
        latestChat: {
          userMessage: undefined as unknown as string,
          aiResponse: null as unknown as string,
          timestamp: 123 as unknown as string,
          turnId: {} as unknown as string,
        },
      };

      const result = handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(result).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith({
        type: 'LATEST_CHAT_UPDATED',
        payload: {
          userMessage: '',
          aiResponse: '',
          timestamp: '',
          turnId: '',
          changeInfo: {
            filePath: '/test/database.sqlite3',
            changeType: 'modified',
            timestamp: eventData.timestamp,
          },
        },
      });
    });

    it('should preserve valid chat timestamps', () => {
      const mockCallback = vi.fn();
      const chatTimestamp = '2024-01-01T15:30:45.123Z';
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        filePath: '/test/database.sqlite3',
        changeType: 'modified',
        latestChat: {
          userMessage: 'Test user message',
          aiResponse: 'Test AI response',
          timestamp: chatTimestamp,
          turnId: 'turn_456',
        },
      };

      const result = handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(result).toBe(true);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            timestamp: chatTimestamp,
          }),
        })
      );
    });
  });

  describe('notification types', () => {
    it('should emit LATEST_CHAT_UPDATED when chat content exists', () => {
      const mockCallback = vi.fn();
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date(),
        filePath: '/test/database.sqlite3',
        changeType: 'add',
        latestChat: {
          userMessage: 'New conversation',
          aiResponse: 'Welcome!',
          timestamp: '2024-01-01T10:00:00Z',
          turnId: 'turn_new',
        },
      };

      handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LATEST_CHAT_UPDATED',
        })
      );
    });

    it('should emit DATABASE_CHANGED_NO_CHAT when no chat content', () => {
      const mockCallback = vi.fn();
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: new Date(),
        filePath: '/test/database.sqlite3',
        changeType: 'deleted',
        latestChat: null,
      };

      handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DATABASE_CHANGED_NO_CHAT',
        })
      );
    });
  });

  describe('payload structure', () => {
    it('should include complete change info in payload', () => {
      const mockCallback = vi.fn();
      const timestamp = new Date('2024-01-01T10:00:00Z');
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp,
        filePath: '/complete/test/path.sqlite3',
        changeType: 'modified',
        latestChat: {
          userMessage: 'Complete test',
          aiResponse: 'Complete response',
          timestamp: '2024-01-01T10:01:00Z',
          turnId: 'complete_turn',
        },
      };

      handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        type: 'LATEST_CHAT_UPDATED',
        payload: {
          userMessage: 'Complete test',
          aiResponse: 'Complete response',
          timestamp: '2024-01-01T10:01:00Z',
          turnId: 'complete_turn',
          changeInfo: {
            filePath: '/complete/test/path.sqlite3',
            changeType: 'modified',
            timestamp,
          },
        },
      });
    });

    it('should maintain timestamp precision in change info', () => {
      const mockCallback = vi.fn();
      const preciseTimestamp = new Date('2024-01-01T10:30:45.123Z');
      const eventData: DatabaseChangeEventWithChat = {
        type: 'database-changed-with-chat',
        timestamp: preciseTimestamp,
        filePath: '/test/database.sqlite3',
        changeType: 'modified',
        latestChat: null,
      };

      handleDatabaseChangeWithChat(eventData, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            timestamp: preciseTimestamp,
          }),
        })
      );
    });
  });
});

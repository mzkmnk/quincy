import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { handleDatabaseChangeWithChat } from '../../../services/amazon-q-history/database-watcher/database-change-handler-with-chat';

describe('Database Change Handler with Chat', () => {
  let tempDir: string;
  let testDbPath: string;
  let db: Database.Database;
  let mockEmitFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // テスト用の一時ディレクトリとデータベースファイルを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'db-change-with-chat-test-'));
    testDbPath = path.join(tempDir, 'test.sqlite3');

    // テスト用のSQLiteデータベースを作成
    db = new Database(testDbPath);

    // Amazon Qデータベースの構造を模倣したテーブル作成
    db.exec(`
      CREATE TABLE key_value_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // モックのWebSocket emit関数
    mockEmitFn = vi.fn();
  });

  afterEach(async () => {
    // データベースクローズとクリーンアップ
    if (db) {
      db.close();
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // クリーンアップエラーは無視
    }
  });

  describe('handleDatabaseChangeWithChat', () => {
    it('should emit database change event with latest chat content', async () => {
      // テストデータの挿入
      const conversation = {
        conversation_id: 'conv1',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: {
              message: 'Hello, how are you?',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'I am doing well, thank you!',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project1',
        JSON.stringify(conversation)
      );

      const result = await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: {
          userMessage: 'Hello, how are you?',
          aiResponse: 'I am doing well, thank you!',
          timestamp: '2024-01-01T10:01:00Z',
          turnId: 'turn1',
        },
      });
    });

    it('should emit event without chat content when no conversations exist', async () => {
      const result = await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: null,
      });
    });

    it('should emit event with most recent conversation when multiple exist', async () => {
      // 複数の会話を挿入
      const olderConversation = {
        conversation_id: 'conv_old',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_old',
            user_message: {
              message: 'Old message',
              timestamp: '2024-01-01T09:00:00Z',
            },
            ai_response: {
              message: 'Old response',
              timestamp: '2024-01-01T09:01:00Z',
            },
          },
        ],
      };

      const newerConversation = {
        conversation_id: 'conv_new',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_new',
            user_message: {
              message: 'Latest message',
              timestamp: '2024-01-01T11:00:00Z',
            },
            ai_response: {
              message: 'Latest response',
              timestamp: '2024-01-01T11:01:00Z',
            },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_old',
        JSON.stringify(olderConversation)
      );
      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_new',
        JSON.stringify(newerConversation)
      );

      const result = await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: {
          userMessage: 'Latest message',
          aiResponse: 'Latest response',
          timestamp: '2024-01-01T11:01:00Z',
          turnId: 'turn_new',
        },
      });
    });

    it('should handle database access errors gracefully', async () => {
      const invalidPath = '/invalid/path/database.sqlite3';
      const result = await handleDatabaseChangeWithChat(invalidPath, mockEmitFn);

      expect(result).toBe(false);
      expect(mockEmitFn).not.toHaveBeenCalled();
    });

    it('should include correct timestamp in event data', async () => {
      const beforeTime = new Date();

      const conversation = {
        conversation_id: 'conv_timestamp',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_timestamp',
            user_message: {
              message: 'Timestamp test',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'Timestamp response',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_timestamp',
        JSON.stringify(conversation)
      );

      await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);
      const afterTime = new Date();

      expect(mockEmitFn).toHaveBeenCalled();
      const eventData = mockEmitFn.mock.calls[0][1];
      expect(eventData.timestamp).toBeInstanceOf(Date);
      expect(eventData.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(eventData.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should handle conversations with empty history gracefully', async () => {
      const conversationWithEmptyHistory = {
        conversation_id: 'conv_empty',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_empty',
        JSON.stringify(conversationWithEmptyHistory)
      );

      const result = await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: null,
      });
    });

    it('should handle malformed JSON data gracefully', async () => {
      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/malformed_project',
        'invalid json data'
      );

      const result = await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: null,
      });
    });

    it('should handle conversations with multiple turns correctly', async () => {
      const multiTurnConversation = {
        conversation_id: 'conv_multi',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: {
              message: 'First message',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'First response',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
          {
            turn_id: 'turn2',
            user_message: {
              message: 'Second message',
              timestamp: '2024-01-01T10:02:00Z',
            },
            ai_response: {
              message: 'Second response',
              timestamp: '2024-01-01T10:03:00Z',
            },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_multi',
        JSON.stringify(multiTurnConversation)
      );

      const result = await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: {
          userMessage: 'Second message',
          aiResponse: 'Second response',
          timestamp: '2024-01-01T10:03:00Z',
          turnId: 'turn2',
        },
      });
    });

    it('should handle missing message content gracefully', async () => {
      const conversationWithMissingContent = {
        conversation_id: 'conv_missing',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_missing',
            user_message: {
              message: '',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: '',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_missing',
        JSON.stringify(conversationWithMissingContent)
      );

      const result = await handleDatabaseChangeWithChat(testDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: testDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: {
          userMessage: '',
          aiResponse: '',
          timestamp: '2024-01-01T10:01:00Z',
          turnId: 'turn_missing',
        },
      });
    });

    it('should prioritize database path for file path in event', async () => {
      const customDbPath = path.join(tempDir, 'custom.sqlite3');

      // 新しいデータベースファイルを作成
      const customDb = new Database(customDbPath);
      customDb.exec(`
        CREATE TABLE key_value_store (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      const conversation = {
        conversation_id: 'conv_custom',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_custom',
            user_message: {
              message: 'Custom path test',
              timestamp: '2024-01-01T10:00:00Z',
            },
            ai_response: {
              message: 'Custom path response',
              timestamp: '2024-01-01T10:01:00Z',
            },
          },
        ],
      };

      customDb
        .prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)')
        .run('/project_custom', JSON.stringify(conversation));
      customDb.close();

      const result = await handleDatabaseChangeWithChat(customDbPath, mockEmitFn);

      expect(result).toBe(true);
      expect(mockEmitFn).toHaveBeenCalledWith('database-changed-with-chat', {
        filePath: customDbPath,
        timestamp: expect.any(Date),
        changeType: 'modified',
        latestChat: expect.any(Object),
      });
    });
  });
});

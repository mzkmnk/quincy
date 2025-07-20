import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { getLatestConversationEntry } from '../../../services/amazon-q-history/get-latest-conversation-entry';

describe('Get Latest Conversation Entry', () => {
  let tempDir: string;
  let testDbPath: string;
  let db: Database.Database;

  beforeEach(async () => {
    // テスト用の一時ディレクトリとデータベースファイルを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'latest-conversation-test-'));
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

  describe('getLatestConversationEntry', () => {
    it('should return the latest conversation entry by timestamp', async () => {
      // テストデータの挿入
      const conversation1 = {
        conversation_id: 'conv1',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: { message: 'Hello', timestamp: '2024-01-01T10:00:00Z' },
            ai_response: { message: 'Hi there!', timestamp: '2024-01-01T10:01:00Z' },
          },
        ],
      };

      const conversation2 = {
        conversation_id: 'conv2',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn2',
            user_message: { message: 'Latest message', timestamp: '2024-01-02T10:00:00Z' },
            ai_response: { message: 'Latest response', timestamp: '2024-01-02T10:01:00Z' },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project1',
        JSON.stringify(conversation1)
      );
      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project2',
        JSON.stringify(conversation2)
      );

      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeDefined();
      expect(result?.conversation_id).toBe('conv2');
      expect(result?.history).toHaveLength(1);
      expect(result?.history[0].user_message.message).toBe('Latest message');
    });

    it('should return null when database has no conversations', async () => {
      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeNull();
    });

    it('should handle conversations without history gracefully', async () => {
      const conversationWithoutHistory = {
        conversation_id: 'conv_no_history',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: null,
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_no_history',
        JSON.stringify(conversationWithoutHistory)
      );

      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeNull();
    });

    it('should handle malformed JSON data gracefully', async () => {
      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/malformed_project',
        'invalid json data'
      );

      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeNull();
    });

    it('should throw error when database file does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.sqlite3');

      await expect(getLatestConversationEntry(nonExistentPath)).rejects.toThrow(
        '履歴取得に失敗しました'
      );
    });

    it('should handle empty history arrays', async () => {
      const conversationWithEmptyHistory = {
        conversation_id: 'conv_empty',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_empty',
        JSON.stringify(conversationWithEmptyHistory)
      );

      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeNull();
    });

    it('should compare timestamps correctly and return the most recent', async () => {
      const olderConversation = {
        conversation_id: 'conv_older',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_old',
            user_message: { message: 'Old message', timestamp: '2024-01-01T09:00:00Z' },
            ai_response: { message: 'Old response', timestamp: '2024-01-01T09:01:00Z' },
          },
        ],
      };

      const newerConversation = {
        conversation_id: 'conv_newer',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_new',
            user_message: { message: 'New message', timestamp: '2024-01-01T11:00:00Z' },
            ai_response: { message: 'New response', timestamp: '2024-01-01T11:01:00Z' },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_older',
        JSON.stringify(olderConversation)
      );
      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_newer',
        JSON.stringify(newerConversation)
      );

      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeDefined();
      expect(result?.conversation_id).toBe('conv_newer');
      expect(result?.history[0].user_message.message).toBe('New message');
    });

    it('should handle conversations with multiple turns and return the latest', async () => {
      const multiTurnConversation = {
        conversation_id: 'conv_multi',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn1',
            user_message: { message: 'First message', timestamp: '2024-01-01T10:00:00Z' },
            ai_response: { message: 'First response', timestamp: '2024-01-01T10:01:00Z' },
          },
          {
            turn_id: 'turn2',
            user_message: { message: 'Second message', timestamp: '2024-01-01T10:02:00Z' },
            ai_response: { message: 'Second response', timestamp: '2024-01-01T10:03:00Z' },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_multi',
        JSON.stringify(multiTurnConversation)
      );

      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeDefined();
      expect(result?.conversation_id).toBe('conv_multi');
      // 最新のターンのタイムスタンプ（AI応答）で判定される
      expect(result?.history).toHaveLength(2);
    });

    it('should handle database read permissions correctly', async () => {
      // 読み取り専用データベースでのテスト
      const readOnlyDb = new Database(testDbPath, { readonly: true });
      readOnlyDb.close();

      const testConversation = {
        conversation_id: 'conv_readonly',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_readonly',
            user_message: { message: 'Read only message', timestamp: '2024-01-01T10:00:00Z' },
            ai_response: { message: 'Read only response', timestamp: '2024-01-01T10:01:00Z' },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_readonly',
        JSON.stringify(testConversation)
      );

      const result = await getLatestConversationEntry(testDbPath);

      expect(result).toBeDefined();
      expect(result?.conversation_id).toBe('conv_readonly');
    });

    it('should handle invalid timestamp formats gracefully', async () => {
      const invalidTimestampConversation = {
        conversation_id: 'conv_invalid_time',
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        history: [
          {
            turn_id: 'turn_invalid',
            user_message: { message: 'Invalid time message', timestamp: 'invalid-timestamp' },
            ai_response: { message: 'Invalid time response', timestamp: 'invalid-timestamp' },
          },
        ],
      };

      db.prepare('INSERT INTO key_value_store (key, value) VALUES (?, ?)').run(
        '/project_invalid_time',
        JSON.stringify(invalidTimestampConversation)
      );

      const result = await getLatestConversationEntry(testDbPath);

      // 無効なタイムスタンプでも会話は取得されるべき（ファールバック処理）
      expect(result).toBeDefined();
      expect(result?.conversation_id).toBe('conv_invalid_time');
    });
  });
});

/**
 * TDD: SQLite3からconversation_idを抽出する機能のテスト
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// テスト対象（まだ実装していない）
import { extractConversationIdFromDatabase } from '../../../services/amazon-q-history/extract-conversation-id-from-sqlite';

describe('extractConversationIdFromDatabase', () => {
  let tempDbPath: string;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-amazon-q-'));
    tempDbPath = path.join(tempDir, 'data.sqlite3');
  });

  afterEach(async () => {
    // クリーンアップ
    try {
      await fs.rm(path.dirname(tempDbPath), { recursive: true, force: true });
    } catch {
      // エラーを無視
    }
  });

  describe('正常ケース', () => {
    it('存在するプロジェクトパスのconversation_idを正確に取得できる', async () => {
      // テストデータ: 実際のAmazon Q SQLite3データ構造を模倣
      const projectPath = '/Users/test/dev/test-project';
      const expectedConversationId = 'fb5cdbe5-934c-4e25-9abd-bcc28617ba5b';
      const testConversationData = {
        conversation_id: expectedConversationId,
        next_message: null,
        history: [],
        transcript: [],
        model: 'CLAUDE_SONNET_4_20250514_V1_0',
      };

      // SQLite3データベースを作成してテストデータを挿入
      await createTestDatabase(tempDbPath, projectPath, testConversationData);

      // テスト実行
      const result = await extractConversationIdFromDatabase(projectPath, tempDbPath);

      // 検証
      expect(result).toBe(expectedConversationId);
    });

    it('複数のプロジェクトが存在する場合、指定したプロジェクトのconversation_idのみを取得する', async () => {
      // テストデータ: 複数プロジェクト
      const projectPath1 = '/Users/test/dev/project1';
      const projectPath2 = '/Users/test/dev/project2';
      const conversationId1 = 'conversation-id-1';
      const conversationId2 = 'conversation-id-2';

      await createTestDatabase(tempDbPath, projectPath1, { conversation_id: conversationId1 });
      await addToTestDatabase(tempDbPath, projectPath2, { conversation_id: conversationId2 });

      // project1のconversation_idを取得
      const result = await extractConversationIdFromDatabase(projectPath1, tempDbPath);

      expect(result).toBe(conversationId1);
    });
  });

  describe('異常ケース', () => {
    it('存在しないプロジェクトパスの場合、nullを返す', async () => {
      // 空のデータベースを作成
      await createTestDatabase(tempDbPath, '/some/other/path', { conversation_id: 'some-id' });

      const result = await extractConversationIdFromDatabase(
        '/Users/test/dev/nonexistent',
        tempDbPath
      );

      expect(result).toBeNull();
    });

    it('conversation_idが存在しないレコードの場合、nullを返す', async () => {
      const projectPath = '/Users/test/dev/test-project';
      // conversation_idフィールドがないデータ
      const invalidData = {
        next_message: null,
        history: [],
        transcript: [],
      };

      await createTestDatabase(tempDbPath, projectPath, invalidData);

      const result = await extractConversationIdFromDatabase(projectPath, tempDbPath);

      expect(result).toBeNull();
    });

    it('データベースファイルが存在しない場合、nullを返す', async () => {
      // データベースファイルを作成しない
      const nonExistentPath = '/path/to/nonexistent/database.sqlite3';

      const result = await extractConversationIdFromDatabase(
        '/Users/test/dev/test-project',
        nonExistentPath
      );

      expect(result).toBeNull();
    });

    it('不正なJSONデータの場合、nullを返す', async () => {
      const projectPath = '/Users/test/dev/test-project';

      // 不正なJSONを含むデータベースを作成
      await createTestDatabaseWithInvalidJson(tempDbPath, projectPath);

      const result = await extractConversationIdFromDatabase(projectPath, tempDbPath);

      expect(result).toBeNull();
    });
  });

  describe('パフォーマンステスト', () => {
    it('1000個のレコードが存在する場合でも、適切な時間内で取得できる', async () => {
      // 最初にテーブルを作成
      await createTestDatabase(tempDbPath, '/Users/test/dev/project-0', {
        conversation_id: 'conversation-id-0',
      });

      // 大量のテストデータを追加
      for (let i = 1; i < 1000; i++) {
        const projectPath = `/Users/test/dev/project-${i}`;
        await addToTestDatabase(tempDbPath, projectPath, {
          conversation_id: `conversation-id-${i}`,
        });
      }

      const targetProject = '/Users/test/dev/project-500';

      const startTime = Date.now();
      const result = await extractConversationIdFromDatabase(targetProject, tempDbPath);
      const endTime = Date.now();

      expect(result).toBe('conversation-id-500');
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });
  });
});

// テストヘルパー関数
async function createTestDatabase(dbPath: string, projectPath: string, conversationData: any) {
  const Database = (await import('better-sqlite3')).default;

  const db = new Database(dbPath);

  // conversationsテーブルを作成
  db.exec(`CREATE TABLE conversations (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  const stmt = db.prepare('INSERT INTO conversations (key, value) VALUES (?, ?)');
  stmt.run(projectPath, JSON.stringify(conversationData));

  db.close();
}

async function addToTestDatabase(dbPath: string, projectPath: string, conversationData: any) {
  const Database = (await import('better-sqlite3')).default;

  const db = new Database(dbPath);
  const stmt = db.prepare('INSERT INTO conversations (key, value) VALUES (?, ?)');
  stmt.run(projectPath, JSON.stringify(conversationData));
  db.close();
}

async function createTestDatabaseWithInvalidJson(dbPath: string, projectPath: string) {
  const Database = (await import('better-sqlite3')).default;

  const db = new Database(dbPath);

  // conversationsテーブルを作成
  db.exec(`CREATE TABLE conversations (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // 不正なJSONを挿入
  const stmt = db.prepare('INSERT INTO conversations (key, value) VALUES (?, ?)');
  stmt.run(projectPath, '{ invalid json');

  db.close();
}

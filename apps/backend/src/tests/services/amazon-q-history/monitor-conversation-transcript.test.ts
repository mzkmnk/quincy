/**
 * TDD: transcript配列変更監視システムのテスト
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// テスト対象（まだ実装していない）
import {
  monitorConversationTranscript,
  TranscriptMonitor,
} from '../../../services/amazon-q-history/monitor-conversation-transcript';

describe('monitorConversationTranscript', () => {
  let tempDbPath: string;
  let mockEmitCallback: ReturnType<typeof vi.fn>;
  let conversationId: string;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-transcript-monitor-'));
    tempDbPath = path.join(tempDir, 'data.sqlite3');
    mockEmitCallback = vi.fn();
    conversationId = 'test-conversation-id-123';
  });

  afterEach(async () => {
    // クリーンアップ
    TranscriptMonitor.stopMonitoring(conversationId);
    try {
      await fs.rm(path.dirname(tempDbPath), { recursive: true, force: true });
    } catch {
      // エラーを無視
    }
  });

  describe('基本的な監視機能', () => {
    it('新しいconversation_idの監視を開始できる', async () => {
      // テスト用のDBを作成（空のtranscript）
      await createTestDatabaseWithTranscript(tempDbPath, '/test/project', conversationId, []);

      // 監視開始
      const result = await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath
      );

      // 検証
      expect(result).toBe(true);
      expect(TranscriptMonitor.isMonitoring(conversationId)).toBe(true);
    });

    it('既に監視中のconversationは重複監視されない', async () => {
      await createTestDatabaseWithTranscript(tempDbPath, '/test/project', conversationId, []);

      // 最初の監視開始
      await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath
      );

      // 同じconversationで再度監視開始
      const result = await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath
      );

      // 検証: 重複監視は拒否される
      expect(result).toBe(false);
    });

    it('監視を停止できる', async () => {
      await createTestDatabaseWithTranscript(tempDbPath, '/test/project', conversationId, []);

      // 監視開始
      await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath
      );
      expect(TranscriptMonitor.isMonitoring(conversationId)).toBe(true);

      // 監視停止
      TranscriptMonitor.stopMonitoring(conversationId);

      // 検証
      expect(TranscriptMonitor.isMonitoring(conversationId)).toBe(false);
    });
  });

  describe('transcript変更検出機能', () => {
    it('新しいメッセージが追加された場合、適切なイベントを発火する', async () => {
      const initialTranscript = [
        { role: 'user', content: [{ text: 'Hello' }] },
        { role: 'assistant', content: [{ text: 'Hi there!' }] },
      ];

      // 初期状態のDBを作成
      await createTestDatabaseWithTranscript(
        tempDbPath,
        '/test/project',
        conversationId,
        initialTranscript
      );

      // 監視開始
      await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath,
        { pollIntervalMs: 100 }
      );

      // 少し後に新しいメッセージを追加
      setTimeout(async () => {
        const updatedTranscript = [
          ...initialTranscript,
          { role: 'user', content: [{ text: 'How are you?' }] },
        ];
        await updateTranscriptInDatabase(
          tempDbPath,
          '/test/project',
          conversationId,
          updatedTranscript
        );
      }, 150);

      // ポーリングが実行されるまで待機
      await new Promise(resolve => setTimeout(resolve, 300));

      // 検証
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:transcript-update', {
        conversationId,
        newMessages: [{ role: 'user', content: [{ text: 'How are you?' }] }],
        totalMessageCount: 3,
      });
    });

    it('ツール使用メッセージが追加された場合、ツールイベントも発火する', async () => {
      const initialTranscript = [{ role: 'user', content: [{ text: 'Show me the files' }] }];

      await createTestDatabaseWithTranscript(
        tempDbPath,
        '/test/project',
        conversationId,
        initialTranscript
      );

      // 監視開始
      await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath,
        { pollIntervalMs: 100 }
      );

      // ツール使用メッセージを追加
      setTimeout(async () => {
        const updatedTranscript = [
          ...initialTranscript,
          {
            role: 'assistant',
            content: [{ text: "[Tool uses: fs_read, git_status]\nI'll help you check the files." }],
          },
        ];
        await updateTranscriptInDatabase(
          tempDbPath,
          '/test/project',
          conversationId,
          updatedTranscript
        );
      }, 150);

      await new Promise(resolve => setTimeout(resolve, 300));

      // 検証: 通常のメッセージ更新イベント
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:transcript-update', {
        conversationId,
        newMessages: [
          {
            role: 'assistant',
            content: [{ text: "[Tool uses: fs_read, git_status]\nI'll help you check the files." }],
          },
        ],
        totalMessageCount: 2,
      });

      // 検証: ツール使用イベント
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:tool-activity', {
        conversationId,
        tools: ['fs_read', 'git_status'],
        message: "I'll help you check the files.",
      });
    });

    it('複数の新しいメッセージが一度に追加された場合、すべて検出する', async () => {
      const initialTranscript = [{ role: 'user', content: [{ text: 'Hello' }] }];

      await createTestDatabaseWithTranscript(
        tempDbPath,
        '/test/project',
        conversationId,
        initialTranscript
      );

      // 監視開始
      await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath,
        { pollIntervalMs: 100 }
      );

      // 複数のメッセージを一度に追加
      setTimeout(async () => {
        const updatedTranscript = [
          ...initialTranscript,
          { role: 'assistant', content: [{ text: 'Hi!' }] },
          { role: 'user', content: [{ text: 'How are you?' }] },
          { role: 'assistant', content: [{ text: "I'm doing well, thanks!" }] },
        ];
        await updateTranscriptInDatabase(
          tempDbPath,
          '/test/project',
          conversationId,
          updatedTranscript
        );
      }, 150);

      await new Promise(resolve => setTimeout(resolve, 300));

      // 検証
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:transcript-update', {
        conversationId,
        newMessages: [
          { role: 'assistant', content: [{ text: 'Hi!' }] },
          { role: 'user', content: [{ text: 'How are you?' }] },
          { role: 'assistant', content: [{ text: "I'm doing well, thanks!" }] },
        ],
        totalMessageCount: 4,
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しないconversation_idでもエラーを発生させない', async () => {
      // 空のDBを作成
      await createEmptyTestDatabase(tempDbPath);

      // テスト実行
      const result = await monitorConversationTranscript(
        'nonexistent-conversation-id',
        '/test/project',
        mockEmitCallback,
        tempDbPath
      );

      // 検証: エラーではなく、監視は開始される（データが見つからないだけ）
      expect(result).toBe(true);
    });

    it('データベースアクセスエラーでも適切に処理される', async () => {
      const invalidDbPath = '/invalid/database/path.sqlite3';

      // テスト実行
      const result = await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        invalidDbPath
      );

      // 検証: エラーでも監視自体は開始される
      expect(result).toBe(true);
    });
  });

  describe('リソース管理', () => {
    it('監視停止時にタイマーがクリアされる', async () => {
      await createTestDatabaseWithTranscript(tempDbPath, '/test/project', conversationId, []);

      // 監視開始
      await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath
      );

      // タイマーが設定されていることを確認
      expect(TranscriptMonitor.isMonitoring(conversationId)).toBe(true);

      // 監視停止
      TranscriptMonitor.stopMonitoring(conversationId);

      // タイマーがクリアされていることを確認
      expect(TranscriptMonitor.isMonitoring(conversationId)).toBe(false);
    });

    it('同時に複数のconversationを監視できる', async () => {
      const conversationId2 = 'test-conversation-id-456';
      const mockEmitCallback2 = vi.fn();

      await createTestDatabaseWithTranscript(tempDbPath, '/test/project1', conversationId, []);
      await createAdditionalConversationInDatabase(
        tempDbPath,
        '/test/project2',
        conversationId2,
        []
      );

      // 2つのconversationで監視開始
      const result1 = await monitorConversationTranscript(
        conversationId,
        '/test/project1',
        mockEmitCallback,
        tempDbPath
      );
      const result2 = await monitorConversationTranscript(
        conversationId2,
        '/test/project2',
        mockEmitCallback2,
        tempDbPath
      );

      // 検証
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(TranscriptMonitor.isMonitoring(conversationId)).toBe(true);
      expect(TranscriptMonitor.isMonitoring(conversationId2)).toBe(true);

      // クリーンアップ
      TranscriptMonitor.stopMonitoring(conversationId2);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大きなtranscript配列でも効率的に新規メッセージを検出する', async () => {
      // 大きな初期transcript（500メッセージ）
      const largeTranscript = Array.from({ length: 500 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: [{ text: `Message ${i + 1}` }],
      }));

      await createTestDatabaseWithTranscript(
        tempDbPath,
        '/test/project',
        conversationId,
        largeTranscript
      );

      // 監視開始
      await monitorConversationTranscript(
        conversationId,
        '/test/project',
        mockEmitCallback,
        tempDbPath,
        { pollIntervalMs: 100 }
      );

      // 新しいメッセージを追加
      setTimeout(async () => {
        const updatedTranscript = [
          ...largeTranscript,
          { role: 'user', content: [{ text: 'New message 501' }] },
        ];
        await updateTranscriptInDatabase(
          tempDbPath,
          '/test/project',
          conversationId,
          updatedTranscript
        );
      }, 150);

      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 300));
      const endTime = Date.now();

      // 検証: パフォーマンス（350ms以内で処理完了）
      expect(endTime - startTime).toBeLessThan(350);
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:transcript-update', {
        conversationId,
        newMessages: [{ role: 'user', content: [{ text: 'New message 501' }] }],
        totalMessageCount: 501,
      });
    });
  });
});

// テストヘルパー関数
async function createTestDatabaseWithTranscript(
  dbPath: string,
  projectPath: string,
  conversationId: string,
  transcript: any[]
) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);

  // 既存のテーブルがあれば削除してから作成
  db.exec(`DROP TABLE IF EXISTS conversations`);
  db.exec(`CREATE TABLE conversations (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  const conversationData = {
    conversation_id: conversationId,
    transcript: transcript,
    history: [],
    model: 'CLAUDE_SONNET_4_20250514_V1_0',
  };

  const stmt = db.prepare('INSERT INTO conversations (key, value) VALUES (?, ?)');
  stmt.run(projectPath, JSON.stringify(conversationData));
  db.close();
}

async function createEmptyTestDatabase(dbPath: string) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);

  db.exec(`DROP TABLE IF EXISTS conversations`);
  db.exec(`CREATE TABLE conversations (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  db.close();
}

async function updateTranscriptInDatabase(
  dbPath: string,
  projectPath: string,
  conversationId: string,
  updatedTranscript: any[]
) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);

  const conversationData = {
    conversation_id: conversationId,
    transcript: updatedTranscript,
    history: [],
    model: 'CLAUDE_SONNET_4_20250514_V1_0',
  };

  const stmt = db.prepare('UPDATE conversations SET value = ? WHERE key = ?');
  stmt.run(JSON.stringify(conversationData), projectPath);
  db.close();
}

async function createAdditionalConversationInDatabase(
  dbPath: string,
  projectPath: string,
  conversationId: string,
  transcript: any[]
) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);

  const conversationData = {
    conversation_id: conversationId,
    transcript: transcript,
    history: [],
    model: 'CLAUDE_SONNET_4_20250514_V1_0',
  };

  const stmt = db.prepare('INSERT INTO conversations (key, value) VALUES (?, ?)');
  stmt.run(projectPath, JSON.stringify(conversationData));
  db.close();
}

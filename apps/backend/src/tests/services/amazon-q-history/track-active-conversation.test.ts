/**
 * TDD: conversation_id追跡システムのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import type { QProcessSession } from '../../../services/amazon-q-cli/session-manager/types';

// テスト対象（まだ実装していない）
import {
  trackActiveConversation,
  ConversationTracker,
} from '../../../services/amazon-q-history/track-active-conversation';

describe('trackActiveConversation', () => {
  let mockSession: QProcessSession;
  let mockEmitCallback: ReturnType<typeof vi.fn>;
  let tempDbPath: string;

  beforeEach(() => {
    // テスト用セッションオブジェクト
    mockSession = {
      sessionId: 'test-session-123',
      projectPath: '/Users/test/dev/test-project',
      process: {
        pid: 12345,
        kill: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
        emit: vi.fn(),
        addListener: vi.fn(),
        off: vi.fn(),
        removeAllListeners: vi.fn(),
        setMaxListeners: vi.fn(),
        getMaxListeners: vi.fn(() => 10),
        listeners: vi.fn(() => []),
        rawListeners: vi.fn(() => []),
        listenerCount: vi.fn(() => 0),
        prependListener: vi.fn(),
        prependOnceListener: vi.fn(),
        eventNames: vi.fn(() => []),
        connected: true,
        killed: false,
        exitCode: null,
        signalCode: null,
        spawnargs: [],
        spawnfile: '',
        stdin: null,
        stdout: null,
        stderr: null,
        stdio: [] as any,
        channel: undefined,
        send: undefined,
        disconnect: undefined,
        unref: vi.fn(),
        ref: vi.fn(),
      } as any,
      status: 'running',
      startTime: new Date(),
      isThinkingActive: false,
      bufferTimeout: undefined,
      initializationTimeout: undefined,
    };

    mockEmitCallback = vi.fn();
    tempDbPath = '/tmp/test-conversation-tracking.sqlite3';
  });

  afterEach(() => {
    // クリーンアップ
    ConversationTracker.stopTracking(mockSession.sessionId);
  });

  describe('基本的な追跡機能', () => {
    it('新しいセッションの追跡を開始できる', async () => {
      // テスト実行
      const result = await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath);

      // 検証
      expect(result).toBe(true);
      expect(ConversationTracker.isTracking(mockSession.sessionId)).toBe(true);
    });

    it('既に追跡中のセッションは重複追跡されない', async () => {
      // 最初の追跡開始
      await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath);

      // 同じセッションで再度追跡開始
      const result = await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath);

      // 検証: 重複追跡は拒否される
      expect(result).toBe(false);
    });

    it('追跡を停止できる', async () => {
      // 追跡開始
      await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath);
      expect(ConversationTracker.isTracking(mockSession.sessionId)).toBe(true);

      // 追跡停止
      ConversationTracker.stopTracking(mockSession.sessionId);

      // 検証
      expect(ConversationTracker.isTracking(mockSession.sessionId)).toBe(false);
    });
  });

  describe('conversation_id検出機能', () => {
    it('conversation_idが見つかった場合、適切なイベントを発火する', async () => {
      const expectedConversationId = 'test-conversation-id-123';

      // conversation_idが存在するテストDBを作成
      await createTestDatabaseWithConversation(
        tempDbPath,
        mockSession.projectPath,
        expectedConversationId
      );

      // 追跡開始
      await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath);

      // ポーリングが実行されるまで少し待機
      await new Promise(resolve => setTimeout(resolve, 1100)); // 1秒 + マージン

      // 検証
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:ready', {
        sessionId: mockSession.sessionId,
        conversationId: expectedConversationId,
        projectPath: mockSession.projectPath,
      });
    });

    it('30秒以内にconversation_idが見つからない場合、タイムアウトイベントを発火する', async () => {
      // conversation_idが存在しないテストDBを作成
      await createTestDatabaseEmpty(tempDbPath);

      // タイムアウト時間を短縮してテスト高速化
      const shortTimeoutMs = 100;

      // 追跡開始（短いタイムアウト設定）
      await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath, {
        timeoutMs: shortTimeoutMs,
        pollIntervalMs: 20,
      });

      // タイムアウトが発生するまで待機
      await new Promise(resolve => setTimeout(resolve, shortTimeoutMs + 50));

      // 検証
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:timeout', {
        sessionId: mockSession.sessionId,
        error: 'conversation_id取得がタイムアウトしました',
      });
    });

    it('複数回ポーリングしてconversation_idを検出する', async () => {
      // 最初は空のDBを作成
      await createTestDatabaseEmpty(tempDbPath);

      // 追跡開始
      await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath, {
        timeoutMs: 5000,
        pollIntervalMs: 100,
      });

      // 少し後にconversation_idを追加
      setTimeout(async () => {
        await addConversationToDatabase(
          tempDbPath,
          mockSession.projectPath,
          'delayed-conversation-id'
        );
      }, 200);

      // ポーリングが成功するまで待機
      await new Promise(resolve => setTimeout(resolve, 400));

      // 検証
      expect(mockEmitCallback).toHaveBeenCalledWith('conversation:ready', {
        sessionId: mockSession.sessionId,
        conversationId: 'delayed-conversation-id',
        projectPath: mockSession.projectPath,
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なプロジェクトパスでもエラーを発生させない', async () => {
      const invalidSession = {
        ...mockSession,
        projectPath: '/invalid/path/that/does/not/exist',
      };

      // テスト実行
      const result = await trackActiveConversation(invalidSession, mockEmitCallback, tempDbPath);

      // 検証: エラーではなく、タイムアウトが発生することを期待
      expect(result).toBe(true);
    });

    it('データベースアクセスエラーでも適切に処理される', async () => {
      const invalidDbPath = '/invalid/database/path.sqlite3';

      // テスト実行
      const result = await trackActiveConversation(mockSession, mockEmitCallback, invalidDbPath);

      // 検証: エラーでも追跡自体は開始される
      expect(result).toBe(true);
    });
  });

  describe('リソース管理', () => {
    it('追跡停止時にタイマーがクリアされる', async () => {
      // 追跡開始
      await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath);

      // タイマーが設定されていることを確認
      expect(ConversationTracker.isTracking(mockSession.sessionId)).toBe(true);

      // 追跡停止
      ConversationTracker.stopTracking(mockSession.sessionId);

      // タイマーがクリアされていることを確認
      expect(ConversationTracker.isTracking(mockSession.sessionId)).toBe(false);
    });

    it('同時に複数のセッションを追跡できる', async () => {
      const session2 = { ...mockSession, sessionId: 'test-session-456' };
      const mockEmitCallback2 = vi.fn();

      // 2つのセッションで追跡開始
      const result1 = await trackActiveConversation(mockSession, mockEmitCallback, tempDbPath);
      const result2 = await trackActiveConversation(session2, mockEmitCallback2, tempDbPath);

      // 検証
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(ConversationTracker.isTracking(mockSession.sessionId)).toBe(true);
      expect(ConversationTracker.isTracking(session2.sessionId)).toBe(true);

      // クリーンアップ
      ConversationTracker.stopTracking(session2.sessionId);
    });
  });
});

// テストヘルパー関数
async function createTestDatabaseWithConversation(
  dbPath: string,
  projectPath: string,
  conversationId: string
) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);

  // 既存のテーブルがあれば削除してから作成
  db.exec(`DROP TABLE IF EXISTS conversations`);
  db.exec(`CREATE TABLE conversations (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  const stmt = db.prepare('INSERT INTO conversations (key, value) VALUES (?, ?)');
  stmt.run(projectPath, JSON.stringify({ conversation_id: conversationId }));
  db.close();
}

async function createTestDatabaseEmpty(dbPath: string) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);

  // 既存のテーブルがあれば削除してから作成
  db.exec(`DROP TABLE IF EXISTS conversations`);
  db.exec(`CREATE TABLE conversations (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  db.close();
}

async function addConversationToDatabase(
  dbPath: string,
  projectPath: string,
  conversationId: string
) {
  const Database = (await import('better-sqlite3')).default;
  const db = new Database(dbPath);

  const stmt = db.prepare('INSERT INTO conversations (key, value) VALUES (?, ?)');
  stmt.run(projectPath, JSON.stringify({ conversation_id: conversationId }));
  db.close();
}

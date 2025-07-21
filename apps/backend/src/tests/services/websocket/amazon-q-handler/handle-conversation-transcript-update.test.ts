/**
 * TDD: conversation transcript更新ハンドラーのテスト
 */

import { createServer } from 'http';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';

// テスト対象（まだ実装していない）
import {
  handleConversationTranscriptUpdate,
  ConversationHandler,
} from '../../../../services/websocket/amazon-q-handler/handle-conversation-transcript-update';

// Mock dependencies
vi.mock('../../../../services/amazon-q-history', () => ({
  trackActiveConversation: vi.fn(),
  monitorConversationTranscript: vi.fn(),
  ConversationTracker: {
    isTracking: vi.fn(),
    stopTracking: vi.fn(),
  },
  TranscriptMonitor: {
    isMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
  },
}));

describe('handleConversationTranscriptUpdate', () => {
  let io: SocketIOServer;
  let mockSession: any;
  let httpServer: any;

  beforeEach(() => {
    // Socket.IOサーバーのセットアップ
    httpServer = createServer();
    io = new SocketIOServer(httpServer);

    // ConversationHandlerにテスト用IOを設定
    ConversationHandler.setTestIO(io);

    // テスト用セッションオブジェクト
    mockSession = {
      sessionId: 'test-session-123',
      projectPath: '/Users/test/dev/test-project',
      process: {
        pid: 12345,
        kill: vi.fn(),
      },
      status: 'running',
      startTime: new Date(),
      isThinkingActive: false,
    };
  });

  afterEach(() => {
    // クリーンアップ
    ConversationHandler.stopAllHandling();
    io.close();
    httpServer.close();
  });

  describe('基本的なハンドリング機能', () => {
    it('新しいセッションのconversation処理を開始できる', async () => {
      const result = await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // 検証
      expect(result).toBe(true);
      expect(ConversationHandler.isHandling(mockSession.sessionId)).toBe(true);
    });

    it('既にハンドリング中のセッションは重複処理されない', async () => {
      // 最初のハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // 同じセッションで再度ハンドリング開始
      const result = await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // 検証: 重複ハンドリングは拒否される
      expect(result).toBe(false);
    });

    it('ハンドリングを停止できる', async () => {
      // ハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');
      expect(ConversationHandler.isHandling(mockSession.sessionId)).toBe(true);

      // ハンドリング停止
      ConversationHandler.stopHandling(mockSession.sessionId);

      // 検証
      expect(ConversationHandler.isHandling(mockSession.sessionId)).toBe(false);
    });
  });

  describe('conversation:ready イベント処理', () => {
    it('conversation_idが確定した場合、適切なWebSocketイベントを発火する', async () => {
      const mockSocket = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      io.to = vi.fn().mockReturnValue(mockSocket);

      // conversation:readyイベントをシミュレート
      const conversationReadyData = {
        sessionId: mockSession.sessionId,
        conversationId: 'test-conversation-id-123',
        projectPath: mockSession.projectPath,
      };

      // ハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // conversation:readyイベントを内部的に発火
      ConversationHandler.emitConversationReady('test-room-123', conversationReadyData);

      // 検証
      expect(io.to).toHaveBeenCalledWith('test-room-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:ready', conversationReadyData);
    });

    it('conversation:readyイベント後に自動的にtranscript監視を開始する', async () => {
      const mockMonitorConversationTranscript = vi.fn().mockResolvedValue(true);

      // モックの設定
      const { monitorConversationTranscript } = await import(
        '../../../../services/amazon-q-history'
      );
      vi.mocked(monitorConversationTranscript).mockImplementation(
        mockMonitorConversationTranscript
      );

      const conversationReadyData = {
        sessionId: mockSession.sessionId,
        conversationId: 'test-conversation-id-123',
        projectPath: mockSession.projectPath,
      };

      // ハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // conversation:readyイベントを内部的に発火
      await ConversationHandler.handleConversationReady(conversationReadyData, 'test-room-123');

      // 検証: transcript監視が開始されることを確認
      expect(mockMonitorConversationTranscript).toHaveBeenCalledWith(
        'test-conversation-id-123',
        mockSession.projectPath,
        expect.any(Function), // emitCallback
        undefined, // customDbPath
        expect.any(Object) // options
      );
    });
  });

  describe('conversation:transcript-update イベント処理', () => {
    it('新しいメッセージが検出された場合、WebSocketイベントを発火する', async () => {
      const mockSocket = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      io.to = vi.fn().mockReturnValue(mockSocket);

      const transcriptUpdateData = {
        conversationId: 'test-conversation-id-123',
        newMessages: [
          { role: 'user' as const, content: [{ text: 'Hello' }] },
          { role: 'assistant' as const, content: [{ text: 'Hi there!' }] },
        ],
        totalMessageCount: 2,
      };

      // ハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // transcript更新イベントを内部的に発火
      ConversationHandler.emitTranscriptUpdate('test-room-123', transcriptUpdateData);

      // 検証
      expect(io.to).toHaveBeenCalledWith('test-room-123');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'conversation:transcript-update',
        transcriptUpdateData
      );
    });
  });

  describe('conversation:tool-activity イベント処理', () => {
    it('ツール使用が検出された場合、WebSocketイベントを発火する', async () => {
      const mockSocket = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      io.to = vi.fn().mockReturnValue(mockSocket);

      const toolActivityData = {
        conversationId: 'test-conversation-id-123',
        tools: ['fs_read', 'git_status'],
        message: "I'll help you check the files.",
      };

      // ハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // ツールアクティビティイベントを内部的に発火
      ConversationHandler.emitToolActivity('test-room-123', toolActivityData);

      // 検証
      expect(io.to).toHaveBeenCalledWith('test-room-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:tool-activity', toolActivityData);
    });
  });

  describe('conversation:timeout イベント処理', () => {
    it('タイムアウトが発生した場合、WebSocketイベントを発火する', async () => {
      const mockSocket = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      io.to = vi.fn().mockReturnValue(mockSocket);

      const timeoutData = {
        sessionId: mockSession.sessionId,
        error: 'conversation_id取得がタイムアウトしました',
      };

      // ハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // タイムアウトイベントを内部的に発火
      ConversationHandler.emitTimeout('test-room-123', timeoutData);

      // 検証
      expect(io.to).toHaveBeenCalledWith('test-room-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:timeout', timeoutData);
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なセッションでもエラーを発生させない', async () => {
      const invalidSession = {
        ...mockSession,
        sessionId: '',
        projectPath: '',
      };

      // テスト実行
      const result = await handleConversationTranscriptUpdate(io, invalidSession, 'test-room-123');

      // 検証: エラーではなく、ハンドリングは開始される
      expect(result).toBe(true);
    });

    it('Socket.IOエラーでも適切に処理される', async () => {
      const faultyIO = {
        to: vi.fn().mockImplementation(() => {
          throw new Error('Socket.IO error');
        }),
      } as any;

      // テスト実行
      const result = await handleConversationTranscriptUpdate(
        faultyIO,
        mockSession,
        'test-room-123'
      );

      // 検証: エラーでもハンドリング自体は開始される
      expect(result).toBe(true);
    });
  });

  describe('リソース管理', () => {
    it('ハンドリング停止時にすべてのサブシステムが停止される', async () => {
      const { ConversationTracker, TranscriptMonitor } = await import(
        '../../../../services/amazon-q-history'
      );

      const mockStopTracking = vi.fn();
      const mockStopMonitoring = vi.fn();

      vi.mocked(ConversationTracker.stopTracking).mockImplementation(mockStopTracking);
      vi.mocked(TranscriptMonitor.stopMonitoring).mockImplementation(mockStopMonitoring);

      // ハンドリング開始
      await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');

      // conversation_idが確定したことをシミュレート
      const conversationId = 'test-conversation-id-123';
      ConversationHandler.setConversationId(mockSession.sessionId, conversationId);

      // フラグを手動で設定（実際のハンドリングセッションの状態をシミュレート）
      const handlingSession = (ConversationHandler as any).getHandlingSession(
        mockSession.sessionId
      );
      if (handlingSession) {
        handlingSession.isTrackingActive = true;
        handlingSession.isMonitoringActive = true;
      }

      // ハンドリング停止
      ConversationHandler.stopHandling(mockSession.sessionId);

      // 検証: 関連するサブシステムも停止される
      expect(mockStopTracking).toHaveBeenCalledWith(mockSession.sessionId);
      expect(mockStopMonitoring).toHaveBeenCalledWith(conversationId);
    });

    it('同時に複数のセッションをハンドリングできる', async () => {
      const session2 = { ...mockSession, sessionId: 'test-session-456' };

      // 2つのセッションでハンドリング開始
      const result1 = await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');
      const result2 = await handleConversationTranscriptUpdate(io, session2, 'test-room-456');

      // 検証
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(ConversationHandler.isHandling(mockSession.sessionId)).toBe(true);
      expect(ConversationHandler.isHandling(session2.sessionId)).toBe(true);

      // クリーンアップ
      ConversationHandler.stopHandling(session2.sessionId);
    });
  });

  describe('統合テスト', () => {
    it('フルワークフロー: セッション開始 → conversation_id確定 → transcript監視 → メッセージ更新', async () => {
      const mockSocket = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      io.to = vi.fn().mockReturnValue(mockSocket);

      const mockTrackActiveConversation = vi.fn().mockResolvedValue(true);
      const mockMonitorConversationTranscript = vi.fn().mockResolvedValue(true);

      const { trackActiveConversation, monitorConversationTranscript } = await import(
        '../../../../services/amazon-q-history'
      );
      vi.mocked(trackActiveConversation).mockImplementation(mockTrackActiveConversation);
      vi.mocked(monitorConversationTranscript).mockImplementation(
        mockMonitorConversationTranscript
      );

      // 1. ハンドリング開始
      const result = await handleConversationTranscriptUpdate(io, mockSession, 'test-room-123');
      expect(result).toBe(true);

      // 2. conversation_id確定をシミュレート
      const conversationReadyData = {
        sessionId: mockSession.sessionId,
        conversationId: 'test-conversation-id-123',
        projectPath: mockSession.projectPath,
      };
      // conversation:readyイベントを明示的に発火
      ConversationHandler.emitConversationReady('test-room-123', conversationReadyData);
      await ConversationHandler.handleConversationReady(conversationReadyData, 'test-room-123');

      // 3. transcript更新をシミュレート
      const transcriptUpdateData = {
        conversationId: 'test-conversation-id-123',
        newMessages: [{ role: 'user' as const, content: [{ text: 'Hello World' }] }],
        totalMessageCount: 1,
      };
      ConversationHandler.emitTranscriptUpdate('test-room-123', transcriptUpdateData);

      // 検証: 全体のフローが正常に動作する
      expect(mockTrackActiveConversation).toHaveBeenCalled();
      expect(mockMonitorConversationTranscript).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('conversation:ready', conversationReadyData);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'conversation:transcript-update',
        transcriptUpdateData
      );
    });
  });
});

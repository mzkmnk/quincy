import type { ChildProcess } from 'child_process';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { QProcessSession, QProcessOptions, IToolDetectionBuffer } from '../../../../types';

// テスト対象
import { handleStdout } from '../../../../services/amazon-q-cli/message-handler/handle-stdout';

describe('handleStdout', () => {
  let mockSession: QProcessSession;
  let mockEmitCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEmitCallback = vi.fn();
    mockSession = {
      sessionId: 'q_session_test',
      process: {} as unknown as ChildProcess,
      workingDir: '/test',
      startTime: Date.now(),
      status: 'running',
      lastActivity: Date.now(),
      command: 'test',
      options: {} as unknown as QProcessOptions,
      outputBuffer: '',
      errorBuffer: '',
      bufferFlushCount: 0,
      incompleteOutputLine: '',
      incompleteErrorLine: '',
      lastInfoMessage: '',
      lastInfoMessageTime: 0,
      lastThinkingMessage: '',
      hasThinkingSent: false,
      initializationBuffer: [],
      initializationPhase: false,
      currentTools: [],
      toolBuffer: '',
      toolDetectionBuffer: {} as unknown as IToolDetectionBuffer,
    } as QProcessSession;
  });

  describe('基本的なメッセージ処理', () => {
    it('単一行のメッセージを即座に送信', () => {
      const data = Buffer.from('Hello World\n');

      handleStdout(mockSession, data, mockEmitCallback);

      expect(mockEmitCallback).toHaveBeenCalledWith('q:response', {
        sessionId: 'q_session_test',
        data: 'Hello World\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
    });

    it('複数行のメッセージを各行ごとに送信', () => {
      const data = Buffer.from('Line 1\nLine 2\nLine 3\n');

      handleStdout(mockSession, data, mockEmitCallback);

      expect(mockEmitCallback).toHaveBeenCalledTimes(3);
      expect(mockEmitCallback).toHaveBeenNthCalledWith(1, 'q:response', {
        sessionId: 'q_session_test',
        data: 'Line 1\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
      expect(mockEmitCallback).toHaveBeenNthCalledWith(2, 'q:response', {
        sessionId: 'q_session_test',
        data: 'Line 2\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
      expect(mockEmitCallback).toHaveBeenNthCalledWith(3, 'q:response', {
        sessionId: 'q_session_test',
        data: 'Line 3\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
    });

    it('不完全な行を次回のデータと結合', () => {
      // 最初のデータ（改行なし）
      handleStdout(mockSession, Buffer.from('Hello '), mockEmitCallback);
      expect(mockEmitCallback).not.toHaveBeenCalled();

      // 2回目のデータで完成
      handleStdout(mockSession, Buffer.from('World\n'), mockEmitCallback);
      expect(mockEmitCallback).toHaveBeenCalledWith('q:response', {
        sessionId: 'q_session_test',
        data: 'Hello World\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
    });
  });

  describe('ツール検出と処理', () => {
    it('ツール使用行を検出してツール情報を蓄積', () => {
      const data = Buffer.from('🛠️ Using tool: fs_read 🛠️ Using tool: github_mcp\nSome content\n');

      handleStdout(mockSession, data, mockEmitCallback);

      expect(mockSession.currentTools).toEqual(['fs_read', 'github_mcp']);
      expect(mockEmitCallback).toHaveBeenCalledWith('q:response', {
        sessionId: 'q_session_test',
        data: 'Some content\n',
        type: 'stream',
        tools: ['fs_read', 'github_mcp'],
        hasToolContent: true,
      });
    });

    it('複数のツール行でツール情報を累積', () => {
      handleStdout(mockSession, Buffer.from('🛠️ Using tool: fs_read\n'), mockEmitCallback);
      handleStdout(
        mockSession,
        Buffer.from('🛠️ Using tool: github_mcp\nContent\n'),
        mockEmitCallback
      );

      expect(mockSession.currentTools).toEqual(['fs_read', 'github_mcp']);
      expect(mockEmitCallback).toHaveBeenLastCalledWith('q:response', {
        sessionId: 'q_session_test',
        data: 'Content\n',
        type: 'stream',
        tools: ['fs_read', 'github_mcp'],
        hasToolContent: true,
      });
    });
  });

  describe('特殊行の処理', () => {
    it('thinkingメッセージをスキップ', () => {
      const data = Buffer.from('thinking\nActual content\n');

      handleStdout(mockSession, data, mockEmitCallback);

      expect(mockEmitCallback).toHaveBeenCalledTimes(1);
      expect(mockEmitCallback).toHaveBeenCalledWith('q:response', {
        sessionId: 'q_session_test',
        data: 'Actual content\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
    });

    it('プロンプト行（>）でツール状態をリセット', () => {
      // ツールを設定
      mockSession.currentTools = ['fs_read'];

      const data = Buffer.from('>\n');
      const mockPromptCallback = vi.fn();

      handleStdout(mockSession, data, mockEmitCallback, mockPromptCallback);

      expect(mockSession.currentTools).toEqual([]);
      expect(mockPromptCallback).toHaveBeenCalledWith('q_session_test');
      expect(mockEmitCallback).not.toHaveBeenCalled();
    });

    it('ANSI エスケープコードを除去', () => {
      const data = Buffer.from('\x1b[31mRed text\x1b[0m\n');

      handleStdout(mockSession, data, mockEmitCallback);

      expect(mockEmitCallback).toHaveBeenCalledWith('q:response', {
        sessionId: 'q_session_test',
        data: 'Red text\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('空のデータでもエラーにならない', () => {
      expect(() => {
        handleStdout(mockSession, Buffer.from(''), mockEmitCallback);
      }).not.toThrow();
    });

    it('無効なUTF-8データでもエラーにならない', () => {
      expect(() => {
        handleStdout(mockSession, Buffer.from([0xff, 0xfe]), mockEmitCallback);
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    it('大量のデータを効率的に処理', () => {
      const largeData = 'Line '.repeat(1000) + '\n';
      const data = Buffer.from(largeData);

      const start = Date.now();
      handleStdout(mockSession, data, mockEmitCallback);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // 100ms以内
      expect(mockEmitCallback).toHaveBeenCalledTimes(1);
    });
  });
});

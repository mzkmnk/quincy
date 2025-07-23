import type { ChildProcess } from 'child_process';

import { describe, it, expect, vi } from 'vitest';
import type { QResponseEvent } from '@quincy/shared';

import type { QProcessSession, QProcessOptions } from '../../../../types';
import { handleStdout } from '../../../../services/amazon-q-cli/message-handler/handle-stdout';
import { handleStderr } from '../../../../services/amazon-q-cli/message-handler/handle-stderr';
import { sendInput } from '../../../../services/amazon-q-cli/session-manager/send-input';
import { ToolDetectionBuffer } from '../../../../services/amazon-q-message-parser';

describe('thinking完全スキップの統合テスト', () => {
  let mockSession: QProcessSession;
  let emittedEvents: Array<{ event: string; data: QResponseEvent }>;
  let promptReadyEmitted: boolean;

  beforeEach(() => {
    emittedEvents = [];
    promptReadyEmitted = false;

    mockSession = {
      sessionId: 'q_session_test',
      process: {
        stdin: {
          write: vi.fn(),
          destroyed: false,
        },
      } as unknown as ChildProcess,
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
      toolDetectionBuffer: new ToolDetectionBuffer(),
    };
  });

  describe('thinkingメッセージの完全スキップ', () => {
    it('複数のthinkingメッセージが来ても完全にスキップされる', () => {
      const emitCallback = (event: string, data: QResponseEvent) => {
        emittedEvents.push({ event, data });
      };

      // 1回目のthinking
      handleStdout(mockSession, Buffer.from('Thinking...\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // 2回目のthinking
      handleStdout(mockSession, Buffer.from('Thinking...\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // 3回目のthinking（違うパターン）
      handleStdout(mockSession, Buffer.from('thinking\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // thinkingメッセージが1回も送信されていないことを確認
      const thinkingEvents = emittedEvents.filter(e =>
        e.data.data.toLowerCase().includes('thinking')
      );
      expect(thinkingEvents).toHaveLength(0);
    });

    it('プロンプト表示後もthinkingはスキップされる', async () => {
      const emitCallback = (event: string, data: QResponseEvent) => {
        emittedEvents.push({ event, data });
      };

      // 1回目のthinking
      handleStdout(mockSession, Buffer.from('Thinking...\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // プロンプト表示
      handleStdout(mockSession, Buffer.from('>\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // タイムアウトを待ってからフラッシュ処理を確認
      await new Promise(resolve => setTimeout(resolve, 250));

      // プロンプト準備完了が通知されたことを確認
      expect(promptReadyEmitted).toBe(true);

      // 2回目のthinking（プロンプト後）
      handleStdout(mockSession, Buffer.from('Thinking...\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // thinkingメッセージが1回も送信されていないことを確認
      const thinkingEvents = emittedEvents.filter(e =>
        e.data.data.toLowerCase().includes('thinking')
      );
      expect(thinkingEvents).toHaveLength(0);
    });

    it('新規メッセージ送信後もthinkingはスキップされる', async () => {
      const emitCallback = (event: string, data: QResponseEvent) => {
        emittedEvents.push({ event, data });
      };

      // 1回目のthinking
      handleStdout(mockSession, Buffer.from('Thinking...\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // 新規メッセージ送信
      const sessions = new Map<string, QProcessSession>();
      sessions.set('q_session_test', mockSession);

      const result = await sendInput(sessions, 'q_session_test', 'New message\n');
      expect(result).toBe(true);

      // 2回目のthinking（新規メッセージ後）
      handleStdout(mockSession, Buffer.from('Thinking...\n'), emitCallback, () => {
        promptReadyEmitted = true;
      });

      // thinkingメッセージが1回も送信されていないことを確認
      const thinkingEvents = emittedEvents.filter(e =>
        e.data.data.toLowerCase().includes('thinking')
      );
      expect(thinkingEvents).toHaveLength(0);
    });
  });

  describe('stderrからのthinking処理', () => {
    it('stderrからのthinkingも完全にスキップされる', () => {
      const emitCallback = vi.fn();

      // 1回目のthinking（stderr）
      handleStderr(
        mockSession,
        Buffer.from('Thinking...\n'),
        emitCallback,
        () => {},
        () => {}
      );

      // 2回目のthinking（stderr）
      handleStderr(
        mockSession,
        Buffer.from('Thinking...\n'),
        emitCallback,
        () => {},
        () => {}
      );

      // q:infoイベントが1回も発行されていないことを確認
      expect(emitCallback).toHaveBeenCalledTimes(0);
    });
  });
});

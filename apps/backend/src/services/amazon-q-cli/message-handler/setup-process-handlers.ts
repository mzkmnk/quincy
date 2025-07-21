import type { QCompleteEvent, QErrorEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { StdoutHandler } from '../stream-handler';
import { ChatStateManager } from '../realtime-chat';
import type { StreamHandlerCallbacks } from '../stream-handler/types';

/**
 * プロセスハンドラーのセットアップ
 * stdout/stderr直接監視によるリアルタイムチャット処理を実装
 */
export function setupProcessHandlers(
  session: QProcessSession,
  emitCallback: (
    event: string,
    data: QCompleteEvent | QErrorEvent | Record<string, unknown>
  ) => void,
  deleteSessionCallback: (sessionId: string) => void
): void {
  const { process } = session;

  // チャット状態管理
  const chatStateManager = new ChatStateManager();

  // Stdoutハンドラーのコールバック定義
  const streamCallbacks: StreamHandlerCallbacks = {
    onThinkingStart: data => {
      chatStateManager.startThinking();
      emitCallback('q:chat-start', {
        sessionId: session.sessionId,
        timestamp: data.timestamp,
        type: 'chat-start',
      });
    },
    onThinkingUpdate: () => {
      // Thinkingアップデートは現在送信しない（必要に応じて追加）
    },
    onThinkingEnd: () => {
      // Thinking終了時は状態遷移のみ（メッセージ受信時に処理）
    },
    onChatMessage: data => {
      if (chatStateManager.isThinking()) {
        chatStateManager.startResponding();
      }

      emitCallback('q:chat-message', {
        sessionId: session.sessionId,
        content: data.content,
        timestamp: data.timestamp,
        isComplete: true,
        type: 'chat-message',
      });

      // 応答完了
      chatStateManager.completeResponse();
      emitCallback('q:chat-complete', {
        sessionId: session.sessionId,
        timestamp: data.timestamp,
        thinkingDuration: chatStateManager.getThinkingDuration(),
        type: 'chat-complete',
      });
    },
    onPromptReady: data => {
      emitCallback('q:prompt-ready', {
        sessionId: session.sessionId,
        timestamp: data.timestamp,
      });
    },
    onOutput: () => {
      // 通常の出力は現在無視（必要に応じて処理）
    },
  };

  // Stdoutハンドラーの作成
  const stdoutHandler = new StdoutHandler(streamCallbacks);

  // stdout監視
  process.stdout?.on('data', (chunk: Buffer) => {
    stdoutHandler.processChunk(chunk);
  });

  // stderr監視（エラー出力）
  process.stderr?.on('data', (chunk: Buffer) => {
    const error = chunk.toString();
    if (error.trim()) {
      emitCallback('q:error', {
        sessionId: session.sessionId,
        error: error,
        code: 'STDERR_OUTPUT',
      });
    }
  });

  // プロセス終了の処理
  process.on('exit', (code: number | null) => {
    // タイムアウトクリア（レガシー互換性）
    if (session.bufferTimeout) {
      clearTimeout(session.bufferTimeout);
      session.bufferTimeout = undefined;
    }
    if (session.initializationTimeout) {
      clearTimeout(session.initializationTimeout);
      session.initializationTimeout = undefined;
    }

    session.status = code === 0 ? 'completed' : 'error';

    const completeEvent: QCompleteEvent = {
      sessionId: session.sessionId,
      exitCode: code ?? -1,
    };

    emitCallback('q:complete', completeEvent);

    // セッションを即座に無効化してID衝突を防ぐ
    session.status = 'terminated';

    // チャット状態をリセット
    chatStateManager.reset();
    session.isThinkingActive = false;

    // セッションをクリーンアップ（遅延実行）
    setTimeout(() => {
      deleteSessionCallback(session.sessionId);
    }, 5000); // 簡素化により5秒に短縮
  });

  // プロセスエラーの処理
  process.on('error', (error: Error) => {
    session.status = 'error';

    const errorEvent: QErrorEvent = {
      sessionId: session.sessionId,
      error: error.message,
      code: 'PROCESS_ERROR',
    };

    emitCallback('q:error', errorEvent);
  });
}

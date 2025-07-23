import type { QCompleteEvent, QErrorEvent, QResponseEvent, QInfoEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';

import { handleStdout } from './handle-stdout';
import { handleStderr } from './handle-stderr';

export function setupProcessHandlers(
  session: QProcessSession,
  emitCallback: (
    event: string,
    data: QResponseEvent | QInfoEvent | QErrorEvent | QCompleteEvent
  ) => void,
  _flushIncompleteOutputLineCallback: (
    session: QProcessSession,
    emitCallback: (event: string, data: QResponseEvent) => void
  ) => void,
  flushIncompleteErrorLineCallback: (session: QProcessSession) => void,
  addToInitializationBufferCallback: (session: QProcessSession, message: string) => void,
  flushInitializationBufferCallback: (session: QProcessSession) => void,
  _flushOutputBufferCallback: (session: QProcessSession) => void,
  deleteSessionCallback: (sessionId: string) => void,
  emitPromptReadyCallback?: (sessionId: string) => void
): void {
  const { process } = session;

  // 標準出力の処理（シンプル実装）
  process.stdout?.on('data', (data: Buffer) => {
    handleStdout(session, data, emitCallback, emitPromptReadyCallback);
  });

  // 標準エラー出力の処理（行ベース分類付き）
  process.stderr?.on('data', (data: Buffer) => {
    handleStderr(
      session,
      data,
      emitCallback,
      addToInitializationBufferCallback,
      flushIncompleteErrorLineCallback
    );
  });

  // プロセス終了の処理
  process.on('exit', (code: number | null) => {
    // 残りの初期化バッファをフラッシュ
    if (session.initializationPhase && session.initializationBuffer.length > 0) {
      flushInitializationBufferCallback(session);
    }

    // 残りの不完全なエラー行をフラッシュ
    if (session.incompleteErrorLine.trim()) {
      flushIncompleteErrorLineCallback(session);
    }

    // 残りの不完全な出力行があれば最終メッセージとして送信
    if (session.incompleteOutputLine.trim()) {
      const responseEvent: QResponseEvent = {
        sessionId: session.sessionId,
        data: session.incompleteOutputLine + '\n',
        type: 'stream',
        tools: session.currentTools || [],
        hasToolContent: (session.currentTools || []).length > 0,
      };
      emitCallback('q:response', responseEvent);
    }

    // 初期化タイムアウトをクリア
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

    // セッションをクリーンアップ（遅延実行）
    setTimeout(() => {
      deleteSessionCallback(session.sessionId);
    }, 10000);
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

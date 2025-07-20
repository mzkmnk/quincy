import type { QCompleteEvent, QErrorEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';

/**
 * プロセスハンドラーの簡素版セットアップ
 * SQLite3変更検知により、複雑なストリーミング処理は不要
 * プロセス生存監視とエラーハンドリングのみ実装
 */
export function setupProcessHandlers(
  session: QProcessSession,
  emitCallback: (event: string, data: QErrorEvent | QCompleteEvent) => void,
  deleteSessionCallback: (sessionId: string) => void
): void {
  const { process } = session;

  // SQLite3変更検知があるため、stdout/stderrの複雑な処理は不要
  // 基本的なプロセス監視のみ実装

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

    // Thinking状態をリセット（レガシー互換性）
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

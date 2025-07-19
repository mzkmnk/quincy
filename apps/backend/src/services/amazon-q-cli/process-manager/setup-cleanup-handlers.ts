import type { QProcessSession } from '../session-manager/types';

import { cleanupInactiveSessions } from './cleanup-inactive-sessions';

// プロセスリスナーが既に登録されているかを追跡
let processListenersRegistered = false;

export function setupCleanupHandlers(
  sessions: Map<string, QProcessSession>,
  destroyCallback: () => void
): NodeJS.Timeout {
  // テスト環境ではプロセスリスナーを登録しない
  if (process.env.NODE_ENV !== 'test' && !processListenersRegistered) {
    // プロセス終了時のクリーンアップ
    const cleanup = (): void => {
      destroyCallback();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    process.on('uncaughtException', cleanup);
    process.on('unhandledRejection', cleanup);

    processListenersRegistered = true;
  }

  // 非アクティブセッションの定期クリーンアップ
  return setInterval(() => {
    cleanupInactiveSessions();
  }, 60000); // 1分毎
}

import type { QProcessSession } from '../session-manager/types';

import { cleanupInactiveSessions } from './cleanup-inactive-sessions';

export function setupCleanupHandlers(
  sessions: Map<string, QProcessSession>,
  destroyCallback: () => void
): NodeJS.Timeout {
  // プロセス終了時のクリーンアップ
  const cleanup = (): void => {
    destroyCallback();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
  process.on('uncaughtException', cleanup);
  process.on('unhandledRejection', cleanup);

  // 非アクティブセッションの定期クリーンアップ
  return setInterval(() => {
    cleanupInactiveSessions(sessions);
  }, 60000); // 1分毎
}
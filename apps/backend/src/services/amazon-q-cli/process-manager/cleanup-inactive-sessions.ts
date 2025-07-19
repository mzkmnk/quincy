import type { QProcessSession } from '../session-manager/types';

export function cleanupInactiveSessions(_sessions: Map<string, QProcessSession>): void {
  // 時間ベースのセッション終了を無効化（ユーザー要求により）
  // セッションは手動での終了またはプロセス終了時のみクリーンアップされます
}
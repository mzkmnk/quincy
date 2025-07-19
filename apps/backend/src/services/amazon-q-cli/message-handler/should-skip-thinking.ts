import type { QProcessSession } from '../session-manager/types';

export function shouldSkipThinking(session: QProcessSession): boolean {
  // 既にThinking状態がアクティブの場合は常にスキップ（1回のみ表示）
  return session.isThinkingActive;
}

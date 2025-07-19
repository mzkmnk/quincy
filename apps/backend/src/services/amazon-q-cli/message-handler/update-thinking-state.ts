import type { QProcessSession } from '../session-manager/types';

export function updateThinkingState(session: QProcessSession): void {
  session.isThinkingActive = true;
  session.lastThinkingTime = Date.now();

  // Thinking状態はセッション終了まで維持（1回のみ表示のため）
}

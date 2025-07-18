import type { QSessionStartedEvent } from '@quincy/shared';
import { sessionState } from '../session.state';

/**
 * アクティブセッションに切り替える
 * @param qSession 切り替える先のAmazon Qセッション
 */
export function switchToActiveSession(qSession: QSessionStartedEvent): void {
  sessionState.update(state => ({
    ...state,
    currentQSession: qSession,
    sessionStarting: false,
    sessionError: null
  }));
}
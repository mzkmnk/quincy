import { sessionState } from '../session.state';

/**
 * 現在のセッションをクリアする
 */
export function clearCurrentSession(): void {
  sessionState.update(state => ({
    ...state,
    currentSession: null,
    currentQSession: null,
    sessionStarting: false,
    sessionError: null
  }));
}
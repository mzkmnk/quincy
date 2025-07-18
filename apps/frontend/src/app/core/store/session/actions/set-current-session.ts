import type { Session } from '@quincy/shared';
import { sessionState } from '../session.state';

/**
 * 現在のセッションを設定する
 * @param session 設定するセッション（nullの場合は選択解除）
 */
export function setCurrentSession(session: Session | null): void {
  sessionState.update(state => ({
    ...state,
    currentSession: session
  }));
}
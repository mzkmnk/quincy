import type { Session } from '@quincy/shared';
import { sessionState } from '../session.state';

/**
 * セッションを追加する
 * @param session 追加するセッション
 */
export function addSession(session: Session): void {
  sessionState.update(state => ({
    ...state,
    sessions: [...state.sessions, session]
  }));
}
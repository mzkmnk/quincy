import type { Session } from '@quincy/shared';
import { sessionState } from '../session.state';

/**
 * セッションリストを設定する
 * @param sessions 設定するセッションの配列
 */
export function setSessions(sessions: Session[]): void {
  sessionState.update(state => ({
    ...state,
    sessions
  }));
}
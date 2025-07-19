import { currentSession } from '../session.state';

/**
 * 現在のセッションを取得する
 * @returns 現在のセッション
 */
export function getCurrentSession() {
  return currentSession;
}

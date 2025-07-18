import { sessions } from '../session.state';

/**
 * セッションリストを取得する
 * @returns セッションリスト
 */
export function getSessions() {
  return sessions;
}
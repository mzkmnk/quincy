import { currentQSession } from '../session.state';

/**
 * 現在のAmazon Qセッションを取得する
 * @returns 現在のAmazon Qセッション
 */
export function getCurrentQSession() {
  return currentQSession;
}

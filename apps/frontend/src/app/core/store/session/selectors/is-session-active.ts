import { isQSessionActive } from '../session.state';

/**
 * セッションがアクティブかどうかを取得する
 * @returns セッションがアクティブかどうか
 */
export function getIsSessionActive() {
  return isQSessionActive;
}

import { sessionStarting } from '../session.state';

/**
 * セッション開始状態を取得する
 * @returns セッション開始状態
 */
export function getSessionStarting() {
  return sessionStarting;
}
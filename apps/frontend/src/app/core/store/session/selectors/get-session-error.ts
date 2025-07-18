import { sessionError } from '../session.state';

/**
 * セッションエラーを取得する
 * @returns セッションエラー
 */
export function getSessionError() {
  return sessionError;
}
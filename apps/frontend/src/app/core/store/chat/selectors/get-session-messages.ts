import { getCurrentSessionMessages } from '../chat.state';

/**
 * セッション別チャットメッセージを取得する
 * @param sessionId セッションID
 * @returns セッション別チャットメッセージ
 */
export function getSessionMessages(sessionId: string) {
  return getCurrentSessionMessages(sessionId);
}

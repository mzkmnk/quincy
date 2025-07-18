import { chatMessages } from '../chat.state';

/**
 * チャットメッセージを取得する
 * @returns チャットメッセージ
 */
export function getChatMessages() {
  return chatMessages;
}
import { hasChatMessages } from '../chat.state';

/**
 * チャットメッセージが存在するかを取得する
 * @returns チャットメッセージが存在するかどうか
 */
export function getHasChatMessages() {
  return hasChatMessages;
}

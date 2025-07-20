import { ChatMessage } from '../../../../../core/store/app.state';

/**
 * メッセージ数を取得する（タイピングインジケーター除く）
 * @param messages メッセージ配列
 * @returns メッセージ数
 */
export function getMessageCount(messages: ChatMessage[]): number {
  return messages.filter(m => !m.isTyping).length;
}

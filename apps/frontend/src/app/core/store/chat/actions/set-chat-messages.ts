import { ChatMessage, chatState } from '../chat.state';

/**
 * チャットメッセージリストを設定する
 * @param messages 設定するチャットメッセージの配列
 */
export function setChatMessages(messages: ChatMessage[]): void {
  chatState.update(state => ({
    ...state,
    chatMessages: messages,
  }));
}

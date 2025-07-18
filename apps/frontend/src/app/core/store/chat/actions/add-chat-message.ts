import { ChatMessage, chatState } from '../chat.state';

/**
 * チャットメッセージを追加する
 * @param message 追加するチャットメッセージ
 */
export function addChatMessage(message: ChatMessage): void {
  chatState.update(state => ({
    ...state,
    chatMessages: [...state.chatMessages, message]
  }));
}
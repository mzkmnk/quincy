import { ChatMessage, chatState } from '../chat.state';

/**
 * チャットメッセージを更新する
 * @param messageId 更新するメッセージのID
 * @param updates 更新する内容
 */
export function updateChatMessage(messageId: string, updates: Partial<ChatMessage>): void {
  chatState.update(state => ({
    ...state,
    chatMessages: state.chatMessages.map(m => (m.id === messageId ? { ...m, ...updates } : m)),
  }));
}

import { chatState } from '../chat.state';

/**
 * チャットメッセージを削除する
 * @param messageId 削除するメッセージのID
 */
export function removeChatMessage(messageId: string): void {
  chatState.update(state => ({
    ...state,
    chatMessages: state.chatMessages.filter(m => m.id !== messageId)
  }));
}
import { chatState } from '../chat.state';

/**
 * チャットメッセージをクリアする
 */
export function clearChatMessages(): void {
  chatState.update(state => ({
    ...state,
    chatMessages: [],
  }));
}

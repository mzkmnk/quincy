import { AppStore, ChatMessage } from '../../../../../core/store/app.state';

/**
 * タイピングインジケーターを追加する
 * @param appStore アプリストア
 * @param scrollToBottomRequest スクロール要求signal
 */
export function addTypingIndicator(
  appStore: AppStore,
  scrollToBottomRequest: { set: (value: boolean) => void }
): void {
  const currentSession = appStore.currentQSession();
  const typingMessage: ChatMessage = {
    id: 'typing',
    content: '',
    sender: 'assistant',
    timestamp: new Date(),
    isTyping: true,
    sessionId: currentSession?.sessionId
  };

  appStore.addChatMessage(typingMessage);
  scrollToBottomRequest.set(true);
}
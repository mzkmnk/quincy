import { AppStore, ChatMessage } from '../../../../../core/store/app.state';

/**
 * メッセージを追加する
 * @param content メッセージ内容
 * @param sender 送信者
 * @param appStore アプリストア
 * @param scrollToBottomRequest スクロール要求signal
 * @returns メッセージID
 */
export function addMessage(
  content: string,
  sender: 'user' | 'assistant',
  appStore: AppStore,
  scrollToBottomRequest: { set: (value: boolean) => void }
): string {
  const currentSession = appStore.currentQSession();
  const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newMessage: ChatMessage = {
    id: messageId,
    content,
    sender,
    timestamp: new Date(),
    sessionId: currentSession?.sessionId,
  };

  appStore.addChatMessage(newMessage);
  scrollToBottomRequest.set(true);

  return messageId;
}

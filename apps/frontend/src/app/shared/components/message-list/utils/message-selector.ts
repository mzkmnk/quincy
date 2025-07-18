import { AppStore, ChatMessage } from '../../../../core/store/app.state';
import { convertDisplayMessagesToChatMessages } from '../../../utils/converters';
import { generateWelcomeMessage } from '../../../utils/generators';

/**
 * 表示するメッセージを選択する
 * @param appStore アプリストア
 * @returns 表示するメッセージ配列
 */
export function selectMessages(appStore: AppStore): ChatMessage[] {
  const currentSession = appStore.currentQSession();
  const currentConversation = appStore.currentQConversation();
  const detailedMessages = appStore.detailedHistoryMessages();

  // 1. リアルタイムチャットモード（最優先）
  if (currentSession) {
    const sessionMessages = appStore.currentSessionMessages();
    return sessionMessages.length === 0 ? generateWelcomeMessage() : sessionMessages;
  }

  // 2. 詳細履歴表示モード
  if (currentConversation && detailedMessages.length > 0) {
    return convertDisplayMessagesToChatMessages(detailedMessages);
  }

  // 3. 従来の履歴表示モード
  if (currentConversation && !currentSession) {
    const allMessages = appStore.chatMessages();
    return allMessages.length === 0 ? [] : allMessages;
  }

  // 4. デフォルト状態
  return generateWelcomeMessage();
}
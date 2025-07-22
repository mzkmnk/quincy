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

  console.log('💬 Message selector state:', {
    hasCurrentSession: !!currentSession,
    hasCurrentConversation: !!currentConversation,
    detailedMessagesCount: detailedMessages.length,
    sessionId: currentSession?.sessionId,
    conversationId: currentConversation?.conversation_id
  });

  // 1. 詳細履歴表示モード（最優先）- セッションがなく、会話と詳細メッセージがある場合
  if (currentConversation && detailedMessages.length > 0 && !currentSession) {
    console.log('💬 Using detailed history messages:', detailedMessages.length);
    return convertDisplayMessagesToChatMessages(detailedMessages);
  }

  // 2. リアルタイムチャットモード
  if (currentSession) {
    const sessionMessages = appStore.currentSessionMessages();
    console.log('💬 Using session messages:', sessionMessages.length);
    return sessionMessages.length === 0 ? generateWelcomeMessage() : sessionMessages;
  }

  // 3. 従来の履歴表示モード
  if (currentConversation && !currentSession) {
    const allMessages = appStore.chatMessages();
    console.log('💬 Using legacy chat messages:', allMessages.length);
    return allMessages.length === 0 ? [] : allMessages;
  }

  // 4. デフォルト状態
  console.log('💬 Using welcome message');
  return generateWelcomeMessage();
}

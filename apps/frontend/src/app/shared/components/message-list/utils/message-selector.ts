import { AppStore, ChatMessage } from '../../../../core/store/app.state';
import { convertDisplayMessagesToChatMessages } from '../../../utils/converters';
import { generateWelcomeMessage } from '../../../utils/generators';
import { chatStore } from '../../../../core/store/chat/actions';

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
    const allMessages = chatStore.getAllMessages();
    // CommonChatMessageをChatMessageに変換
    const convertedMessages: ChatMessage[] = allMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.role === 'user' ? 'user' : 'assistant',
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      tools: msg.tools,
      hasToolContent: msg.hasToolContent,
    }));
    return convertedMessages.length === 0 ? [] : convertedMessages;
  }

  // 4. デフォルト状態
  return generateWelcomeMessage();
}

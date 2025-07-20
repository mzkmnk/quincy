/**
 * ツール情報対応メッセージ追加機能
 */

import { AppStore, ChatMessage } from '../../../../../core/store/app.state';
import type { ToolList } from '../../../../../core/types/tool-display.types';

/**
 * ツール情報を含むメッセージを追加する
 *
 * @param content メッセージ内容
 * @param sender 送信者（'user' | 'assistant'）
 * @param appStore アプリケーションストア
 * @param scrollToBottomRequest スクロール更新リクエスト
 * @param tools ツール情報（オプション）
 * @param hasToolContent ツールコンテンツの有無（オプション）
 * @returns 生成されたメッセージID
 */
export function addMessageWithTools(
  content: string,
  sender: 'user' | 'assistant',
  appStore: AppStore,
  scrollToBottomRequest: { set: (value: boolean) => void },
  tools?: ToolList,
  hasToolContent?: boolean
): string {
  const currentSession = appStore.currentQSession();
  const messageId = `msg_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const newMessage: ChatMessage = {
    id: messageId,
    content,
    sender,
    timestamp: new Date(),
    sessionId: currentSession?.sessionId,
    tools,
    hasToolContent,
  };

  appStore.addChatMessage(newMessage);
  scrollToBottomRequest.set(true);

  return messageId;
}

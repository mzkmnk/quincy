/**
 * ツール情報対応ストリーミングアップデート処理
 */

import type { ChatMessage } from '../../../../core/store/chat/chat.state';
import { ToolList } from '../../../../core/types/tool-display.types';

/**
 * ツール情報を含むストリーミングメッセージアップデートハンドラー
 *
 * @param content 追加するコンテンツ
 * @param tools 新しいツール情報
 * @param hasToolContent ツールコンテンツの有無
 * @param streamingMessageId ストリーミングメッセージID
 * @param messageIndexMap メッセージインデックスマップ
 * @param getCurrentMessages 現在のメッセージ取得関数
 * @param updateChatMessage メッセージ更新関数
 * @param markForScrollUpdate スクロール更新マーク関数
 * @param updateMessageIndexMap メッセージインデックス更新関数
 */
export function handleStreamingUpdateWithTools(
  content: string,
  tools: ToolList | undefined,
  hasToolContent: boolean,
  streamingMessageId: string,
  messageIndexMap: Map<string, number>,
  getCurrentMessages: () => ChatMessage[],
  updateChatMessage: (messageId: string, updates: Partial<ChatMessage>) => void,
  markForScrollUpdate: () => void,
  updateMessageIndexMap: () => void
): void {
  // 最適化された検索でメッセージを更新
  const messageIndex = messageIndexMap.get(streamingMessageId);
  const currentMessages = getCurrentMessages();

  let targetMessage: ChatMessage | undefined;

  if (
    messageIndex !== undefined &&
    messageIndex < currentMessages.length &&
    currentMessages[messageIndex].id === streamingMessageId
  ) {
    targetMessage = currentMessages[messageIndex];
  } else {
    // インデックスマップが古い場合は再構築
    updateMessageIndexMap();
    const newMessageIndex = messageIndexMap.get(streamingMessageId);
    if (newMessageIndex !== undefined && newMessageIndex < currentMessages.length) {
      targetMessage = currentMessages[newMessageIndex];
    }
  }

  if (!targetMessage) {
    return; // メッセージが見つからない場合は処理しない
  }

  // コンテンツの更新
  const updatedContent = targetMessage.content + content;

  // ツール情報の統合処理
  const updates: Partial<ChatMessage> = {
    content: updatedContent,
  };

  if (tools && tools.length > 0) {
    // 既存のツールと新しいツールの統合（重複排除）
    const existingTools = targetMessage.tools || [];
    const combinedTools = [...existingTools];

    tools.forEach(tool => {
      if (!combinedTools.includes(tool)) {
        combinedTools.push(tool);
      }
    });

    updates.tools = combinedTools;
    updates.hasToolContent = true;
  } else if (tools !== undefined) {
    // 空のツールリストが明示的に渡された場合、既存ツールは保持
    const existingTools = targetMessage.tools || [];
    updates.tools = existingTools;
    updates.hasToolContent = existingTools.length > 0;
  }
  // tools が undefined の場合はツール情報を更新しない

  updateChatMessage(streamingMessageId, updates);
  markForScrollUpdate();
}

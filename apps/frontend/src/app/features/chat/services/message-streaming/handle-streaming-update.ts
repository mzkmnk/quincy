
/**
 * ストリーミングメッセージを更新する
 * @param content 追加するコンテンツ
 * @param streamingMessageId ストリーミングメッセージID
 * @param messageIndexMap メッセージインデックスマップ
 * @param getCurrentMessages 現在のメッセージ取得関数
 * @param updateChatMessage メッセージ更新関数
 * @param markForScrollUpdate スクロール更新マーク関数
 * @param updateMessageIndexMap メッセージインデックス更新関数
 */
export function handleStreamingUpdate(
  content: string,
  streamingMessageId: string,
  messageIndexMap: Map<string, number>,
  getCurrentMessages: () => any[],
  updateChatMessage: (messageId: string, updates: any) => void,
  markForScrollUpdate: () => void,
  updateMessageIndexMap: () => void
): void {
  // 最適化された検索でメッセージを更新
  const messageIndex = messageIndexMap.get(streamingMessageId);
  const currentMessages = getCurrentMessages();

  if (messageIndex !== undefined && messageIndex < currentMessages.length &&
    currentMessages[messageIndex].id === streamingMessageId) {
    const updatedContent = currentMessages[messageIndex].content + content;
    updateChatMessage(streamingMessageId, { content: updatedContent });

    // ストリーミング更新時にスクロール更新をトリガー
    markForScrollUpdate();
  } else {
    // インデックスマップが古い場合は再構築
    updateMessageIndexMap();
    const newMessageIndex = messageIndexMap.get(streamingMessageId);
    if (newMessageIndex !== undefined && newMessageIndex < currentMessages.length) {
      const updatedContent = currentMessages[newMessageIndex].content + content;
      updateChatMessage(streamingMessageId, { content: updatedContent });
      markForScrollUpdate();
    }
  }
}
import { signal } from '@angular/core';

/**
 * ストリーミングメッセージを開始する
 * @param content 初期コンテンツ
 * @param addMessage メッセージ追加関数
 * @param streamingMessageId ストリーミングメッセージIDのsignal
 * @param updateMessageIndexMap メッセージインデックス更新関数
 * @returns 作成されたメッセージID
 */
export function handleStreamingStart(
  content: string,
  addMessage: (content: string, type: 'user' | 'assistant') => string,
  streamingMessageId: ReturnType<typeof signal<string | null>>,
  updateMessageIndexMap: () => void
): string {
  // 新しいストリーミングメッセージを開始
  const messageId = addMessage(content, 'assistant');
  streamingMessageId.set(messageId);

  // インデックスマップを更新
  updateMessageIndexMap();

  return messageId;
}
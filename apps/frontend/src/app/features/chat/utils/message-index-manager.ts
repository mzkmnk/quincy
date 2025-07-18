/**
 * メッセージIDインデックスマップを更新する
 * @param messageIndexMap メッセージインデックスマップ
 * @param messages メッセージ配列
 */
export function updateMessageIndexMap(
  messageIndexMap: Map<string, number>,
  messages: Array<{ id: string }>
): void {
  messageIndexMap.clear();
  messages.forEach((message, index) => {
    messageIndexMap.set(message.id, index);
  });
}
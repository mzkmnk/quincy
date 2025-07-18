/**
 * メッセージの妥当性を検証する
 * @param message 検証するメッセージ
 * @returns 検証結果（trueの場合は有効）
 */
export function isValidMessage(message: string): boolean {
  return message.trim().length > 0;
}
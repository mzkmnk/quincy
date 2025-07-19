/**
 * メッセージの妥当性を検証する
 * @param message 検証するメッセージ
 * @returns 検証結果（trueの場合は有効）
 */
export function isValidMessage(message: string): boolean {
  // 型チェック：文字列以外の場合は無効
  if (typeof message !== 'string') {
    return false;
  }

  return message.trim().length > 0;
}

/**
 * メッセージコンテンツをフォーマットする
 * @param content フォーマットするコンテンツ
 * @param maxLength 最大文字数（省略時はそのまま返す）
 * @returns フォーマットされたコンテンツ
 */
export function formatMessageContent(content: string, maxLength?: number): string {
  if (!content) {
    return '';
  }

  const trimmed = content.trim();
  
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + '...';
  }

  return trimmed;
}
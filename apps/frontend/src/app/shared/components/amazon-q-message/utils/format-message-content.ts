/**
 * メッセージコンテンツを表示用にフォーマットする
 */
export function formatMessageContent(content: string): string {
  if (!content) {
    return '';
  }
  
  return content.trim();
}
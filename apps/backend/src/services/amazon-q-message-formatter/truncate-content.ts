/**
 * 長いコンテンツを適切に切り詰める
 */

export function truncateContent(content: string, maxLength: number = 1000): string {
  if (content.length <= maxLength) {
    return content;
  }
  
  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}
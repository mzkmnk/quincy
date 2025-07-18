/**
 * 思考内容を整形
 */

import type { ToolUse } from '../amazon-q-history-types';

export function formatThinkingContent(content: string, toolsUsed: ToolUse[]): string {
  let formattedContent = content;
  
  // ツール使用情報を追加
  if (toolsUsed.length > 0) {
    const toolNames = toolsUsed.map(tool => tool.name).join(', ');
    formattedContent += `\n\n🔧 使用ツール: ${toolNames}`;
  }
  
  return formattedContent;
}
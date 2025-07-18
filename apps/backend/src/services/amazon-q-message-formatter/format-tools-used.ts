/**
 * ツール使用情報を読みやすい形式に整形
 */

import type { ToolUse } from '../amazon-q-history-types';

export function formatToolsUsed(toolsUsed: ToolUse[]): string {
  if (toolsUsed.length === 0) {
    return 'ツールは使用されませんでした';
  }
  
  const toolSummary = toolsUsed.map(tool => {
    const argsSummary = Object.keys(tool.args).length > 0 
      ? ` (${Object.keys(tool.args).length}個の引数)`
      : '';
    return `• ${tool.name}${argsSummary}`;
  }).join('\n');
  
  return `🔧 使用されたツール:\n${toolSummary}`;
}
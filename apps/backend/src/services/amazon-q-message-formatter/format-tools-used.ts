/**
 * ツール使用情報を読みやすい形式に整形
 */

import type { ToolUse } from '../amazon-q-history-types';

export function formatToolsUsed(toolsUsed: ToolUse[]): string {
  if (toolsUsed.length === 0) {
    return '';
  }

  // 重複を除去しつつ順序を保持
  const uniqueToolNames = Array.from(new Set(toolsUsed.map(tool => tool.name)));

  return `tools: ${uniqueToolNames.join(', ')}`;
}

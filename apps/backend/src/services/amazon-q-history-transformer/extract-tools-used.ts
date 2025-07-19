/**
 * 使用されたツールを抽出
 */

import type { ToolUse, HistoryEntry } from '../amazon-q-history-types';
import { isToolUseResponse } from '../amazon-q-history-types';

export function extractToolsUsed(entries: HistoryEntry[]): ToolUse[] {
  const tools: ToolUse[] = [];

  for (const entry of entries) {
    const [, responseMessage] = entry;
    if (isToolUseResponse(responseMessage)) {
      tools.push(...responseMessage.ToolUse.tool_uses);
    }
  }

  return tools;
}

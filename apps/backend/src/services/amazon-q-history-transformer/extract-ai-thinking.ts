/**
 * AI の思考過程を抽出（ToolUse の連続）
 */

import type { HistoryEntry } from '../amazon-q-history-types';
import { isToolUseResponse } from '../amazon-q-history-types';

export function extractAiThinking(entries: HistoryEntry[]): string[] {
  const thinking: string[] = [];
  
  for (const entry of entries) {
    const [, responseMessage] = entry;
    if (isToolUseResponse(responseMessage)) {
      thinking.push(responseMessage.ToolUse.content);
    }
  }
  
  return thinking;
}
/**
 * AI の最終回答を抽出
 */

import type { HistoryEntry } from '../amazon-q-history-types';
import { isResponse, isToolUseResponse } from '../amazon-q-history-types';

export function extractAiResponse(entries: HistoryEntry[]): string {
  // 最後のエントリから順番に探す
  for (let i = entries.length - 1; i >= 0; i--) {
    const [, responseMessage] = entries[i];
    if (isResponse(responseMessage)) {
      return responseMessage.Response.content;
    }
  }

  // Responseがない場合は最後のToolUseを使用
  for (let i = entries.length - 1; i >= 0; i--) {
    const [, responseMessage] = entries[i];
    if (isToolUseResponse(responseMessage)) {
      return responseMessage.ToolUse.content;
    }
  }

  return 'No AI response found';
}

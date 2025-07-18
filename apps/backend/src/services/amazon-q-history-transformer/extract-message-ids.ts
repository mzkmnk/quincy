/**
 * メッセージIDを抽出
 */

import type { HistoryEntry } from '../amazon-q-history-types';
import { isToolUseResponse, isResponse } from '../amazon-q-history-types';

export function extractMessageIds(entries: HistoryEntry[]): string[] {
  const messageIds: string[] = [];
  
  for (const entry of entries) {
    const [, responseMessage] = entry;
    if (isToolUseResponse(responseMessage)) {
      messageIds.push(responseMessage.ToolUse.message_id);
    } else if (isResponse(responseMessage)) {
      messageIds.push(responseMessage.Response.message_id);
    }
  }
  
  return messageIds;
}
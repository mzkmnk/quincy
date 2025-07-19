/**
 * ユーザーメッセージを抽出
 * 最初のPromptメッセージを探す
 */

import type { HistoryEntry } from '../amazon-q-history-types';
import { isPromptMessage } from '../amazon-q-history-types';

export function extractUserMessage(entries: HistoryEntry[]): string {
  for (const entry of entries) {
    const [inputMessage] = entry;
    if (isPromptMessage(inputMessage.content)) {
      return inputMessage.content.Prompt.prompt;
    }
  }
  return 'No user message found';
}

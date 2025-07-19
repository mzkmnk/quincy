/**
 * Promptエントリの数をカウント（実際のユーザーメッセージ数）
 */

import type { HistoryData } from '../amazon-q-history-types';

export function countPromptEntries(historyData: HistoryData): number {
  let promptCount = 0;

  for (const entry of historyData.history) {
    const [inputMessage] = entry;
    if (inputMessage?.content && 'Prompt' in inputMessage.content) {
      promptCount++;
    }
  }

  return promptCount;
}

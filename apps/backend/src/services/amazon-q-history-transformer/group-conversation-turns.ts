/**
 * historyデータを会話ターンにグループ化
 * Responseが来るまでを1つのターンとして処理
 */

import type { HistoryData, ConversationTurn, HistoryEntry } from '../amazon-q-history-types';
import { isResponse } from '../amazon-q-history-types';

import { createConversationTurn } from './create-conversation-turn';

export function groupConversationTurns(historyData: HistoryData): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  const entries = historyData.history;
  
  let currentTurnEntries: HistoryEntry[] = [];
  let startIndex = 0;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    currentTurnEntries.push(entry);
    
    // 応答がResponseキーを持つ場合、ターン終了
    if (isResponse(entry[1])) {
      try {
        const turn = createConversationTurn(currentTurnEntries, startIndex, i);
        turns.push(turn);
        currentTurnEntries = [];
        startIndex = i + 1;
      } catch {
        // エラーが発生した場合も次のターンに進む
        currentTurnEntries = [];
        startIndex = i + 1;
      }
    }
  }
  
  // 最後のターンが未完了の場合（Responseがない場合）
  if (currentTurnEntries.length > 0) {
    try {
      const turn = createConversationTurn(currentTurnEntries, startIndex, entries.length - 1);
      turns.push(turn);
    } catch {
      // エラーは無視
    }
  }
  
  return turns;
}
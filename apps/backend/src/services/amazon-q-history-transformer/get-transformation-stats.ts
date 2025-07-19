/**
 * 変換の統計情報を取得
 */

import type { HistoryData } from '../amazon-q-history-types';

import { groupConversationTurns } from './group-conversation-turns';

export function getTransformationStats(historyData: HistoryData): {
  totalEntries: number;
  totalTurns: number;
  averageToolUsesPerTurn: number;
  totalToolUses: number;
} {
  const totalEntries = historyData.history.length;
  const turns = groupConversationTurns(historyData);
  const totalTurns = turns.length;
  
  let totalToolUses = 0;
  for (const turn of turns) {
    totalToolUses += turn.metadata.toolsUsed.length;
  }
  
  const averageToolUsesPerTurn = totalTurns > 0 ? totalToolUses / totalTurns : 0;
  
  return {
    totalEntries,
    totalTurns,
    averageToolUsesPerTurn,
    totalToolUses
  };
}
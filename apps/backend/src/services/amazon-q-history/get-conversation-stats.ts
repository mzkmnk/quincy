/**
 * 会話ターンの統計情報を取得
 */

import Database from 'better-sqlite3';
import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';
import { DB_PATH, SQL_QUERIES } from './constants';
import { HistoryTransformer } from '../amazon-q-history-transformer';

export async function getConversationStats(projectPath: string): Promise<{
  totalEntries: number;
  totalTurns: number;
  averageToolUsesPerTurn: number;
  totalToolUses: number;
} | null> {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const historyTransformer = new HistoryTransformer();
    
    try {
      const stmt = db.prepare(SQL_QUERIES.GET_CONVERSATION_BY_KEY);
      const result = stmt.get(projectPath) as { value: string } | undefined;
      
      if (!result) {
        return null;
      }

      const conversationData: AmazonQConversationWithHistory = JSON.parse(result.value);
      
      if (!conversationData.history || !historyTransformer.isValidHistoryData(conversationData.history)) {
        return null;
      }

      const normalizedHistory = historyTransformer.normalizeHistoryData(conversationData.history);
      return historyTransformer.getTransformationStats(normalizedHistory);
      
    } finally {
      db.close();
    }
  } catch (error) {
    return null;
  }
}
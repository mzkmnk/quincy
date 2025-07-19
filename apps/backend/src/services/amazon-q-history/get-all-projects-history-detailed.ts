/**
 * 全プロジェクトの履歴をhistoryデータ付きで取得
 */

import Database from 'better-sqlite3';

import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';
import { HistoryTransformer } from '../amazon-q-history-transformer';

import { DB_PATH, SQL_QUERIES } from './constants';
import { isDatabaseAvailable } from './is-database-available';

export async function getAllProjectsHistoryDetailed(): Promise<{
  projectPath: string;
  conversation_id: string;
  hasHistoryData: boolean;
  messageCount: number;
  turnCount: number;
  lastUpdated: Date;
  model: string;
}[]> {
  try {
    if (!isDatabaseAvailable()) {
      throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。');
    }
    
    const db = new Database(DB_PATH, { readonly: true });
    const historyTransformer = new HistoryTransformer();
    
    try {
      const stmt = db.prepare(SQL_QUERIES.GET_ALL_CONVERSATIONS);
      const results = stmt.all() as { key: string; value: string }[];
      
      const detailedMetadata: {
        projectPath: string;
        conversation_id: string;
        hasHistoryData: boolean;
        messageCount: number;
        turnCount: number;
        lastUpdated: Date;
        model: string;
      }[] = [];

      for (const row of results) {
        try {
          const conversation: AmazonQConversationWithHistory = JSON.parse(row.value);
          
          let hasHistoryData = false;
          let turnCount = 0;
          let messageCount = 0;
          
          if (conversation.history && historyTransformer.isValidHistoryData(conversation.history)) {
            hasHistoryData = true;
            const normalizedHistory = historyTransformer.normalizeHistoryData(conversation.history);
            const turns = historyTransformer.groupConversationTurns(normalizedHistory);
            turnCount = turns.length;
            messageCount = historyTransformer.countPromptEntries(normalizedHistory);
          }
          
          detailedMetadata.push({
            projectPath: row.key,
            conversation_id: conversation.conversation_id,
            hasHistoryData,
            messageCount,
            turnCount,
            lastUpdated: new Date(),
            model: conversation.model
          });
        } catch (_parseError) {
          // パースエラーは無視して次の行を処理
        }
      }

      return detailedMetadata.sort((a, b) => a.projectPath.localeCompare(b.projectPath));
    } finally {
      db.close();
    }
  } catch (error) {
    throw new Error(`履歴取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}
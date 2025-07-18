/**
 * 全プロジェクトの会話メタデータを取得
 */

import Database from 'better-sqlite3';
import type { ConversationMetadata } from '@quincy/shared';
import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';
import { DB_PATH, SQL_QUERIES } from './constants';
import { isDatabaseAvailable } from './is-database-available';
import { HistoryTransformer } from '../amazon-q-history-transformer';

export async function getAllProjectsHistory(): Promise<ConversationMetadata[]> {
  try {
    if (!isDatabaseAvailable()) {
      throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。');
    }
    
    const db = new Database(DB_PATH, { readonly: true });
    const historyTransformer = new HistoryTransformer();
    
    try {
      const stmt = db.prepare(SQL_QUERIES.GET_ALL_CONVERSATIONS);
      const results = stmt.all() as { key: string; value: string }[];
      
      const metadata: ConversationMetadata[] = [];

      for (const row of results) {
        try {
          const conversation: AmazonQConversationWithHistory = JSON.parse(row.value);
          
          // historyデータからユーザーメッセージ数を計算（Promptエントリ数ベース）
          let messageCount = 0;
          if (conversation.history && historyTransformer.isValidHistoryData(conversation.history)) {
            const normalizedHistory = historyTransformer.normalizeHistoryData(conversation.history);
            messageCount = historyTransformer.countPromptEntries(normalizedHistory);
          }
          
          metadata.push({
            projectPath: row.key,
            conversation_id: conversation.conversation_id,
            messageCount,
            lastUpdated: new Date(), // SQLiteには更新日時がないため現在時刻を使用
            model: conversation.model
          });
        } catch (parseError) {
          // パースエラーは無視して次の行を処理
        }
      }

      // プロジェクトパスでアルファベット順にソート（安定した並び替え）
      return metadata.sort((a, b) => a.projectPath.localeCompare(b.projectPath));
    } finally {
      db.close();
    }
  } catch (error) {
    // エラーを再スローして上位コンポーネントでキャッチできるようにする
    throw error;
  }
}
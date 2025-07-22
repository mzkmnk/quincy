/**
 * 全プロジェクトの会話履歴メタデータを取得
 */

import Database from 'better-sqlite3';
import type { ConversationMetadata } from '@quincy/shared';

import { getDatabasePath } from './get-database-path';
import { isDatabaseAvailable } from './is-database-available';

/**
 * conversationsテーブルから全プロジェクトの履歴メタデータを取得
 */
export function getAllProjectsHistory(): ConversationMetadata[] {
  if (!isDatabaseAvailable()) {
    return [];
  }

  const dbPath = getDatabasePath();
  const db = Database(dbPath, { readonly: true });

  try {
    const stmt = db.prepare('SELECT key, value FROM conversations');
    const rows = stmt.all() as Array<{ key: string; value: string }>;
    
    const conversations: ConversationMetadata[] = [];

    for (const row of rows) {
      try {
        const conversationData = JSON.parse(row.value);
        
        conversations.push({
          projectPath: row.key,
          conversation_id: conversationData.conversation_id || '',
          lastUpdated: new Date(), // SQLiteにtimestampがない場合の暫定対応
          messageCount: conversationData.transcript?.length || 0,
          model: conversationData.model || 'unknown'
        });
      } catch (parseError) {
        console.warn(`Failed to parse conversation data for ${row.key}:`, parseError);
        continue;
      }
    }

    return conversations;
  } catch (error) {
    console.error('Failed to get projects history:', error);
    return [];
  } finally {
    db.close();
  }
}
/**
 * 特定のconversation_idで履歴を検索
 */

import Database from 'better-sqlite3';

import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';

import { DB_PATH, SQL_QUERIES } from './constants';

export async function findByConversationId(
  conversationId: string
): Promise<{ projectPath: string; conversation: AmazonQConversationWithHistory } | null> {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    try {
      const stmt = db.prepare(SQL_QUERIES.GET_ALL_CONVERSATIONS);
      const results = stmt.all() as { key: string; value: string }[];

      for (const row of results) {
        try {
          const conversation: AmazonQConversationWithHistory = JSON.parse(row.value);
          if (conversation.conversation_id === conversationId) {
            return {
              projectPath: row.key,
              conversation,
            };
          }
        } catch {
          // パースエラーは無視して次の行を処理
        }
      }

      return null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

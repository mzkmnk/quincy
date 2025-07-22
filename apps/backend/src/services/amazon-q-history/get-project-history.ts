/**
 * 特定プロジェクトの会話履歴を取得
 */

import Database from 'better-sqlite3';
import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';

import { getDatabasePath } from './get-database-path';
import { isDatabaseAvailable } from './is-database-available';

/**
 * 特定のプロジェクトパスの会話履歴を取得
 */
export function getProjectHistory(projectPath: string): AmazonQConversationWithHistory | null {
  if (!isDatabaseAvailable()) {
    return null;
  }

  const dbPath = getDatabasePath();
  const db = Database(dbPath, { readonly: true });

  try {
    const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?');
    const row = stmt.get(projectPath) as { value: string } | undefined;
    
    if (!row) {
      return null;
    }

    const conversationData = JSON.parse(row.value);
    
    return {
      conversation_id: conversationData.conversation_id || '',
      model: conversationData.model || 'unknown',
      history: conversationData.history || null,
      tools: conversationData.tools || [],
      context_manager: conversationData.context_manager || {},
      latest_summary: conversationData.latest_summary || null
    };
  } catch (error) {
    console.error(`Failed to get project history for ${projectPath}:`, error);
    return null;
  } finally {
    db.close();
  }
}
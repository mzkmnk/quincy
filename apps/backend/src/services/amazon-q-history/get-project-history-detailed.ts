/**
 * プロジェクトの詳細履歴をDisplayMessage形式で取得
 */

import Database from 'better-sqlite3';
import type { DisplayMessage } from '@quincy/shared';

import { getDatabasePath } from './get-database-path';
import { isDatabaseAvailable } from './is-database-available';
import { convertHistoryToDisplayMessages } from './convert-history-to-display-messages';

/**
 * 特定プロジェクトの詳細履歴をDisplayMessage配列として取得
 */
export function getProjectHistoryDetailed(projectPath: string): DisplayMessage[] {
  if (!isDatabaseAvailable()) {
    return [];
  }

  const dbPath = getDatabasePath();
  const db = Database(dbPath, { readonly: true });

  try {
    const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?');
    const row = stmt.get(projectPath) as { value: string } | undefined;
    
    if (!row) {
      return [];
    }

    const conversationData = JSON.parse(row.value);
    
    // historyフィールドをDisplayMessage配列に変換
    if (conversationData.history && Array.isArray(conversationData.history)) {
      return convertHistoryToDisplayMessages(conversationData.history);
    }

    return [];
  } catch (error) {
    console.error(`Failed to get detailed project history for ${projectPath}:`, error);
    return [{
      id: 'error-' + Date.now(),
      type: 'assistant',
      content: '履歴の取得中にエラーが発生しました',
      timestamp: new Date(),
    }];
  } finally {
    db.close();
  }
}
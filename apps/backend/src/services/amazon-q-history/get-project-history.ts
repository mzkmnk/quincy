/**
 * プロジェクトの会話履歴を取得
 */

import Database from 'better-sqlite3';

import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';

import { DB_PATH, SQL_QUERIES } from './constants';
import { isDatabaseAvailable } from './is-database-available';

export async function getProjectHistory(projectPath: string): Promise<AmazonQConversationWithHistory | null> {
  try {
    if (!isDatabaseAvailable()) {
      throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。');
    }

    const db = new Database(DB_PATH, { readonly: true });
    
    try {
      const stmt = db.prepare(SQL_QUERIES.GET_CONVERSATION_BY_KEY);
      const result = stmt.get(projectPath) as { value: string } | undefined;
      
      if (!result) {
        return null;
      }

      const conversation: AmazonQConversationWithHistory = JSON.parse(result.value);
      return conversation;
    } finally {
      db.close();
    }
  } catch (error) {
    // エラーを再スローして上位コンポーネントでキャッチできるようにする
    throw new Error(`プロジェクト履歴の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}
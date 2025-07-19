/**
 * プロジェクトの詳細履歴を取得してUI表示用に変換
 */

import Database from 'better-sqlite3';

import type { DisplayMessage, AmazonQConversationWithHistory } from '../amazon-q-history-types';
import { HistoryTransformer } from '../amazon-q-history-transformer';
import { MessageFormatter } from '../amazon-q-message-formatter';

import { DB_PATH, SQL_QUERIES } from './constants';
import { isDatabaseAvailable } from './is-database-available';

export async function getProjectHistoryDetailed(projectPath: string): Promise<DisplayMessage[]> {
  try {
    if (!isDatabaseAvailable()) {
      throw new Error(
        'データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。'
      );
    }

    const db = new Database(DB_PATH, { readonly: true });
    const historyTransformer = new HistoryTransformer();
    const messageFormatter = new MessageFormatter();

    try {
      const stmt = db.prepare(SQL_QUERIES.GET_CONVERSATION_BY_KEY);
      const result = stmt.get(projectPath) as { value: string } | undefined;

      if (!result) {
        return [];
      }

      const conversationData: AmazonQConversationWithHistory = JSON.parse(result.value);

      // historyデータが存在するかチェック
      if (!conversationData.history) {
        return [];
      }

      if (!historyTransformer.isValidHistoryData(conversationData.history)) {
        return [];
      }

      // historyデータを正規化して変換
      const normalizedHistory = historyTransformer.normalizeHistoryData(conversationData.history);
      const turns = historyTransformer.groupConversationTurns(normalizedHistory);
      const displayMessages = messageFormatter.convertToDisplayMessages(turns);

      return displayMessages;
    } finally {
      db.close();
    }
  } catch (error) {
    throw new Error(
      `プロジェクト履歴の詳細取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

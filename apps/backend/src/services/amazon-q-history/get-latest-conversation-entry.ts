/**
 * SQLite3データベースから最新の会話エントリを取得
 */

import Database from 'better-sqlite3';

import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';

export async function getLatestConversationEntry(
  dbPath: string
): Promise<AmazonQConversationWithHistory | null> {
  try {
    const db = new Database(dbPath, { readonly: true });

    try {
      const stmt = db.prepare('SELECT key, value FROM key_value_store');
      const results = stmt.all() as { key: string; value: string }[];

      let latestConversation: AmazonQConversationWithHistory | null = null;
      let latestTimestamp: Date | null = null;

      for (const row of results) {
        try {
          const conversation: AmazonQConversationWithHistory = JSON.parse(row.value);

          // historyが存在しない、null、または空配列の場合はスキップ
          if (
            !conversation.history ||
            !Array.isArray(conversation.history) ||
            conversation.history.length === 0
          ) {
            continue;
          }

          // 最新のタイムスタンプを見つける（会話の最後のAI応答のタイムスタンプ）
          const lastTurn = conversation.history[conversation.history.length - 1];

          if (!lastTurn?.ai_response?.timestamp) {
            continue;
          }

          let currentTimestamp: Date;
          try {
            currentTimestamp = new Date(lastTurn.ai_response.timestamp);
            // 無効な日付の場合は、フォールバックとして現在日時を使用
            if (isNaN(currentTimestamp.getTime())) {
              currentTimestamp = new Date(0); // Unix epoch as fallback
            }
          } catch {
            // タイムスタンプのパースに失敗した場合も、フォールバックを使用
            currentTimestamp = new Date(0);
          }

          // 最新のタイムスタンプと比較
          if (!latestTimestamp || currentTimestamp > latestTimestamp) {
            latestTimestamp = currentTimestamp;
            latestConversation = conversation;
          }
        } catch {
          // JSONパースエラーは無視して次の行を処理
          continue;
        }
      }

      return latestConversation;
    } finally {
      db.close();
    }
  } catch (error) {
    throw new Error(
      `履歴取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * SQLite3データベースからconversation_idを抽出する機能
 */

import * as path from 'path';
import * as os from 'os';

import Database from 'better-sqlite3';

/**
 * プロジェクトパスに対応するconversation_idをSQLite3データベースから取得
 * @param projectPath - プロジェクトパス
 * @param customDbPath - テスト用のカスタムDBパス（省略可能）
 * @returns conversation_id or null
 */
export async function extractConversationIdFromDatabase(
  projectPath: string,
  customDbPath?: string
): Promise<string | null> {
  const dbPath =
    customDbPath || path.join(os.homedir(), 'Library/Application Support/amazon-q/data.sqlite3');

  try {
    const db = new Database(dbPath, { readonly: true });

    try {
      const query =
        "SELECT json_extract(value, '$.conversation_id') as conversation_id FROM conversations WHERE key = ?";
      const row = db.prepare(query).get(projectPath) as { conversation_id: string } | undefined;

      if (!row || !row.conversation_id) {
        return null;
      }

      return row.conversation_id;
    } finally {
      db.close();
    }
  } catch (error) {
    // データベースファイルが存在しない場合やその他のエラー
    return null;
  }
}

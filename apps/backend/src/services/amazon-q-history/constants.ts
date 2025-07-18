/**
 * Amazon Q History サービスの定数定義
 */

import path from 'path';
import { homedir } from 'os';

// Amazon Q CLIのデータベースパス
export const DB_PATH = path.join(homedir(), 'Library', 'Application Support', 'amazon-q', 'data.sqlite3');

// SQLクエリ
export const SQL_QUERIES = {
  CHECK_TABLE_EXISTS: "SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'",
  COUNT_CONVERSATIONS: 'SELECT COUNT(*) as count FROM conversations',
  GET_CONVERSATION_BY_KEY: 'SELECT value FROM conversations WHERE key = ?',
  GET_ALL_CONVERSATIONS: 'SELECT key, value FROM conversations'
} as const;
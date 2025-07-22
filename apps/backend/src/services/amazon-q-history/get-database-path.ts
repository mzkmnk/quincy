/**
 * Amazon Q データベースパスを取得
 */

import { homedir } from 'os';
import { join } from 'path';

/**
 * Amazon Q SQLite データベースファイルのパスを取得
 */
export function getDatabasePath(): string {
  return join(homedir(), 'Library', 'Application Support', 'amazon-q', 'data.sqlite3');
}
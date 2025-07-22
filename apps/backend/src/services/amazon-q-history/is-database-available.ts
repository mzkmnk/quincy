/**
 * Amazon Q データベースの可用性をチェック
 */

import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Amazon Q SQLite データベースファイルの存在をチェック
 */
export function isDatabaseAvailable(): boolean {
  try {
    const dbPath = join(homedir(), 'Library', 'Application Support', 'amazon-q', 'data.sqlite3');
    return existsSync(dbPath);
  } catch (error) {
    console.warn('Database availability check failed:', error);
    return false;
  }
}
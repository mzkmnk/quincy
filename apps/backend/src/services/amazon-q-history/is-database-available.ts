/**
 * データベースの可用性を総合的にチェック
 */

import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { DB_PATH, SQL_QUERIES } from './constants';

export function isDatabaseAvailable(): boolean {
  try {
    // ファイルの存在確認
    if (!existsSync(DB_PATH)) {
      return false;
    }
    
    const db = new Database(DB_PATH, { readonly: true });
    
    try {
      // 実際にconversationsテーブルが存在するか確認
      const tableExists = db.prepare(SQL_QUERIES.CHECK_TABLE_EXISTS).get();
      
      if (!tableExists) {
        return false;
      }
      
      // テーブルに実際にアクセスできるかテスト
      try {
        const result = db.prepare(SQL_QUERIES.COUNT_CONVERSATIONS).get() as { count: number };
        return true;
      } catch (accessError) {
        return false;
      }
    } finally {
      db.close();
    }
  } catch (error) {
    return false;
  }
}
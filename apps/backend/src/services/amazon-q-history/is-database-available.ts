/**
 * データベースの可用性を総合的にチェック
 */

import { existsSync } from 'fs';

import Database from 'better-sqlite3';

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
        db.prepare(SQL_QUERIES.COUNT_CONVERSATIONS).get() as { count: number };
        return true;
      } catch {
        return false;
      }
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}
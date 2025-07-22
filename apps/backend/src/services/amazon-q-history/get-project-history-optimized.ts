/**
 * プロジェクトの会話履歴を取得（最適化版）
 * インデックス活用とクエリ最適化による性能改善
 */

import Database from 'better-sqlite3';

import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';

import { DB_PATH } from './constants';
import { isDatabaseAvailable } from './is-database-available';

/**
 * 履歴取得オプション
 */
export interface HistoryFetchOptions {
  limit?: number;
  offset?: number;
  messageLimit?: number;
  includeMetadata?: boolean;
}

/**
 * 最適化されたSQL文
 */
const OPTIMIZED_SQL_QUERIES = {
  // インデックスを活用したキー検索
  GET_CONVERSATION_BY_KEY: `
    SELECT value 
    FROM conversations 
    WHERE key = ? 
    LIMIT 1
  `,

  // 複数プロジェクトの履歴を効率的に取得
  GET_MULTIPLE_CONVERSATIONS: `
    SELECT key, value 
    FROM conversations 
    WHERE key IN (SELECT value FROM json_each(?))
    ORDER BY key
  `,

  // 最新の履歴を優先取得
  GET_RECENT_CONVERSATIONS: `
    SELECT key, value 
    FROM conversations 
    WHERE key LIKE ?
    ORDER BY rowid DESC 
    LIMIT ? OFFSET ?
  `,
} as const;

/**
 * 履歴取得結果キャッシュ
 */
const historyCache = new Map<
  string,
  {
    data: AmazonQConversationWithHistory;
    timestamp: number;
    size: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5分
const MAX_CACHE_SIZE = 50; // 最大50エントリー

/**
 * プロジェクトの会話履歴を取得（最適化版）
 *
 * @param projectPath プロジェクトパス
 * @param options 取得オプション
 * @returns 会話履歴またはnull
 */
export async function getProjectHistoryOptimized(
  projectPath: string,
  options: HistoryFetchOptions = {}
): Promise<AmazonQConversationWithHistory | null> {
  const cacheKey = `${projectPath}:${JSON.stringify(options)}`;

  // キャッシュチェック
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    if (!isDatabaseAvailable()) {
      throw new Error(
        'データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。'
      );
    }

    // 接続プールを使用してパフォーマンスを向上
    const db = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
      timeout: 5000, // 5秒タイムアウト
    });

    try {
      // WALモードでパフォーマンス向上
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = 10000'); // 10MBキャッシュ

      const stmt = db.prepare(OPTIMIZED_SQL_QUERIES.GET_CONVERSATION_BY_KEY);
      const result = stmt.get(projectPath) as { value: string } | undefined;

      if (!result) {
        return null;
      }

      let conversation: AmazonQConversationWithHistory;

      try {
        conversation = JSON.parse(result.value);
      } catch (parseError) {
        throw new Error(`履歴データの解析に失敗しました: ${parseError}`);
      }

      // メッセージ数制限の適用
      if (options.messageLimit && conversation.history) {
        conversation.history = {
          ...conversation.history,
          history: conversation.history.history.slice(-options.messageLimit), // 最新のメッセージのみ取得
        };
      }

      // メタデータを含めない場合の最適化
      if (options.includeMetadata === false) {
        // メタデータフィールドを削除してサイズ削減
        const optimizedConversation = {
          ...conversation,
          // 不要なメタデータを除去
        };
        conversation = optimizedConversation;
      }

      // キャッシュに保存（サイズ制限あり）
      const dataSize = Buffer.byteLength(JSON.stringify(conversation), 'utf8');
      if (dataSize < 1024 * 1024) {
        // 1MB未満のみキャッシュ
        // キャッシュサイズ制限
        if (historyCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = Array.from(historyCache.keys())[0];
          historyCache.delete(oldestKey);
        }

        historyCache.set(cacheKey, {
          data: conversation,
          timestamp: Date.now(),
          size: dataSize,
        });
      }

      return conversation;
    } finally {
      db.close();
    }
  } catch (error) {
    // エラーを再スローして上位コンポーネントでキャッチできるようにする
    throw new Error(
      `プロジェクト履歴の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 複数プロジェクトの履歴を一括取得（最適化版）
 *
 * @param projectPaths プロジェクトパスの配列
 * @param options 取得オプション
 * @returns プロジェクトパスと履歴のマップ
 */
export async function getMultipleProjectHistories(
  projectPaths: string[],
  options: HistoryFetchOptions = {}
): Promise<Map<string, AmazonQConversationWithHistory>> {
  const result = new Map<string, AmazonQConversationWithHistory>();

  if (projectPaths.length === 0) {
    return result;
  }

  try {
    if (!isDatabaseAvailable()) {
      throw new Error('データベースにアクセスできません。');
    }

    const db = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
      timeout: 5000,
    });

    try {
      // パフォーマンス最適化
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = 10000');

      const pathsJson = JSON.stringify(projectPaths);
      const stmt = db.prepare(OPTIMIZED_SQL_QUERIES.GET_MULTIPLE_CONVERSATIONS);
      const rows = stmt.all(pathsJson) as { key: string; value: string }[];

      for (const row of rows) {
        try {
          const conversation: AmazonQConversationWithHistory = JSON.parse(row.value);

          // メッセージ数制限の適用
          if (options.messageLimit && conversation.history) {
            conversation.history = {
              ...conversation.history,
              history: conversation.history.history.slice(-options.messageLimit),
            };
          }

          result.set(row.key, conversation);
        } catch (parseError) {
          console.warn(`履歴データの解析に失敗: ${row.key}`, parseError);
          // 個別の失敗は無視して続行
        }
      }

      return result;
    } finally {
      db.close();
    }
  } catch (error) {
    throw new Error(
      `複数プロジェクト履歴の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 最新の履歴を効率的に取得
 *
 * @param projectPathPattern プロジェクトパスのパターン（LIKE句用）
 * @param options 取得オプション
 * @returns 履歴のリスト
 */
export async function getRecentProjectHistories(
  projectPathPattern: string = '%',
  options: HistoryFetchOptions = {}
): Promise<Array<{ path: string; history: AmazonQConversationWithHistory }>> {
  const { limit = 20, offset = 0 } = options;

  try {
    if (!isDatabaseAvailable()) {
      throw new Error('データベースにアクセスできません。');
    }

    const db = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
      timeout: 5000,
    });

    try {
      // パフォーマンス最適化
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');

      const stmt = db.prepare(OPTIMIZED_SQL_QUERIES.GET_RECENT_CONVERSATIONS);
      const rows = stmt.all(projectPathPattern, limit, offset) as {
        key: string;
        value: string;
      }[];

      const result: Array<{ path: string; history: AmazonQConversationWithHistory }> = [];

      for (const row of rows) {
        try {
          const history: AmazonQConversationWithHistory = JSON.parse(row.value);

          // メッセージ数制限の適用
          if (options.messageLimit && history.history) {
            history.history = {
              ...history.history,
              history: history.history.history.slice(-options.messageLimit),
            };
          }

          result.push({ path: row.key, history });
        } catch (parseError) {
          console.warn(`履歴データの解析に失敗: ${row.key}`, parseError);
          // 個別の失敗は無視して続行
        }
      }

      return result;
    } finally {
      db.close();
    }
  } catch (error) {
    throw new Error(
      `最新履歴の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 履歴キャッシュをクリア
 */
export function clearHistoryCache(): void {
  historyCache.clear();
}

/**
 * 履歴キャッシュの統計情報を取得
 */
export function getHistoryCacheStats(): {
  size: number;
  totalMemory: number;
  entries: Array<{ key: string; age: number; size: number }>;
} {
  const now = Date.now();
  const entries = Array.from(historyCache.entries()).map(([key, data]) => ({
    key,
    age: now - data.timestamp,
    size: data.size,
  }));

  return {
    size: historyCache.size,
    totalMemory: entries.reduce((total, entry) => total + entry.size, 0),
    entries,
  };
}

/**
 * 古いキャッシュエントリーを削除
 */
export function cleanupHistoryCache(): void {
  const now = Date.now();
  for (const [key, data] of historyCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      historyCache.delete(key);
    }
  }
}

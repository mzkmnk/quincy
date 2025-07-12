import Database from 'better-sqlite3';
import path from 'path';
import { EventEmitter } from 'events';
import os from 'os';

/**
 * Amazon Q CLI SQLiteデータベースの型定義
 */

// SQLite conversationsテーブルの会話データ構造
export interface QConversationData {
  conversation_id: string;
  next_message: null;
  history: QHistoryEntry[][];
  valid_history_range: [number, number];
  transcript: string[];
  tools: Record<string, any[]>;
}

export interface QHistoryEntry {
  additional_context?: string;
  env_context?: {
    env_state: {
      operating_system: string;
      current_working_directory: string;
      environment_variables: string[];
    };
  };
  content?: {
    Prompt?: {
      prompt: string;
    };
    ToolUseResults?: {
      tool_use_results: any[];
    };
    CancelledToolUses?: {
      prompt: string;
      tool_use_results: any[];
    };
  };
  images?: any;
  ToolUse?: {
    message_id: string;
    content: string;
    tool_uses: ToolUse[];
  };
  Response?: {
    message_id: string;
    content: string;
  };
}

export interface ToolUse {
  id: string;
  name: string;
  orig_name?: string;
  args: Record<string, any>;
  orig_args?: Record<string, any>;
}

// SQLite historyテーブルの構造
export interface QCommandHistory {
  id: number;
  command: string;
  shell: string;
  pid: number;
  session_id: string;
  cwd: string;
  start_time: number;
  hostname: string;
  exit_code: number;
  end_time: number;
  duration: number;
}

// 互換性のための既存インターフェース（内部的に変換）
export interface QHistorySession {
  conversationId: string;
  projectPath: string;
  messages: QHistoryMessage[];
  title?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface QHistoryMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    duration?: number;
    tools?: string[];
  };
}

export interface QHistorySearchOptions {
  workspaceId?: string;
  projectPath?: string;
  fromDate?: Date;
  toDate?: Date;
  messageText?: string;
  limit?: number;
}

export interface QHistoryStats {
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  oldestSession?: Date;
  newestSession?: Date;
  workspaces: string[];
}

/**
 * Amazon Q CLI履歴管理サービス
 * SQLiteデータベースから会話履歴とコマンド履歴を管理
 */
export class AmazonQHistoryService extends EventEmitter {
  private db: Database.Database;
  private readonly dbPath: string;
  private sessionCache: Map<string, QHistorySession> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分
  private readonly MAX_CACHE_SIZE = 50;

  constructor(customDbPath?: string) {
    super();
    this.dbPath = customDbPath || path.join(os.homedir(), 'Library', 'Application Support', 'amazon-q', 'data.sqlite3');

    // SQLiteデータベースに接続
    try {
      this.db = new Database(this.dbPath, { readonly: true, fileMustExist: true });
      console.log(`✅ Connected to Amazon Q SQLite database: ${this.dbPath}`);
      this.emit('db:connected', { path: this.dbPath });
    } catch (error) {
      console.error(`❌ Failed to connect to Amazon Q database: ${error}`);
      // 読み取り専用でメモリDBを作成（フォールバック）
      this.db = new Database(':memory:', { readonly: false });
      this.emit('db:error', { error: error instanceof Error ? error.message : String(error) });
    }

    this.setupCacheCleanup();
  }

  /**
   * 利用可能なプロジェクト一覧を取得
   */
  async getAvailableProjects(): Promise<string[]> {
    try {
      const stmt = this.db.prepare('SELECT DISTINCT key FROM conversations ORDER BY key');
      const rows = stmt.all() as { key: string }[];

      const projects = rows.map(row => row.key);
      this.emit('projects:loaded', { count: projects.length });
      return projects;
    } catch (error) {
      console.error('Failed to get available projects:', error);
      this.emit('projects:error', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * 指定プロジェクトの会話データを読み込み
   */
  async loadProjectConversation(projectPath: string): Promise<QHistorySession | null> {
    // キャッシュチェック
    if (this.sessionCache.has(projectPath)) {
      const cached = this.sessionCache.get(projectPath)!;
      this.emit('session:cache_hit', { projectPath });
      return cached;
    }

    try {
      const stmt = this.db.prepare('SELECT value FROM conversations WHERE key = ?');
      const row = stmt.get(projectPath) as { value: string } | undefined;

      if (!row) {
        return null;
      }

      const conversationData: QConversationData = JSON.parse(row.value);
      const session = this.convertToHistorySession(projectPath, conversationData);

      // キャッシュに保存
      this.cacheSession(projectPath, session);

      this.emit('session:loaded', { projectPath, messageCount: session.messages.length });
      return session;
    } catch (error) {
      console.error(`Failed to load conversation for ${projectPath}:`, error);
      this.emit('session:error', { projectPath, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * ワークスペース固有の履歴を取得
   */
  async getWorkspaceHistory(workspaceId: string): Promise<QHistorySession[]> {
    try {
      // ワークスペースIDを含むプロジェクトパスを検索
      const stmt = this.db.prepare(`
        SELECT key, value FROM conversations 
        WHERE key LIKE ? OR key LIKE ?
        ORDER BY key
      `);

      const rows = stmt.all(`%${workspaceId}%`, `${workspaceId}%`) as { key: string; value: string }[];
      const sessions: QHistorySession[] = [];

      for (const row of rows) {
        try {
          const conversationData: QConversationData = JSON.parse(row.value);
          const session = this.convertToHistorySession(row.key, conversationData);
          sessions.push(session);
        } catch (error) {
          console.warn(`Failed to parse conversation for ${row.key}:`, error);
        }
      }

      return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Failed to get workspace history:', error);
      return [];
    }
  }

  /**
   * プロジェクトパス固有の履歴を取得
   */
  async getProjectHistory(projectPath: string): Promise<QHistorySession[]> {
    const session = await this.loadProjectConversation(projectPath);
    return session ? [session] : [];
  }

  /**
   * コマンド実行履歴を取得
   */
  async getCommandHistory(options: { cwd?: string; limit?: number } = {}): Promise<QCommandHistory[]> {
    try {
      let query = 'SELECT * FROM history';
      const params: any[] = [];

      if (options.cwd) {
        query += ' WHERE cwd = ?';
        params.push(options.cwd);
      }

      query += ' ORDER BY start_time DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as QCommandHistory[];

      this.emit('commands:loaded', { count: rows.length });
      return rows;
    } catch (error) {
      console.error('Failed to get command history:', error);
      return [];
    }
  }

  /**
   * 履歴検索
   */
  async searchHistory(options: QHistorySearchOptions): Promise<QHistorySession[]> {
    try {
      let query = 'SELECT key, value FROM conversations WHERE 1=1';
      const params: any[] = [];

      if (options.projectPath) {
        query += ' AND key = ?';
        params.push(options.projectPath);
      } else if (options.workspaceId) {
        query += ' AND (key LIKE ? OR key LIKE ?)';
        params.push(`%${options.workspaceId}%`, `${options.workspaceId}%`);
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as { key: string; value: string }[];
      const results: QHistorySession[] = [];

      for (const row of rows) {
        try {
          const conversationData: QConversationData = JSON.parse(row.value);
          const session = this.convertToHistorySession(row.key, conversationData);

          // メッセージテキスト検索
          if (options.messageText) {
            const hasMatch = session.messages.some(msg =>
              msg.content.toLowerCase().includes(options.messageText!.toLowerCase())
            );
            if (!hasMatch) continue;
          }

          // 日付フィルタ
          if (options.fromDate && session.createdAt < options.fromDate.getTime()) continue;
          if (options.toDate && session.updatedAt > options.toDate.getTime()) continue;

          results.push(session);
        } catch (error) {
          console.warn(`Failed to parse conversation for ${row.key}:`, error);
        }
      }

      return results
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, options.limit || 100);
    } catch (error) {
      console.error('Failed to search history:', error);
      return [];
    }
  }

  /**
   * 特定の履歴セッションを取得（会話IDまたはプロジェクトパスから）
   */
  async getHistorySession(identifier: string): Promise<QHistorySession | null> {
    try {
      // まずプロジェクトパスとして検索
      let session = await this.loadProjectConversation(identifier);
      if (session) {
        return session;
      }

      // 会話IDとして全プロジェクトから検索
      const stmt = this.db.prepare('SELECT key, value FROM conversations');
      const rows = stmt.all() as { key: string; value: string }[];

      for (const row of rows) {
        try {
          const conversationData: QConversationData = JSON.parse(row.value);
          if (conversationData.conversation_id === identifier) {
            return this.convertToHistorySession(row.key, conversationData);
          }
        } catch (error) {
          console.warn(`Failed to parse conversation for ${row.key}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get history session:', error);
      return null;
    }
  }

  /**
   * 履歴統計を取得
   */
  async getHistoryStats(): Promise<QHistoryStats> {
    try {
      // 会話統計
      const conversationStmt = this.db.prepare('SELECT COUNT(*) as count FROM conversations');
      const conversationCount = (conversationStmt.get() as { count: number }).count;

      // コマンド履歴統計
      const commandStmt = this.db.prepare('SELECT COUNT(*) as count, MIN(start_time) as oldest, MAX(start_time) as newest FROM history');
      const commandStats = commandStmt.get() as { count: number; oldest: number | null; newest: number | null };

      // プロジェクト一覧
      const projects = await this.getAvailableProjects();

      // 全会話のメッセージ数を計算
      let totalMessages = 0;
      const projectStmt = this.db.prepare('SELECT value FROM conversations');
      const rows = projectStmt.all() as { value: string }[];

      for (const row of rows) {
        try {
          const data: QConversationData = JSON.parse(row.value);
          // history配列の各要素は1ターンの会話（user + assistant）
          totalMessages += data.history.length * 2;
        } catch (error) {
          console.warn('Failed to parse conversation:', error);
        }
      }

      return {
        totalSessions: conversationCount,
        totalMessages,
        avgMessagesPerSession: conversationCount > 0 ? totalMessages / conversationCount : 0,
        oldestSession: commandStats.oldest ? new Date(commandStats.oldest * 1000) : undefined,
        newestSession: commandStats.newest ? new Date(commandStats.newest * 1000) : undefined,
        workspaces: projects
      };
    } catch (error) {
      console.error('Failed to get history stats:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        avgMessagesPerSession: 0,
        workspaces: []
      };
    }
  }

  /**
   * Amazon Q CLI用のコンテキスト形式でエクスポート
   */
  async exportForAmazonQ(identifier: string): Promise<string | null> {
    const session = await this.getHistorySession(identifier);
    if (!session || !session.messages) {
      return null;
    }

    // Amazon Q CLI形式のコンテキストとして構築
    const context = session.messages
      .map(msg => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    return context;
  }

  /**
   * キャッシュクリーンアップ
   */
  clearCache(): void {
    this.sessionCache.clear();
    this.emit('cache:cleared');
  }

  /**
   * サービス停止時のクリーンアップ
   */
  async shutdown(): Promise<void> {
    this.emit('shutdown');
    this.clearCache();
    this.removeAllListeners();
    this.db.close();
  }

  /**
   * QConversationDataをQHistorySessionに変換
   */
  private convertToHistorySession(projectPath: string, data: QConversationData): QHistorySession {
    const messages: QHistoryMessage[] = [];
    let createdAt = Date.now();
    let updatedAt = Date.now();

    // history配列から会話メッセージを抽出
    for (const turn of data.history) {
      for (const entry of turn) {
        if (entry.content?.Prompt?.prompt) {
          // ユーザーメッセージ
          messages.push({
            id: `msg_${messages.length}`,
            role: 'user',
            content: entry.content.Prompt.prompt,
            timestamp: createdAt + messages.length * 1000,
            metadata: {}
          });
        } else if (entry.ToolUse) {
          // アシスタントメッセージ
          const tools = entry.ToolUse.tool_uses?.map(t => t.name) || [];
          messages.push({
            id: entry.ToolUse.message_id,
            role: 'assistant',
            content: entry.ToolUse.content,
            timestamp: createdAt + messages.length * 1000,
            metadata: { tools }
          });
        } else if (entry.Response) {
          // アシスタントレスポンス
          messages.push({
            id: entry.Response.message_id,
            role: 'assistant',
            content: entry.Response.content,
            timestamp: createdAt + messages.length * 1000,
            metadata: {}
          });
        }
      }
    }

    if (messages.length > 0) {
      updatedAt = messages[messages.length - 1].timestamp;
    }

    // タイトルを最初のユーザーメッセージから生成
    const firstUserMessage = messages.find(m => m.role === 'user');
    const title = firstUserMessage ?
      firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') :
      'Amazon Q Session';

    return {
      conversationId: data.conversation_id,
      projectPath,
      messages,
      title,
      createdAt,
      updatedAt,
      isActive: data.next_message === null
    };
  }

  private cacheSession(projectPath: string, session: QHistorySession): void {
    // キャッシュサイズ制限
    if (this.sessionCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.sessionCache.keys().next().value;
      if (oldestKey) {
        this.sessionCache.delete(oldestKey);
      }
    }

    this.sessionCache.set(projectPath, session);

    // TTL後に自動削除
    setTimeout(() => {
      this.sessionCache.delete(projectPath);
    }, this.CACHE_TTL);
  }

  private setupCacheCleanup(): void {
    // 定期的なキャッシュクリーンアップ
    const cleanupInterval = setInterval(() => {
      if (this.sessionCache.size > this.MAX_CACHE_SIZE / 2) {
        const keysToRemove = Array.from(this.sessionCache.keys()).slice(0, 10);
        keysToRemove.forEach(key => this.sessionCache.delete(key));
        this.emit('cache:pruned', { removedCount: keysToRemove.length });
      }
    }, 60000); // 1分毎

    // シャットダウン時にインターバルをクリア
    this.on('shutdown', () => {
      clearInterval(cleanupInterval);
    });
  }
}
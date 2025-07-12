import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import os from 'os';

/**
 * Amazon Q CLI履歴ファイルの型定義
 * LokiJSデータベース形式
 */
export interface QHistoryDatabase {
  filename: string;
  collections: QHistoryCollection[];
  databaseVersion: number;
  engineVersion: number;
  autosave: boolean;
  autosaveInterval: number;
  options: Record<string, any>;
  persistenceMethod: string;
  ENV: string;
  isIncremental: boolean;
}

export interface QHistoryCollection {
  name: string;
  data: QHistoryTab[];
  idIndex: any;
  binaryIndices: Record<string, any>;
  constraints: any;
  uniqueNames: string[];
  transforms: Record<string, any>;
  objType: string;
  dirty: boolean;
  maxId: number;
  DynamicViews: any[];
  events: Record<string, any>;
  changes: any[];
  dirtyIds: any[];
  isIncremental: boolean;
}

export interface QHistoryTab {
  $loki?: number;
  meta?: {
    revision: number;
    created: number;
    version: number;
    updated?: number;
  };
  historyId: string;
  workspaceId?: string;
  projectPath?: string;
  messages: QHistoryMessage[];
  title?: string;
  isOpen: boolean;
  createdAt: number;
  updatedAt: number;
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
 * LokiJS JSONファイル形式で保存された会話履歴の読み込み・管理
 */
export class AmazonQHistoryService extends EventEmitter {
  private readonly historyDir: string;
  private historyCache: Map<string, QHistoryDatabase> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分
  private readonly MAX_CACHE_SIZE = 50;

  constructor(customHistoryDir?: string) {
    super();
    this.historyDir = customHistoryDir || path.join(os.homedir(), '.aws', 'amazonq', 'history');
    this.setupCacheCleanup();
  }

  /**
   * 利用可能な履歴ファイル一覧を取得
   */
  async getAvailableHistoryFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.historyDir);
      return files
        .filter(file => file.startsWith('chat-history-') && file.endsWith('.json'))
        .sort((a, b) => {
          // ファイル名でソート（最新が先）
          return b.localeCompare(a);
        });
    } catch (error) {
      console.warn(`Amazon Q history directory not found: ${this.historyDir}`);
      return [];
    }
  }

  /**
   * 指定履歴ファイルの読み込み
   */
  async loadHistoryFile(filename: string): Promise<QHistoryDatabase | null> {
    // キャッシュチェック
    if (this.historyCache.has(filename)) {
      const cached = this.historyCache.get(filename)!;
      this.emit('history:cache_hit', { filename });
      return cached;
    }

    try {
      const filePath = path.join(this.historyDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      const historyData: QHistoryDatabase = JSON.parse(content);
      
      // キャッシュに保存
      this.cacheHistoryData(filename, historyData);
      
      this.emit('history:loaded', { filename, tabCount: historyData.collections[0]?.data?.length || 0 });
      return historyData;
    } catch (error) {
      console.error(`Failed to load history file ${filename}:`, error);
      this.emit('history:error', { filename, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * ワークスペース固有の履歴を取得
   */
  async getWorkspaceHistory(workspaceId: string): Promise<QHistoryTab[]> {
    const files = await this.getAvailableHistoryFiles();
    const allTabs: QHistoryTab[] = [];

    for (const filename of files) {
      const historyData = await this.loadHistoryFile(filename);
      if (!historyData) continue;

      const tabsCollection = historyData.collections.find(c => c.name === 'tabs');
      if (!tabsCollection) continue;

      const workspaceTabs = tabsCollection.data.filter(tab => 
        tab.workspaceId === workspaceId || 
        (tab.projectPath && tab.projectPath.includes(workspaceId))
      );
      
      allTabs.push(...workspaceTabs);
    }

    return allTabs.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * プロジェクトパス固有の履歴を取得
   */
  async getProjectHistory(projectPath: string): Promise<QHistoryTab[]> {
    const files = await this.getAvailableHistoryFiles();
    const allTabs: QHistoryTab[] = [];

    for (const filename of files) {
      const historyData = await this.loadHistoryFile(filename);
      if (!historyData) continue;

      const tabsCollection = historyData.collections.find(c => c.name === 'tabs');
      if (!tabsCollection) continue;

      const projectTabs = tabsCollection.data.filter(tab => 
        tab.projectPath === projectPath ||
        (tab.projectPath && tab.projectPath.startsWith(projectPath))
      );
      
      allTabs.push(...projectTabs);
    }

    return allTabs.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 履歴検索
   */
  async searchHistory(options: QHistorySearchOptions): Promise<QHistoryTab[]> {
    const files = await this.getAvailableHistoryFiles();
    const results: QHistoryTab[] = [];

    for (const filename of files) {
      const historyData = await this.loadHistoryFile(filename);
      if (!historyData) continue;

      const tabsCollection = historyData.collections.find(c => c.name === 'tabs');
      if (!tabsCollection) continue;

      for (const tab of tabsCollection.data) {
        if (this.matchesSearchCriteria(tab, options)) {
          results.push(tab);
        }
      }
    }

    return results
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, options.limit || 100);
  }

  /**
   * 特定の履歴セッションを取得
   */
  async getHistorySession(historyId: string): Promise<QHistoryTab | null> {
    const files = await this.getAvailableHistoryFiles();

    for (const filename of files) {
      const historyData = await this.loadHistoryFile(filename);
      if (!historyData) continue;

      const tabsCollection = historyData.collections.find(c => c.name === 'tabs');
      if (!tabsCollection) continue;

      const session = tabsCollection.data.find(tab => tab.historyId === historyId);
      if (session) {
        this.emit('history:session_found', { historyId, filename });
        return session;
      }
    }

    return null;
  }

  /**
   * 履歴統計を取得
   */
  async getHistoryStats(): Promise<QHistoryStats> {
    const files = await this.getAvailableHistoryFiles();
    let totalSessions = 0;
    let totalMessages = 0;
    let oldestSession: Date | undefined;
    let newestSession: Date | undefined;
    const workspaces = new Set<string>();

    for (const filename of files) {
      const historyData = await this.loadHistoryFile(filename);
      if (!historyData) continue;

      const tabsCollection = historyData.collections.find(c => c.name === 'tabs');
      if (!tabsCollection) continue;

      for (const tab of tabsCollection.data) {
        totalSessions++;
        totalMessages += tab.messages?.length || 0;

        const sessionDate = new Date(tab.createdAt);
        if (!oldestSession || sessionDate < oldestSession) {
          oldestSession = sessionDate;
        }
        if (!newestSession || sessionDate > newestSession) {
          newestSession = sessionDate;
        }

        if (tab.workspaceId) {
          workspaces.add(tab.workspaceId);
        }
        if (tab.projectPath) {
          workspaces.add(tab.projectPath);
        }
      }
    }

    return {
      totalSessions,
      totalMessages,
      avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
      oldestSession,
      newestSession,
      workspaces: Array.from(workspaces)
    };
  }

  /**
   * Amazon Q CLI用のコンテキスト形式でエクスポート
   */
  async exportForAmazonQ(historyId: string): Promise<string | null> {
    const session = await this.getHistorySession(historyId);
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
    this.historyCache.clear();
    this.emit('history:cache_cleared');
  }

  /**
   * サービス停止時のクリーンアップ
   */
  async shutdown(): Promise<void> {
    this.emit('shutdown');
    this.clearCache();
    this.removeAllListeners();
  }

  private cacheHistoryData(filename: string, data: QHistoryDatabase): void {
    // キャッシュサイズ制限
    if (this.historyCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.historyCache.keys().next().value;
      if (oldestKey) {
        this.historyCache.delete(oldestKey);
      }
    }

    this.historyCache.set(filename, data);
    
    // TTL後に自動削除
    setTimeout(() => {
      this.historyCache.delete(filename);
    }, this.CACHE_TTL);
  }

  private matchesSearchCriteria(tab: QHistoryTab, options: QHistorySearchOptions): boolean {
    if (options.workspaceId && tab.workspaceId !== options.workspaceId) {
      return false;
    }

    if (options.projectPath && tab.projectPath !== options.projectPath) {
      return false;
    }

    if (options.fromDate && tab.createdAt < options.fromDate.getTime()) {
      return false;
    }

    if (options.toDate && tab.createdAt > options.toDate.getTime()) {
      return false;
    }

    if (options.messageText && tab.messages) {
      const hasMatchingMessage = tab.messages.some(msg =>
        msg.content.toLowerCase().includes(options.messageText!.toLowerCase())
      );
      if (!hasMatchingMessage) {
        return false;
      }
    }

    return true;
  }

  private setupCacheCleanup(): void {
    // 定期的なキャッシュクリーンアップ
    const cleanupInterval = setInterval(() => {
      if (this.historyCache.size > this.MAX_CACHE_SIZE / 2) {
        const keysToRemove = Array.from(this.historyCache.keys()).slice(0, 10);
        keysToRemove.forEach(key => this.historyCache.delete(key));
        this.emit('history:cache_pruned', { removedCount: keysToRemove.length });
      }
    }, 60000); // 1分毎

    // シャットダウン時にインターバルをクリア
    this.on('shutdown', () => {
      clearInterval(cleanupInterval);
    });
  }
}
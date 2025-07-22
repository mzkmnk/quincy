/**
 * 履歴データの段階的読み込み機能（ページネーション）
 */

import { signal, computed } from '@angular/core';

import type { ChatMessage } from '../../../types/common.types';

/**
 * ページネーション設定
 */
export interface LazyLoadConfig {
  pageSize: number; // 1ページあたりのメッセージ数
  preloadPages: number; // 事前読み込みページ数
  maxCachedPages: number; // 最大キャッシュページ数
  loadMoreThreshold: number; // 追加読み込みのトリガー閾値（残りメッセージ数）
}

/**
 * デフォルト設定
 */
export const DEFAULT_LAZY_LOAD_CONFIG: LazyLoadConfig = {
  pageSize: 50,
  preloadPages: 2,
  maxCachedPages: 10,
  loadMoreThreshold: 10,
};

/**
 * ページ情報
 */
export interface PageInfo {
  pageNumber: number;
  messages: ChatMessage[];
  timestamp: number;
  isLoaded: boolean;
  isLoading: boolean;
}

/**
 * 読み込み状態
 */
export interface LoadingState {
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

/**
 * 段階的読み込み管理クラス
 */
export class LazyLoadHistoryManager {
  private config: LazyLoadConfig;
  private pages = signal<Map<number, PageInfo>>(new Map());
  private loadingState = signal<LoadingState>({
    isLoading: false,
    hasMore: true,
    error: null,
    totalPages: 0,
    currentPage: 0,
  });
  private loadMoreCallback?: (page: number, pageSize: number) => Promise<ChatMessage[]>;
  private totalMessagesCount = signal(0);

  // Computed properties
  public readonly allLoadedMessages = computed<ChatMessage[]>(() => {
    const pagesMap = this.pages();
    const sortedPages = Array.from(pagesMap.values())
      .filter(page => page.isLoaded)
      .sort((a, b) => a.pageNumber - b.pageNumber);

    return sortedPages.flatMap(page => page.messages);
  });

  public readonly state = computed(() => this.loadingState());

  public readonly stats = computed(() => {
    const pagesMap = this.pages();
    const loadedPages = Array.from(pagesMap.values()).filter(p => p.isLoaded);
    const totalMessages = this.totalMessagesCount();
    const loadedMessages = this.allLoadedMessages().length;

    return {
      totalPages: this.loadingState().totalPages,
      loadedPages: loadedPages.length,
      totalMessages,
      loadedMessages,
      loadedPercentage: totalMessages > 0 ? Math.round((loadedMessages / totalMessages) * 100) : 0,
      memoryUsage: loadedMessages * 1024, // 概算メモリ使用量（1メッセージ1KB想定）
    };
  });

  constructor(config: Partial<LazyLoadConfig> = {}) {
    this.config = { ...DEFAULT_LAZY_LOAD_CONFIG, ...config };
  }

  /**
   * 読み込みコールバックを設定
   */
  setLoadMoreCallback(callback: (page: number, pageSize: number) => Promise<ChatMessage[]>): void {
    this.loadMoreCallback = callback;
  }

  /**
   * 初期化
   */
  async initialize(totalMessageCount?: number): Promise<void> {
    this.pages.set(new Map());

    if (totalMessageCount !== undefined) {
      this.totalMessagesCount.set(totalMessageCount);
      const totalPages = Math.ceil(totalMessageCount / this.config.pageSize);

      this.loadingState.update(state => ({
        ...state,
        totalPages,
        hasMore: totalPages > 0,
        error: null,
      }));
    }

    // 最初のページを読み込み
    await this.loadPage(0);
  }

  /**
   * 指定ページを読み込み
   */
  async loadPage(pageNumber: number): Promise<void> {
    const currentPages = this.pages();
    const existingPage = currentPages.get(pageNumber);

    // 既に読み込み済みまたは読み込み中の場合はスキップ
    if (existingPage?.isLoaded || existingPage?.isLoading) {
      return;
    }

    if (!this.loadMoreCallback) {
      throw new Error('読み込みコールバックが設定されていません');
    }

    // 読み込み開始
    this.loadingState.update(state => ({ ...state, isLoading: true, error: null }));

    // ページ情報を更新
    const newPages = new Map(currentPages);
    newPages.set(pageNumber, {
      pageNumber,
      messages: [],
      timestamp: Date.now(),
      isLoaded: false,
      isLoading: true,
    });
    this.pages.set(newPages);

    try {
      const messages = await this.loadMoreCallback(pageNumber, this.config.pageSize);

      // 読み込み完了
      const updatedPages = new Map(this.pages());
      updatedPages.set(pageNumber, {
        pageNumber,
        messages,
        timestamp: Date.now(),
        isLoaded: true,
        isLoading: false,
      });
      this.pages.set(updatedPages);

      // 読み込み状態更新
      this.loadingState.update(state => ({
        ...state,
        isLoading: false,
        currentPage: Math.max(state.currentPage, pageNumber),
        hasMore: messages.length === this.config.pageSize,
      }));

      // キャッシュサイズ制限
      this.limitCacheSize();
    } catch (error) {
      // エラー処理
      const errorPages = new Map(this.pages());
      errorPages.delete(pageNumber); // 失敗したページを削除
      this.pages.set(errorPages);

      this.loadingState.update(state => ({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'メッセージの読み込みに失敗しました',
      }));
    }
  }

  /**
   * 次のページを読み込み
   */
  async loadNextPage(): Promise<void> {
    const state = this.loadingState();
    if (!state.hasMore || state.isLoading) {
      return;
    }

    const nextPage = state.currentPage + 1;
    await this.loadPage(nextPage);
  }

  /**
   * 複数ページを事前読み込み
   */
  async preloadPages(
    startPage: number,
    pageCount: number = this.config.preloadPages
  ): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    for (let i = 0; i < pageCount; i++) {
      const pageNumber = startPage + i;
      const state = this.loadingState();

      if (pageNumber < state.totalPages) {
        loadPromises.push(this.loadPage(pageNumber));
      }
    }

    await Promise.all(loadPromises);
  }

  /**
   * スクロール位置に基づく自動読み込み
   */
  async handleScrollPosition(
    visibleMessageIndex: number,
    totalVisibleMessages: number
  ): Promise<void> {
    const remainingMessages = totalVisibleMessages - visibleMessageIndex;

    if (remainingMessages <= this.config.loadMoreThreshold) {
      await this.loadNextPage();
    }
  }

  /**
   * 特定のメッセージIDを含むページを読み込み
   */
  async loadPageContainingMessage(messageId: string): Promise<number | null> {
    // 既に読み込み済みのページから検索
    const currentPages = this.pages();
    for (const [pageNumber, page] of currentPages) {
      if (page.isLoaded && page.messages.some(msg => msg.id === messageId)) {
        return pageNumber;
      }
    }

    // 見つからない場合は全ページを段階的に読み込み
    const state = this.loadingState();
    for (let pageNumber = 0; pageNumber < state.totalPages; pageNumber++) {
      if (!currentPages.has(pageNumber)) {
        await this.loadPage(pageNumber);

        const updatedPages = this.pages();
        const page = updatedPages.get(pageNumber);

        if (page?.isLoaded && page.messages.some(msg => msg.id === messageId)) {
          return pageNumber;
        }
      }
    }

    return null; // 見つからない場合
  }

  /**
   * キャッシュサイズ制限
   */
  private limitCacheSize(): void {
    const currentPages = this.pages();
    const loadedPages = Array.from(currentPages.values())
      .filter(page => page.isLoaded)
      .sort((a, b) => b.timestamp - a.timestamp); // 新しい順

    if (loadedPages.length > this.config.maxCachedPages) {
      const pagesToRemove = loadedPages.slice(this.config.maxCachedPages);
      const newPages = new Map(currentPages);

      pagesToRemove.forEach(page => {
        newPages.delete(page.pageNumber);
      });

      this.pages.set(newPages);
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<LazyLoadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.pages.set(new Map());
    this.loadingState.update(state => ({
      ...state,
      currentPage: 0,
      error: null,
    }));
  }

  /**
   * リソースクリーンアップ
   */
  dispose(): void {
    this.clearCache();
    this.totalMessagesCount.set(0);
    this.loadMoreCallback = undefined;
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): {
    config: LazyLoadConfig;
    loadedPages: number[];
    totalMessages: number;
    cacheSize: number;
  } {
    const currentPages = this.pages();
    const loadedPages = Array.from(currentPages.keys()).sort((a, b) => a - b);

    return {
      config: this.config,
      loadedPages,
      totalMessages: this.allLoadedMessages().length,
      cacheSize: currentPages.size,
    };
  }
}

/**
 * 履歴データのページネーション用ユーティリティ関数
 */

/**
 * メッセージをページに分割
 */
export function paginateMessages(
  messages: ChatMessage[],
  pageSize: number
): Map<number, ChatMessage[]> {
  const pages = new Map<number, ChatMessage[]>();

  for (let i = 0; i < messages.length; i += pageSize) {
    const pageNumber = Math.floor(i / pageSize);
    const pageMessages = messages.slice(i, i + pageSize);
    pages.set(pageNumber, pageMessages);
  }

  return pages;
}

/**
 * レスポンシブページサイズ計算
 */
export function calculateResponsivePageSize(
  screenWidth: number,
  basePageSize: number = 50
): number {
  if (screenWidth < 768) {
    return Math.floor(basePageSize * 0.6); // モバイル: 30件
  } else if (screenWidth < 1024) {
    return Math.floor(basePageSize * 0.8); // タブレット: 40件
  }

  return basePageSize; // デスクトップ: 50件
}

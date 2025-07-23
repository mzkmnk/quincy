/**
 * 大量履歴データの効率表示用仮想スクロール機能
 */

import { computed, signal } from '@angular/core';

import type { ChatMessage } from '../../../../core/types/common.types';

/**
 * 仮想スクロール設定
 */
export interface VirtualScrollConfig {
  itemHeight: number; // 各アイテムの高さ（px）
  containerHeight: number; // コンテナの高さ（px）
  overscan: number; // 表示領域外にレンダリングするアイテム数
  threshold: number; // 仮想化を開始するアイテム数
}

/**
 * デフォルト仮想スクロール設定
 */
export const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  itemHeight: 80, // メッセージの平均高さ
  containerHeight: 600, // チャット容器の高さ
  overscan: 5, // パフォーマンスと滑らかさのバランス
  threshold: 100, // 100件以上で仮想化開始
};

/**
 * 表示範囲情報
 */
export interface ViewportInfo {
  startIndex: number;
  endIndex: number;
  totalItems: number;
  visibleItems: number;
  scrollTop: number;
  scrollHeight: number;
}

/**
 * 仮想スクロール状態管理
 */
export class VirtualScrollManager {
  private config: VirtualScrollConfig;
  private scrollTop = signal(0);
  private containerHeight = signal(0);
  private items = signal<ChatMessage[]>([]);

  // Computed properties
  public readonly viewport = computed<ViewportInfo>(() => {
    const scrollTopValue = this.scrollTop();
    const containerHeightValue = this.containerHeight();
    const itemsValue = this.items();

    if (itemsValue.length < this.config.threshold) {
      // 仮想化が不要な場合は全て表示
      return {
        startIndex: 0,
        endIndex: itemsValue.length,
        totalItems: itemsValue.length,
        visibleItems: itemsValue.length,
        scrollTop: scrollTopValue,
        scrollHeight: itemsValue.length * this.config.itemHeight,
      };
    }

    // 表示開始インデックス計算
    const startIndex = Math.max(
      0,
      Math.floor(scrollTopValue / this.config.itemHeight) - this.config.overscan
    );

    // 表示可能アイテム数計算
    const visibleItems = Math.ceil(containerHeightValue / this.config.itemHeight);

    // 表示終了インデックス計算
    const endIndex = Math.min(
      itemsValue.length,
      startIndex + visibleItems + this.config.overscan * 2
    );

    return {
      startIndex,
      endIndex,
      totalItems: itemsValue.length,
      visibleItems: endIndex - startIndex,
      scrollTop: scrollTopValue,
      scrollHeight: itemsValue.length * this.config.itemHeight,
    };
  });

  public readonly visibleItems = computed<ChatMessage[]>(() => {
    const viewportInfo = this.viewport();
    const itemsValue = this.items();

    return itemsValue.slice(viewportInfo.startIndex, viewportInfo.endIndex);
  });

  public readonly spacerStyles = computed(() => {
    const viewportInfo = this.viewport();
    const beforeHeight = viewportInfo.startIndex * this.config.itemHeight;
    const afterHeight = Math.max(
      0,
      (viewportInfo.totalItems - viewportInfo.endIndex) * this.config.itemHeight
    );

    return {
      before: { height: `${beforeHeight}px` },
      after: { height: `${afterHeight}px` },
    };
  });

  constructor(config: Partial<VirtualScrollConfig> = {}) {
    this.config = { ...DEFAULT_VIRTUAL_SCROLL_CONFIG, ...config };
  }

  /**
   * スクロール位置を更新
   */
  updateScrollTop(scrollTop: number): void {
    this.scrollTop.set(Math.max(0, scrollTop));
  }

  /**
   * コンテナ高さを更新
   */
  updateContainerHeight(height: number): void {
    this.containerHeight.set(Math.max(0, height));
  }

  /**
   * アイテムリストを更新
   */
  updateItems(items: ChatMessage[]): void {
    this.items.set([...items]);
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 特定のインデックスまでスクロール
   */
  scrollToIndex(
    index: number,
    behavior: 'auto' | 'smooth' = 'smooth'
  ): {
    scrollTop: number;
    behavior: 'auto' | 'smooth';
  } {
    const items = this.items();
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const scrollTop = clampedIndex * this.config.itemHeight;

    this.updateScrollTop(scrollTop);

    return { scrollTop, behavior };
  }

  /**
   * 最新メッセージまでスクロール
   */
  scrollToBottom(behavior: 'auto' | 'smooth' = 'smooth'): {
    scrollTop: number;
    behavior: 'auto' | 'smooth';
  } {
    const items = this.items();
    return this.scrollToIndex(items.length - 1, behavior);
  }

  /**
   * 最初のメッセージまでスクロール
   */
  scrollToTop(behavior: 'auto' | 'smooth' = 'smooth'): {
    scrollTop: number;
    behavior: 'auto' | 'smooth';
  } {
    this.updateScrollTop(0);
    return { scrollTop: 0, behavior };
  }

  /**
   * 仮想化が有効かどうかを判定
   */
  isVirtualizationActive(): boolean {
    return this.items().length >= this.config.threshold;
  }

  /**
   * メモリ使用量の統計を取得
   */
  getMemoryStats(): {
    totalItems: number;
    visibleItems: number;
    memoryReduction: number;
    isVirtualized: boolean;
  } {
    const viewport = this.viewport();
    const isVirtualized = this.isVirtualizationActive();

    return {
      totalItems: viewport.totalItems,
      visibleItems: viewport.visibleItems,
      memoryReduction: isVirtualized
        ? Math.round(((viewport.totalItems - viewport.visibleItems) / viewport.totalItems) * 100)
        : 0,
      isVirtualized,
    };
  }

  /**
   * リソースクリーンアップ
   */
  dispose(): void {
    // 必要に応じてリスナーやタイマーをクリーンアップ
    this.items.set([]);
    this.scrollTop.set(0);
    this.containerHeight.set(0);
  }
}

/**
 * 仮想スクロール用ユーティリティ関数
 */

/**
 * 自動的にアイテム高さを測定
 */
export function measureItemHeight(sampleElement: HTMLElement): number {
  const computedStyle = getComputedStyle(sampleElement);
  const height = sampleElement.getBoundingClientRect().height;
  const marginTop = parseFloat(computedStyle.marginTop) || 0;
  const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

  return height + marginTop + marginBottom;
}

/**
 * レスポンシブなアイテム高さ計算
 */
export function calculateResponsiveItemHeight(baseHeight: number, screenWidth: number): number {
  // モバイルではアイテム高さを調整
  if (screenWidth < 768) {
    return Math.ceil(baseHeight * 1.2); // 20%増
  } else if (screenWidth < 1024) {
    return Math.ceil(baseHeight * 1.1); // 10%増
  }

  return baseHeight;
}

/**
 * スムーズなスクロールアニメーション
 */
export function smoothScrollTo(
  element: HTMLElement,
  targetScrollTop: number,
  duration: number = 300
): Promise<void> {
  return new Promise(resolve => {
    const startScrollTop = element.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    const startTime = performance.now();

    function animateScroll(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      element.scrollTop = startScrollTop + distance * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animateScroll);
  });
}

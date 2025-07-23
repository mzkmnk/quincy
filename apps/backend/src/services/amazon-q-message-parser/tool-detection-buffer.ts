import { parseToolUsage, hasIncompleteToolPattern } from './parse-tool-usage';

/**
 * チャンク処理結果
 */
export interface ChunkProcessResult {
  content: string;
  tools: string[];
  hasIncompletePattern: boolean;
}

/**
 * ストリーミング用ツール検出バッファ
 * 改善されたツール検出精度と安定性を提供
 */
export class ToolDetectionBuffer {
  private buffer: string = '';
  private detectedTools: string[] = [];
  private lastProcessedTime: number = 0;
  private readonly bufferMaxSize: number = 4096; // 4KB制限

  /**
   * チャンクを処理してツール検出を行う
   *
   * @param chunk 処理するチャンク
   * @returns 処理結果（コンテンツとツール）
   */
  processChunk(chunk: string): ChunkProcessResult {
    this.lastProcessedTime = Date.now();

    // 型安全性チェック
    if (!chunk || typeof chunk !== 'string') {
      return {
        content: '',
        tools: [],
        hasIncompletePattern: false,
      };
    }

    // バッファサイズ制限チェック
    if (this.buffer.length + chunk.length > this.bufferMaxSize) {
      // バッファが大きすぎる場合は古いバッファをクリアして新しいチャンクのみ処理
      this.buffer = chunk.slice(-this.bufferMaxSize);
    } else {
      // 前回のバッファと結合
      this.buffer += chunk;
    }

    // 不完全パターンの判定を先に行う
    if (hasIncompleteToolPattern(this.buffer)) {
      // 不完全なパターンが見つかった場合の改善された処理
      const toolPatternStart = this.buffer.lastIndexOf('🛠️ Using tool:');

      if (toolPatternStart > 0) {
        const contentBeforePattern = this.buffer.substring(0, toolPatternStart);
        this.buffer = this.buffer.substring(toolPatternStart);

        return {
          content: contentBeforePattern,
          tools: [],
          hasIncompletePattern: true,
        };
      } else {
        // パターンが先頭から始まる場合
        return {
          content: '',
          tools: [],
          hasIncompletePattern: true,
        };
      }
    }

    // 完全なツール検出を試行
    const detection = parseToolUsage(this.buffer);

    if (detection.hasTools) {
      // 新しいツールのみを追加（重複回避）
      const newTools = detection.tools.filter(tool => !this.detectedTools.includes(tool));
      this.detectedTools.push(...newTools);
      this.buffer = ''; // バッファをクリア

      return {
        content: detection.cleanedLine,
        tools: newTools,
        hasIncompletePattern: false,
      };
    }

    // 通常のテキストとして処理
    const content = this.buffer;
    this.buffer = '';
    return {
      content,
      tools: [],
      hasIncompletePattern: false,
    };
  }

  /**
   * バッファと蓄積ツールをクリアする
   */
  clear(): void {
    this.buffer = '';
    this.detectedTools = [];
    this.lastProcessedTime = 0;
  }

  /**
   * 不完全なツールパターンが存在するかチェック
   *
   * @returns 不完全パターンの存在
   */
  hasIncompletePattern(): boolean {
    return this.buffer.length > 0 && hasIncompleteToolPattern(this.buffer);
  }

  /**
   * これまでに検出されたすべてのツールを取得
   *
   * @returns 重複除去されたツールリスト
   */
  getDetectedTools(): string[] {
    return Array.from(new Set(this.detectedTools));
  }

  /**
   * 現在のバッファ内容を取得
   *
   * @returns バッファ内容
   */
  getBufferContent(): string {
    return this.buffer;
  }

  /**
   * バッファが古すぎる場合は自動的にクリア
   *
   * @param maxAge 最大経過時間（ms、デフォルト5000ms）
   */
  flushIfStale(maxAge: number = 5000): void {
    if (this.lastProcessedTime > 0 && Date.now() - this.lastProcessedTime > maxAge) {
      this.buffer = '';
    }
  }

  /**
   * バッファサイズを取得
   *
   * @returns 現在のバッファサイズ（バイト）
   */
  getBufferSize(): number {
    return Buffer.byteLength(this.buffer, 'utf8');
  }

  /**
   * ツール検出の統計情報を取得
   *
   * @returns 統計情報
   */
  getStats(): {
    bufferSize: number;
    toolCount: number;
    lastProcessed: number;
    hasStaleBuffer: boolean;
  } {
    return {
      bufferSize: this.getBufferSize(),
      toolCount: this.detectedTools.length,
      lastProcessed: this.lastProcessedTime,
      hasStaleBuffer: this.lastProcessedTime > 0 && Date.now() - this.lastProcessedTime > 5000,
    };
  }
}

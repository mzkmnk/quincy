import { parseToolUsage, hasIncompleteToolPattern } from './parse-tool-usage';

/**
 * チャンク処理結果
 */
export interface ChunkProcessResult {
  content: string;
  tools: string[];
}

/**
 * ストリーミング用ツール検出バッファ
 */
export class ToolDetectionBuffer {
  private buffer: string = '';
  private detectedTools: string[] = [];

  /**
   * チャンクを処理してツール検出を行う
   *
   * @param chunk 処理するチャンク
   * @returns 処理結果（コンテンツとツール）
   */
  processChunk(chunk: string): ChunkProcessResult {
    // 型安全性チェック
    if (!chunk || typeof chunk !== 'string') {
      return {
        content: '',
        tools: [],
      };
    }

    // 前回のバッファと結合
    const fullText = this.buffer + chunk;

    // 結合されたテキストでツール検出を試行
    const detection = parseToolUsage(fullText);

    if (detection.hasTools) {
      // ツールが検出された場合
      this.detectedTools.push(...detection.tools);
      this.buffer = ''; // バッファをクリア

      return {
        content: detection.cleanedLine,
        tools: detection.tools,
      };
    }

    // ツールが検出されなかった場合、不完全パターンをチェック
    if (hasIncompleteToolPattern(fullText)) {
      // 不完全なパターンが見つかった場合
      // パターン開始位置を探して、それより前の部分をコンテンツとして返す
      const incompletePatternStart = fullText.lastIndexOf('[Tool uses:');

      if (incompletePatternStart > 0) {
        const contentBeforePattern = fullText.substring(0, incompletePatternStart);
        this.buffer = fullText.substring(incompletePatternStart);

        return {
          content: contentBeforePattern,
          tools: [],
        };
      } else {
        // パターンが先頭から始まる場合
        this.buffer = fullText;
        return {
          content: '',
          tools: [],
        };
      }
    }

    // 通常のテキストとして処理
    this.buffer = '';
    return {
      content: chunk,
      tools: [],
    };
  }

  /**
   * バッファと蓄積ツールをクリアする
   */
  clear(): void {
    this.buffer = '';
    this.detectedTools = [];
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
}

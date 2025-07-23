/**
 * 段落処理用のクラス
 * Amazon Q CLIの出力を適切な段落単位で処理する
 */

export class ParagraphProcessor {
  private buffer: string[] = [];
  private lastFlushTime: number = 0;
  private readonly flushDelay: number = 300; // 300ms

  /**
   * 行を追加して、必要に応じて段落を返す
   */
  addLine(line: string): string | null {
    const trimmedLine = line.trim();

    // 段落の区切りとなる条件
    if (this.isParagraphBreak(trimmedLine)) {
      const result = this.flushBuffer();

      // 空行でない場合は、現在の行も処理
      if (trimmedLine) {
        this.buffer.push(line);
      }

      return result;
    }

    // 通常の行はバッファに追加
    if (trimmedLine) {
      this.buffer.push(line);
    }

    // タイムアウトによる自動フラッシュ
    const now = Date.now();
    if (this.buffer.length > 0 && now - this.lastFlushTime > this.flushDelay) {
      return this.flushBuffer();
    }

    return null;
  }

  /**
   * 段落の区切りかどうかを判定
   */
  private isParagraphBreak(line: string): boolean {
    // 空行
    if (!line) {
      return true;
    }

    // リスト項目の開始
    if (/^[\s]*[-*•]\s+/.test(line)) {
      return true;
    }

    // 番号付きリストの開始
    if (/^[\s]*\d+\.\s+/.test(line)) {
      return true;
    }

    // コードブロックの開始/終了
    if (/^```/.test(line)) {
      return true;
    }

    // ヘッダー（#で始まる）
    if (/^#+\s+/.test(line)) {
      return true;
    }

    // 引用（>で始まる）
    if (/^>\s+/.test(line)) {
      return true;
    }

    // セクション区切り（---や===）
    if (/^[-=]{3,}$/.test(line)) {
      return true;
    }

    return false;
  }

  /**
   * バッファをフラッシュして段落を返す
   */
  flushBuffer(): string | null {
    if (this.buffer.length === 0) {
      return null;
    }

    // バッファ内の行を結合（改行ではなくスペースで）
    const paragraph = this.buffer.join(' ').trim();
    this.buffer = [];
    this.lastFlushTime = Date.now();

    return paragraph;
  }

  /**
   * 強制的にバッファをフラッシュ
   */
  forceFlush(): string | null {
    return this.flushBuffer();
  }

  /**
   * バッファをクリア
   */
  clear(): void {
    this.buffer = [];
    this.lastFlushTime = 0;
  }

  /**
   * バッファが空かどうか
   */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }
}

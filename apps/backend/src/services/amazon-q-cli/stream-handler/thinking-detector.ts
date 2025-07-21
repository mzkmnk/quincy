/**
 * Amazon Q CLI Thinking状態検知器
 * スピナーアニメーションとThinkingメッセージを検知
 */

import type { ThinkingDetectionResult } from './types';

export class ThinkingDetector {
  // Thinkingパターン: キャリッジリターン + スピナー + " Thinking..."
  private readonly THINKING_PATTERN = /\r([⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]) Thinking\.\.\./g;

  // スピナー文字のセット
  private readonly SPINNER_CHARS = new Set(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']);

  private isThinking = false;
  private lastSpinner = '';

  /**
   * Thinking状態を検知する
   */
  detectThinking(input: string): ThinkingDetectionResult {
    // パターンをリセット
    this.THINKING_PATTERN.lastIndex = 0;

    const match = this.THINKING_PATTERN.exec(input);

    if (match && match[1]) {
      this.isThinking = true;
      this.lastSpinner = match[1];

      return {
        isThinking: true,
        spinner: match[1],
      };
    }

    // Thinkingパターンが見つからない場合は状態をリセット
    this.isThinking = false;
    this.lastSpinner = '';

    return {
      isThinking: false,
      spinner: '',
    };
  }

  /**
   * 現在Thinking中かどうか
   */
  isThinkingInProgress(): boolean {
    return this.isThinking;
  }

  /**
   * Thinkingパターンを除去する
   */
  stripThinkingPattern(input: string): string {
    // グローバルフラグ付きの新しいRegExpを作成
    return input.replace(/\r[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏] Thinking\.\.\./g, '');
  }

  /**
   * 最後に検知したスピナー文字を取得
   */
  getLastSpinner(): string {
    return this.lastSpinner;
  }
}

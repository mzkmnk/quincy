/**
 * Amazon Q CLI stdout ハンドラー
 * stdout出力を解析してリアルタイムチャットイベントを生成
 */

import { AnsiParser } from './ansi-parser';
import { PromptDetector } from './prompt-detector';
import { ThinkingDetector } from './thinking-detector';
import type { StreamHandlerCallbacks, HandlerState } from './types';

export class StdoutHandler {
  private readonly ansiParser: AnsiParser;
  private readonly promptDetector: PromptDetector;
  private readonly thinkingDetector: ThinkingDetector;
  private readonly callbacks: StreamHandlerCallbacks;

  private state: HandlerState = 'idle';
  private buffer = '';

  constructor(callbacks: StreamHandlerCallbacks) {
    this.callbacks = callbacks;
    this.ansiParser = new AnsiParser();
    this.promptDetector = new PromptDetector();
    this.thinkingDetector = new ThinkingDetector();
  }

  /**
   * stdoutチャンクを処理
   */
  processChunk(chunk: Buffer): void {
    const text = chunk.toString();
    if (!text) return;

    // バッファに追加
    this.buffer += text;

    // 完全な行または特定のパターンを処理
    this.processBuffer();
  }

  /**
   * バッファ内容を処理
   */
  private processBuffer(): void {
    // Thinking検出
    const thinkingResult = this.thinkingDetector.detectThinking(this.buffer);

    if (thinkingResult.isThinking) {
      // Thinking状態の処理
      this.handleThinking(thinkingResult.spinner);
      // Thinkingパターンを除去
      this.buffer = this.thinkingDetector.stripThinkingPattern(this.buffer);
    }

    // プロンプト検出
    const promptResult = this.promptDetector.detectPrompt(this.buffer);

    if (promptResult.hasPrompt) {
      // プロンプト検出時の処理
      this.handlePrompt(promptResult.afterPrompt);
      // プロンプトまでを処理済みとしてバッファをクリア
      this.buffer = '';
    } else if (!thinkingResult.isThinking && this.buffer.includes('\n')) {
      // 通常の出力行を処理
      const lines = this.buffer.split('\n');
      const complete = lines.slice(0, -1).join('\n');

      if (complete) {
        this.handleOutput(complete + '\n');
      }

      // 最後の不完全な行をバッファに残す
      this.buffer = lines[lines.length - 1];
    }
  }

  /**
   * Thinking状態を処理
   */
  private handleThinking(spinner: string): void {
    const timestamp = Date.now();

    if (this.state !== 'thinking') {
      // Thinking開始
      this.state = 'thinking';
      this.callbacks.onThinkingStart({ spinner, timestamp });
    }

    // Thinking更新
    this.callbacks.onThinkingUpdate({ spinner, timestamp });
  }

  /**
   * プロンプト検出を処理
   */
  private handlePrompt(afterPrompt: string): void {
    const timestamp = Date.now();

    // Thinking終了
    if (this.state === 'thinking') {
      this.state = 'idle';
      this.callbacks.onThinkingEnd({ timestamp });
    }

    // プロンプト後のテキストを確認
    const trimmedAfter = afterPrompt.trim();

    if (trimmedAfter) {
      // チャットメッセージがある
      this.callbacks.onChatMessage({
        content: trimmedAfter,
        timestamp,
      });
    } else {
      // 入力待機状態
      this.callbacks.onPromptReady({ timestamp });
    }
  }

  /**
   * 通常の出力を処理
   */
  private handleOutput(content: string): void {
    if (!content.trim()) return;

    const timestamp = Date.now();
    this.callbacks.onOutput({ content, timestamp });
  }

  /**
   * 現在の状態を取得
   */
  getState(): HandlerState {
    return this.state;
  }

  /**
   * ハンドラーをリセット
   */
  reset(): void {
    this.state = 'idle';
    this.buffer = '';
    // ThinkingDetectorの内部状態もリセットされる（新しいインスタンスを作成）
    Object.assign(this.thinkingDetector, new ThinkingDetector());
  }
}

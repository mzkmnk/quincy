/**
 * チャット状態管理
 * チャットの状態遷移とタイミング情報を管理
 */

import type { ChatState, ChatStateInfo } from './types';

export class ChatStateManager {
  private state: ChatState = 'idle';
  private thinkingStartTime = 0;
  private respondingStartTime = 0;
  private thinkingDuration = 0;

  /**
   * Thinking開始
   */
  startThinking(): void {
    if (this.state !== 'idle') {
      throw new Error(`Invalid state transition: ${this.state} -> thinking`);
    }

    this.state = 'thinking';
    this.thinkingStartTime = Date.now();
  }

  /**
   * 応答開始
   */
  startResponding(): void {
    if (this.state !== 'thinking') {
      throw new Error(`Invalid state transition: ${this.state} -> responding`);
    }

    this.state = 'responding';
    this.respondingStartTime = Date.now();
    this.thinkingDuration = this.respondingStartTime - this.thinkingStartTime;
  }

  /**
   * 応答完了
   */
  completeResponse(): void {
    if (this.state !== 'responding') {
      throw new Error(`Invalid state transition: ${this.state} -> idle`);
    }

    this.state = 'idle';
  }

  /**
   * 状態をリセット
   */
  reset(): void {
    this.state = 'idle';
    this.thinkingStartTime = 0;
    this.respondingStartTime = 0;
    this.thinkingDuration = 0;
  }

  /**
   * 現在の状態を取得
   */
  getState(): ChatState {
    return this.state;
  }

  /**
   * 特定の状態に遷移可能かチェック
   */
  canTransitionTo(targetState: ChatState): boolean {
    if (targetState === 'thinking') {
      return this.state === 'idle';
    }

    if (targetState === 'responding') {
      return this.state === 'thinking';
    }

    if (targetState === 'idle') {
      return this.state === 'thinking' || this.state === 'responding';
    }

    return false;
  }

  /**
   * Thinking開始時刻を取得
   */
  getThinkingStartTime(): number {
    return this.thinkingStartTime;
  }

  /**
   * 応答開始時刻を取得
   */
  getRespondingStartTime(): number {
    return this.respondingStartTime;
  }

  /**
   * Thinking時間を取得
   */
  getThinkingDuration(): number {
    return this.thinkingDuration;
  }

  /**
   * 状態ヘルパー
   */
  isThinking(): boolean {
    return this.state === 'thinking';
  }

  isResponding(): boolean {
    return this.state === 'responding';
  }

  isIdle(): boolean {
    return this.state === 'idle';
  }

  /**
   * 完全な状態情報を取得
   */
  getStateInfo(): ChatStateInfo {
    return {
      state: this.state,
      thinkingStartTime: this.thinkingStartTime,
      respondingStartTime: this.respondingStartTime,
      thinkingDuration: this.thinkingDuration,
    };
  }
}

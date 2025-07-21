/**
 * Amazon Q CLI プロンプト検知器
 * 緑色のプロンプト（>）を検知し、チャット応答の完了と入力待機状態を判定
 */

import type { PromptDetectionResult } from './types';

export class PromptDetector {
  // Amazon Q CLIの緑色プロンプトパターン
  // \x1b[38;5;10m は256色の緑色、\x1b[0m はリセット
  // eslint-disable-next-line no-control-regex
  private readonly PROMPT_PATTERN = /\x1b\[38;5;10m>\x1b\[0m/;

  /**
   * プロンプトを検知する
   */
  detectPrompt(input: string): PromptDetectionResult {
    const match = input.match(this.PROMPT_PATTERN);

    if (!match || match.index === undefined) {
      return {
        hasPrompt: false,
        promptIndex: -1,
        afterPrompt: '',
      };
    }

    const promptIndex = match.index;
    const afterPromptIndex = promptIndex + match[0].length;
    const afterPrompt = input.substring(afterPromptIndex);

    return {
      hasPrompt: true,
      promptIndex,
      afterPrompt,
    };
  }

  /**
   * 入力待機中かどうかを判定
   * プロンプトの後に実質的なテキストがない場合は入力待機中
   */
  isWaitingForInput(input: string): boolean {
    const result = this.detectPrompt(input);

    if (!result.hasPrompt) {
      return false;
    }

    // プロンプト後のテキストが空白のみかチェック
    const trimmedAfterPrompt = result.afterPrompt.trim();
    return trimmedAfterPrompt.length === 0;
  }

  /**
   * プロンプトを除去してテキストのみを返す
   */
  stripPrompt(input: string): string {
    const result = this.detectPrompt(input);

    if (!result.hasPrompt) {
      return input;
    }

    // プロンプト前とプロンプト後を結合
    const beforePrompt = input.substring(0, result.promptIndex);
    return beforePrompt + result.afterPrompt;
  }
}

/**
 * チャットメッセージ抽出器
 * stdout出力からチャットメッセージを抽出
 */

import { PromptDetector } from '../stream-handler/prompt-detector';
import { AnsiParser } from '../stream-handler/ansi-parser';

import type { MessageExtractionResult } from './types';

export class ChatMessageExtractor {
  private readonly promptDetector: PromptDetector;
  private readonly ansiParser: AnsiParser;
  private accumulatedMessage = '';

  constructor() {
    this.promptDetector = new PromptDetector();
    this.ansiParser = new AnsiParser();
  }

  /**
   * メッセージを抽出する
   */
  extractMessage(input: string): MessageExtractionResult {
    const promptResult = this.promptDetector.detectPrompt(input);

    if (promptResult.hasPrompt) {
      // プロンプトがある場合
      const messageText = promptResult.afterPrompt.trim();

      if (messageText) {
        return {
          hasMessage: true,
          message: messageText,
          isComplete: true,
        };
      } else {
        return {
          hasMessage: false,
          message: '',
          isComplete: false,
        };
      }
    } else {
      // プロンプトがない場合は通常の出力
      const cleanText = this.ansiParser.removeAnsiCodes(input);

      return {
        hasMessage: cleanText.trim().length > 0,
        message: cleanText,
        isComplete: false,
      };
    }
  }

  /**
   * メッセージを蓄積する
   */
  accumulateMessage(chunk: string): void {
    this.accumulatedMessage += chunk;
  }

  /**
   * 蓄積されたメッセージを取得
   */
  getAccumulatedMessage(): string {
    return this.accumulatedMessage;
  }

  /**
   * 蓄積をリセット
   */
  reset(): void {
    this.accumulatedMessage = '';
  }

  /**
   * 有効なメッセージかどうかを判定
   */
  isValidMessage(message: string): boolean {
    return message.trim().length > 0;
  }
}

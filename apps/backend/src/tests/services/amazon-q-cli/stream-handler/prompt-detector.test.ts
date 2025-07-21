import { describe, it, expect, beforeEach } from 'vitest';

import { PromptDetector } from '../../../../services/amazon-q-cli/stream-handler/prompt-detector';

describe('PromptDetector', () => {
  let detector: PromptDetector;

  beforeEach(() => {
    detector = new PromptDetector();
  });

  describe('detectPrompt', () => {
    it('緑色のプロンプト（>）を検知できる', () => {
      const input = '\x1b[38;5;10m>\x1b[0m ';
      const result = detector.detectPrompt(input);

      expect(result.hasPrompt).toBe(true);
      expect(result.promptIndex).toBe(0);
      expect(result.afterPrompt).toBe(' ');
    });

    it('プロンプトがない場合はfalseを返す', () => {
      const input = 'This is a regular message';
      const result = detector.detectPrompt(input);

      expect(result.hasPrompt).toBe(false);
      expect(result.promptIndex).toBe(-1);
      expect(result.afterPrompt).toBe('');
    });

    it('プロンプト後のテキストを正しく抽出できる', () => {
      const input = '\x1b[38;5;10m>\x1b[0m This appears to be a test message';
      const result = detector.detectPrompt(input);

      expect(result.hasPrompt).toBe(true);
      expect(result.afterPrompt).toBe(' This appears to be a test message');
    });

    it('複数行の中からプロンプトを検知できる', () => {
      const input = 'Some text\n\x1b[38;5;10m>\x1b[0m Ready for input';
      const result = detector.detectPrompt(input);

      expect(result.hasPrompt).toBe(true);
      expect(result.promptIndex).toBe(10);
      expect(result.afterPrompt).toBe(' Ready for input');
    });

    it('ANSIエスケープシーケンスの異なるパターンも検知できる', () => {
      // 実際の出力で観測された別パターン
      const input = '\x1b[2K\x1b[38;5;10m>\x1b[0m ';
      const result = detector.detectPrompt(input);

      expect(result.hasPrompt).toBe(true);
      expect(result.afterPrompt).toBe(' ');
    });
  });

  describe('isWaitingForInput', () => {
    it('プロンプトのみの場合は入力待機中と判定する', () => {
      const input = '\x1b[38;5;10m>\x1b[0m ';

      expect(detector.isWaitingForInput(input)).toBe(true);
    });

    it('プロンプト後にテキストがある場合は入力待機中ではない', () => {
      const input = '\x1b[38;5;10m>\x1b[0m This is a response';

      expect(detector.isWaitingForInput(input)).toBe(false);
    });

    it('プロンプトがない場合は入力待機中ではない', () => {
      const input = 'Regular output text';

      expect(detector.isWaitingForInput(input)).toBe(false);
    });
  });

  describe('stripPrompt', () => {
    it('プロンプトを除去してテキストのみを返す', () => {
      const input = '\x1b[38;5;10m>\x1b[0m Hello, this is a message';
      const result = detector.stripPrompt(input);

      expect(result).toBe(' Hello, this is a message');
    });

    it('プロンプトがない場合は元のテキストを返す', () => {
      const input = 'No prompt here';
      const result = detector.stripPrompt(input);

      expect(result).toBe('No prompt here');
    });

    it('複数のプロンプトがある場合は最初のものを除去する', () => {
      const input = '\x1b[38;5;10m>\x1b[0m First \x1b[38;5;10m>\x1b[0m Second';
      const result = detector.stripPrompt(input);

      expect(result).toBe(' First \x1b[38;5;10m>\x1b[0m Second');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';

import { ThinkingDetector } from '../../../../services/amazon-q-cli/stream-handler/thinking-detector';

describe('ThinkingDetector', () => {
  let detector: ThinkingDetector;

  beforeEach(() => {
    detector = new ThinkingDetector();
  });

  describe('detectThinking', () => {
    it('Thinkingパターンを検知できる', () => {
      const input = '\r⠋ Thinking...';
      const result = detector.detectThinking(input);

      expect(result.isThinking).toBe(true);
      expect(result.spinner).toBe('⠋');
    });

    it('異なるスピナー文字も検知できる', () => {
      const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

      spinners.forEach(spinner => {
        const input = `\r${spinner} Thinking...`;
        const result = detector.detectThinking(input);

        expect(result.isThinking).toBe(true);
        expect(result.spinner).toBe(spinner);
      });
    });

    it('Thinking以外のテキストは検知しない', () => {
      const input = 'Regular output text';
      const result = detector.detectThinking(input);

      expect(result.isThinking).toBe(false);
      expect(result.spinner).toBe('');
    });

    it('部分的なThinkingパターンも検知できる', () => {
      const input = 'Some text\r⠋ Thinking...more text';
      const result = detector.detectThinking(input);

      expect(result.isThinking).toBe(true);
      expect(result.spinner).toBe('⠋');
    });

    it('ANSIエスケープシーケンスが含まれていても検知できる', () => {
      const input = '\x1b[39m\x1b[1G\x1b[?25h\x1b[2K\r⠋ Thinking...';
      const result = detector.detectThinking(input);

      expect(result.isThinking).toBe(true);
      expect(result.spinner).toBe('⠋');
    });
  });

  describe('isThinkingInProgress', () => {
    it('状態を追跡できる', () => {
      expect(detector.isThinkingInProgress()).toBe(false);

      const input = '\r⠋ Thinking...';
      detector.detectThinking(input);

      expect(detector.isThinkingInProgress()).toBe(true);
    });

    it('非Thinkingパターンで状態がリセットされる', () => {
      // まずThinking状態にする
      detector.detectThinking('\r⠋ Thinking...');
      expect(detector.isThinkingInProgress()).toBe(true);

      // 通常のテキストで状態がリセットされる
      detector.detectThinking('Regular text');
      expect(detector.isThinkingInProgress()).toBe(false);
    });
  });

  describe('stripThinkingPattern', () => {
    it('Thinkingパターンを除去できる', () => {
      const input = '\r⠋ Thinking...';
      const result = detector.stripThinkingPattern(input);

      expect(result).toBe('');
    });

    it('Thinkingパターンの前後のテキストは保持する', () => {
      const input = 'Before\r⠋ Thinking...After';
      const result = detector.stripThinkingPattern(input);

      expect(result).toBe('BeforeAfter');
    });

    it('Thinkingパターンがない場合は元のテキストを返す', () => {
      const input = 'No thinking pattern here';
      const result = detector.stripThinkingPattern(input);

      expect(result).toBe('No thinking pattern here');
    });

    it('複数のThinkingパターンをすべて除去する', () => {
      const input = '\r⠋ Thinking...\r⠙ Thinking...\r⠹ Thinking...';
      const result = detector.stripThinkingPattern(input);

      expect(result).toBe('');
    });
  });

  describe('getLastSpinner', () => {
    it('最後に検知したスピナーを取得できる', () => {
      expect(detector.getLastSpinner()).toBe('');

      detector.detectThinking('\r⠋ Thinking...');
      expect(detector.getLastSpinner()).toBe('⠋');

      detector.detectThinking('\r⠙ Thinking...');
      expect(detector.getLastSpinner()).toBe('⠙');
    });

    it('非Thinkingパターンではスピナーがクリアされる', () => {
      detector.detectThinking('\r⠋ Thinking...');
      expect(detector.getLastSpinner()).toBe('⠋');

      detector.detectThinking('Regular text');
      expect(detector.getLastSpinner()).toBe('');
    });
  });
});

/**
 * ANSI文字列除去ユーティリティのテスト
 */

import { stripAnsiCodes } from '../utils/ansi-stripper';

describe('ANSI文字列除去ユーティリティ', () => {
  describe('stripAnsiCodes', () => {
    it('基本的なANSIエスケープシーケンスを除去する', () => {
      const input = '\x1b[31mRed text\x1b[0m';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Red text');
    });

    it('複数のANSIエスケープシーケンスを除去する', () => {
      const input = '\x1b[1m\x1b[31mBold red text\x1b[0m\x1b[0m';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Bold red text');
    });

    it('スピナー文字を除去する', () => {
      const input = '⠋ Loading...';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Loading...');
    });

    it('プログレスバー文字を除去する', () => {
      const input = '████████░░ 80%';
      const result = stripAnsiCodes(input);
      expect(result).toBe('80%');
    });

    it('制御文字を除去する（改行は保持）', () => {
      const input = 'Line 1\nLine 2\x00\x08';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Line 1\nLine 2');
    });

    it('Thinking文字列の重複を統合する', () => {
      const input = 'thinking... thinking... thinking...';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Thinking...');
    });

    it('余分な空白を正規化する', () => {
      const input = '  Multiple   spaces   here  ';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Multiple spaces here');
    });

    it('空文字列を処理する', () => {
      const result = stripAnsiCodes('');
      expect(result).toBe('');
    });

    it('ANSIシーケンスを含まないテキストをそのまま返す', () => {
      const input = 'Plain text without ANSI codes';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Plain text without ANSI codes');
    });

    it('OSCシーケンス（Operating System Command）を除去する', () => {
      const input = '\x1b]0;Window Title\x07Plain text';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Plain text');
    });

    it('8ビット制御文字を除去する', () => {
      const input = '\x80\x9FPlain text\x81';
      const result = stripAnsiCodes(input);
      expect(result).toBe('Plain text');
    });

    it('不完全なエスケープシーケンスを除去する', () => {
      const input = '\x1b[incomplete sequence text';
      const result = stripAnsiCodes(input);
      expect(result).toBe('ncomplete sequence text');
    });
  });
});

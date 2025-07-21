import { describe, it, expect, beforeEach } from 'vitest';

import { AnsiParser } from '../../../../services/amazon-q-cli/stream-handler/ansi-parser';

describe('AnsiParser', () => {
  let parser: AnsiParser;

  beforeEach(() => {
    parser = new AnsiParser();
  });

  describe('removeAnsiCodes', () => {
    it('ANSIカラーコードを除去できる', () => {
      const input = '\x1b[38;5;10mGreen Text\x1b[0m';
      const result = parser.removeAnsiCodes(input);

      expect(result).toBe('Green Text');
    });

    it('複数のANSIコードを除去できる', () => {
      const input = '\x1b[1m\x1b[38;5;12mBold Blue\x1b[0m\x1b[39m';
      const result = parser.removeAnsiCodes(input);

      expect(result).toBe('Bold Blue');
    });

    it('カーソル制御コードを除去できる', () => {
      const input = '\x1b[1G\x1b[1A\x1b[2KSome text';
      const result = parser.removeAnsiCodes(input);

      expect(result).toBe('Some text');
    });

    it('ANSIコードがない場合は元のテキストを返す', () => {
      const input = 'Plain text without ANSI';
      const result = parser.removeAnsiCodes(input);

      expect(result).toBe('Plain text without ANSI');
    });

    it('特殊な制御文字も除去できる', () => {
      const input = '\x1b7\x1b8\x1b[?25h\x1b[?25lVisible text';
      const result = parser.removeAnsiCodes(input);

      expect(result).toBe('Visible text');
    });
  });

  describe('extractVisibleText', () => {
    it('キャリッジリターンを考慮して最終的な表示テキストを抽出できる', () => {
      const input = 'First line\rSecond line';
      const result = parser.extractVisibleText(input);

      expect(result).toBe('Second line');
    });

    it('複数のキャリッジリターンを正しく処理できる', () => {
      const input = 'AAA\rBBB\rCCC';
      const result = parser.extractVisibleText(input);

      expect(result).toBe('CCC');
    });

    it('改行とキャリッジリターンの組み合わせを処理できる', () => {
      const input = 'Line 1\nLine 2\rLine 3';
      const result = parser.extractVisibleText(input);

      expect(result).toBe('Line 1\nLine 3');
    });

    it('ANSIコードとキャリッジリターンの組み合わせを処理できる', () => {
      const input = '\x1b[38;5;10mFirst\x1b[0m\r\x1b[38;5;12mSecond\x1b[0m';
      const result = parser.extractVisibleText(input);

      expect(result).toBe('Second');
    });
  });

  describe('parseColorCode', () => {
    it('256色のカラーコードを解析できる', () => {
      const input = '\x1b[38;5;10m';
      const result = parser.parseColorCode(input);

      expect(result).toEqual({
        type: 'foreground',
        colorIndex: 10,
        colorName: 'bright-green',
      });
    });

    it('背景色のカラーコードを解析できる', () => {
      const input = '\x1b[48;5;12m';
      const result = parser.parseColorCode(input);

      expect(result).toEqual({
        type: 'background',
        colorIndex: 12,
        colorName: 'bright-blue',
      });
    });

    it('無効なカラーコードはnullを返す', () => {
      const input = '\x1b[1m'; // ボールドコード
      const result = parser.parseColorCode(input);

      expect(result).toBeNull();
    });
  });

  describe('hasAnsiCodes', () => {
    it('ANSIコードが含まれている場合はtrueを返す', () => {
      const input = 'Text with \x1b[38;5;10mcolor\x1b[0m';

      expect(parser.hasAnsiCodes(input)).toBe(true);
    });

    it('ANSIコードが含まれていない場合はfalseを返す', () => {
      const input = 'Plain text without any codes';

      expect(parser.hasAnsiCodes(input)).toBe(false);
    });

    it('エスケープ文字だけの場合もtrueを返す', () => {
      const input = 'Text with \x1b incomplete';

      expect(parser.hasAnsiCodes(input)).toBe(true);
    });
  });

  describe('splitByAnsi', () => {
    it('ANSIコードで文字列を分割できる', () => {
      const input = 'Before\x1b[38;5;10mGreen\x1b[0mAfter';
      const result = parser.splitByAnsi(input);

      expect(result).toEqual([
        { text: 'Before', ansiCode: '' },
        { text: 'Green', ansiCode: '\x1b[38;5;10m' },
        { text: 'After', ansiCode: '\x1b[0m' },
      ]);
    });

    it('連続したANSIコードを正しく処理できる', () => {
      const input = '\x1b[1m\x1b[38;5;12mBold Blue\x1b[0m';
      const result = parser.splitByAnsi(input);

      // 実装では連続するANSIコードが統合される
      expect(result).toEqual([{ text: 'Bold Blue', ansiCode: '\x1b[38;5;12m' }]);
    });

    it('ANSIコードがない場合は単一の要素を返す', () => {
      const input = 'Plain text';
      const result = parser.splitByAnsi(input);

      expect(result).toEqual([{ text: 'Plain text', ansiCode: '' }]);
    });
  });
});

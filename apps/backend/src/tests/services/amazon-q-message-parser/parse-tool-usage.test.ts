import { describe, test, expect } from 'vitest';

import {
  parseToolUsage,
  hasIncompleteToolPattern,
  combineToolPatterns,
} from '../../../services/amazon-q-message-parser/parse-tool-usage';

describe('parseToolUsage', () => {
  describe('正常系：標準的なツールパターン', () => {
    test('単一ツールを正しく検出する', () => {
      const input = 'AIの回答です。🛠️ Using tool: fs_read';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(true);
      expect(result.tools).toEqual(['fs_read']);
      expect(result.originalLine).toBe(input);
      expect(result.cleanedLine).toBe('AIの回答です。');
    });

    test('(trusted)付きのツールを正しく検出する', () => {
      const input = '🛠️ Using tool: fs_read (trusted)続きの回答';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(true);
      expect(result.tools).toEqual(['fs_read']);
      expect(result.originalLine).toBe(input);
      expect(result.cleanedLine).toBe('続きの回答');
    });

    test('複数のツール使用行を検出する', () => {
      const input = '🛠️ Using tool: fs_read🛠️ Using tool: github_mcp回答内容';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(true);
      expect(result.tools).toEqual(['fs_read', 'github_mcp']);
      expect(result.cleanedLine).toBe('回答内容');
    });

    test('実際のAmazon Q出力形式を正しく処理する', () => {
      const input =
        '🛠️ Using tool: fs_read (trusted)\n⋮\n● Reading directory: /Users/mzkmnk/dev with maximum depth of 0\n⋮\n● Completed in 0.1s';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(true);
      expect(result.tools).toEqual(['fs_read']);
      expect(result.cleanedLine).not.toContain('🛠️ Using tool:');
    });
  });

  describe('正常系：ツールなしパターン', () => {
    test('ツールパターンがない場合は空配列を返す', () => {
      const input = '通常のAI回答です。';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(false);
      expect(result.tools).toEqual([]);
      expect(result.cleanedLine).toBe(input);
    });

    test('空文字の場合は空配列を返す', () => {
      const input = '';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(false);
      expect(result.tools).toEqual([]);
      expect(result.cleanedLine).toBe('');
    });
  });

  describe('異常系：不正なパターン', () => {
    test('不完全なツールパターンは検出しない', () => {
      const input = '🛠️ Using tool:';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(false);
      expect(result.tools).toEqual([]);
      expect(result.cleanedLine).toBe(input);
    });

    test('ツール名がないパターンは検出しない', () => {
      const input = '🛠️ Using tool: ';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(false);
      expect(result.tools).toEqual([]);
    });

    test('絵文字なしのパターンは検出しない', () => {
      const input = 'Using tool: fs_read';
      const result = parseToolUsage(input);

      expect(result.hasTools).toBe(false);
      expect(result.tools).toEqual([]);
      expect(result.cleanedLine).toBe(input);
    });
  });
});

describe('hasIncompleteToolPattern', () => {
  test('不完全なツールパターンを正しく検出する', () => {
    expect(hasIncompleteToolPattern('🛠️ Using tool:')).toBe(true);
    expect(hasIncompleteToolPattern('🛠️ Using tool: fs')).toBe(true);
    expect(hasIncompleteToolPattern('回答🛠️ Using tool: gi')).toBe(true);
  });

  test('完全なツールパターンは不完全として検出しない', () => {
    expect(hasIncompleteToolPattern('🛠️ Using tool: fs_read ')).toBe(false);
    expect(hasIncompleteToolPattern('回答🛠️ Using tool: fs_read\n')).toBe(false);
  });

  test('ツールパターンがない場合は不完全として検出しない', () => {
    expect(hasIncompleteToolPattern('通常の回答')).toBe(false);
    expect(hasIncompleteToolPattern('')).toBe(false);
  });
});

describe('combineToolPatterns', () => {
  test('分割されたツールパターンを正しく結合する', () => {
    const previousLine = '回答です🛠️ Using tool: fs_re';
    const currentLine = 'ad (trusted)続き';
    const result = combineToolPatterns(previousLine, currentLine);

    expect(result.combinedLine).toBe('回答です🛠️ Using tool: fs_read (trusted)続き');
    expect(result.detection.hasTools).toBe(true);
    expect(result.detection.tools).toEqual(['fs_read']);
    expect(result.detection.cleanedLine).toBe('回答です続き');
  });

  test('結合してもツールパターンがない場合', () => {
    const previousLine = '通常の';
    const currentLine = '回答です';
    const result = combineToolPatterns(previousLine, currentLine);

    expect(result.combinedLine).toBe('通常の回答です');
    expect(result.detection.hasTools).toBe(false);
    expect(result.detection.tools).toEqual([]);
  });
});

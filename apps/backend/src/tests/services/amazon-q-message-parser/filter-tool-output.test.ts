import { describe, test, expect } from 'vitest';

import { filterToolOutput } from '../../../services/amazon-q-message-parser/filter-tool-output';

describe('filterToolOutput', () => {
  describe('TDD Red: ツール実行詳細のフィルタリング', () => {
    test('進行状況インジケーター（⋮）を除外する', () => {
      const input = '⋮';
      const result = filterToolOutput(input);

      expect(result.shouldSkip).toBe(true);
      expect(result.cleanedLine).toBe('');
    });

    test('実行詳細（● Reading directory）を除外する', () => {
      const input = '● Reading directory: /Users/mzkmnk/dev with maximum depth of 0';
      const result = filterToolOutput(input);

      expect(result.shouldSkip).toBe(true);
      expect(result.cleanedLine).toBe('');
    });

    test('完了メッセージ（● Completed）を除外する', () => {
      const input = '● Completed in 0.1s';
      const result = filterToolOutput(input);

      expect(result.shouldSkip).toBe(true);
      expect(result.cleanedLine).toBe('');
    });

    test('通常のテキストは除外しない', () => {
      const input = '現在のディレクトリには多数のプロジェクトフォルダがあります。';
      const result = filterToolOutput(input);

      expect(result.shouldSkip).toBe(false);
      expect(result.cleanedLine).toBe(input);
    });

    test('ツール使用行は除外しない', () => {
      const input = '🛠️ Using tool: fs_read (trusted)';
      const result = filterToolOutput(input);

      expect(result.shouldSkip).toBe(false);
      expect(result.cleanedLine).toBe(input);
    });

    test('複数の実行詳細が混在する場合', () => {
      const lines = [
        '🛠️ Using tool: fs_read (trusted)',
        '⋮',
        '● Reading directory: /Users/mzkmnk/dev with maximum depth of 0',
        '⋮',
        '● Completed in 0.1s',
        '> 現在のディレクトリには多数のプロジェクトフォルダがあります。',
      ];

      const results = lines.map(line => filterToolOutput(line));

      expect(results[0].shouldSkip).toBe(false); // ツール使用行
      expect(results[1].shouldSkip).toBe(true); // インジケーター
      expect(results[2].shouldSkip).toBe(true); // 実行詳細
      expect(results[3].shouldSkip).toBe(true); // インジケーター
      expect(results[4].shouldSkip).toBe(true); // 完了メッセージ
      expect(results[5].shouldSkip).toBe(false); // 通常のテキスト
    });

    test('> プレフィックスを適切に処理する', () => {
      const input = '> 現在のディレクトリには多数のプロジェクトフォルダがあります。';
      const result = filterToolOutput(input);

      expect(result.shouldSkip).toBe(false);
      expect(result.cleanedLine).toBe(input); // > プレフィックスは保持
    });

    test('実行詳細のバリエーションを正しく処理する', () => {
      const variations = [
        '● Creating file: /path/to/file.ts',
        '● Writing content: 500 bytes',
        '● Running command: npm test',
        '● Executing: git status',
      ];

      variations.forEach(input => {
        const result = filterToolOutput(input);
        expect(result.shouldSkip).toBe(true);
        expect(result.cleanedLine).toBe('');
      });
    });

    test('部分的なマッチは除外しない', () => {
      const inputs = [
        'This is ⋮ in the middle',
        'Not a ● at the beginning',
        'Completed but not in the right format',
      ];

      inputs.forEach(input => {
        const result = filterToolOutput(input);
        expect(result.shouldSkip).toBe(false);
        expect(result.cleanedLine).toBe(input);
      });
    });

    test('空行や空白のみの行を適切に処理する', () => {
      expect(filterToolOutput('').shouldSkip).toBe(false);
      expect(filterToolOutput('   ').shouldSkip).toBe(false);
      expect(filterToolOutput('\t').shouldSkip).toBe(false);
    });
  });
});

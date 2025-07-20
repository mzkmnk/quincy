import { describe, test, expect } from 'vitest';

import { isToolUsageLine } from '../../../../services/amazon-q-cli/message-handler/is-tool-usage-line';

describe('isToolUsageLine', () => {
  describe('TDD Red: ツール使用行の判定機能', () => {
    test('標準的なツール使用行を正しく判定する', () => {
      expect(isToolUsageLine('[Tool uses: fs_read]')).toBe(true);
      expect(isToolUsageLine('[Tool uses: github_mcp]')).toBe(true);
      expect(isToolUsageLine('[Tool uses: web_search]')).toBe(true);
    });

    test('複数ツールを含む行を正しく判定する', () => {
      expect(isToolUsageLine('[Tool uses: fs_read, github_mcp]')).toBe(true);
      expect(isToolUsageLine('[Tool uses: fs_read, github_mcp, web_search]')).toBe(true);
      expect(isToolUsageLine('[Tool uses: tool1, tool2, tool3]')).toBe(true);
    });

    test('ツール使用行でない場合は false を返す', () => {
      expect(isToolUsageLine('通常のテキスト')).toBe(false);
      expect(isToolUsageLine('これはツール使用行ではありません')).toBe(false);
      expect(isToolUsageLine('')).toBe(false);
      expect(isToolUsageLine('Tool uses: fs_read')).toBe(false); // 括弧なし
    });

    test('不完全なツール使用行は false を返す', () => {
      expect(isToolUsageLine('[Tool uses: fs_read')).toBe(false); // 閉じ括弧なし
      expect(isToolUsageLine('Tool uses: fs_read]')).toBe(false); // 開き括弧なし
      expect(isToolUsageLine('[Tool uses:]')).toBe(false); // ツール名なし
      expect(isToolUsageLine('[Tool uses: ]')).toBe(false); // 空のツール名
    });

    test('前後にテキストがある場合でも正しく判定する', () => {
      expect(isToolUsageLine('前のテキスト[Tool uses: fs_read]')).toBe(true);
      expect(isToolUsageLine('[Tool uses: fs_read]後のテキスト')).toBe(true);
      expect(isToolUsageLine('前[Tool uses: fs_read]後')).toBe(true);
    });

    test('特殊文字を含むツール名を正しく判定する', () => {
      expect(isToolUsageLine('[Tool uses: fs_read_v2]')).toBe(true);
      expect(isToolUsageLine('[Tool uses: web-search]')).toBe(true);
      expect(isToolUsageLine('[Tool uses: api_call_1]')).toBe(true);
    });

    test('型安全性のテスト', () => {
      // @ts-expect-error Testing runtime safety
      expect(isToolUsageLine(null)).toBe(false);
      // @ts-expect-error Testing runtime safety
      expect(isToolUsageLine(undefined)).toBe(false);
      // @ts-expect-error Testing runtime safety
      expect(isToolUsageLine(123)).toBe(false);
    });

    test('大文字小文字の違いを正しく処理する', () => {
      expect(isToolUsageLine('[tool uses: fs_read]')).toBe(false); // 小文字は無効
      expect(isToolUsageLine('[TOOL USES: fs_read]')).toBe(false); // 大文字は無効
      expect(isToolUsageLine('[Tool Uses: fs_read]')).toBe(false); // 混在は無効
    });

    test('複数のツール使用パターンが含まれる場合', () => {
      expect(isToolUsageLine('[Tool uses: fs_read][Tool uses: github_mcp]')).toBe(true);
      expect(isToolUsageLine('text[Tool uses: fs_read]text[Tool uses: github_mcp]text')).toBe(true);
    });
  });
});

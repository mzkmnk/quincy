import { describe, test, expect } from 'vitest';

import { isToolUsageLine } from '../../../../services/amazon-q-cli/message-handler/is-tool-usage-line';

describe('isToolUsageLine', () => {
  describe('TDD Red: ツール使用行の判定機能', () => {
    test('標準的なツール使用行を正しく判定する', () => {
      expect(isToolUsageLine('🛠️ Using tool: fs_read')).toBe(true);
      expect(isToolUsageLine('🛠️ Using tool: github_mcp')).toBe(true);
      expect(isToolUsageLine('🛠️ Using tool: web_search')).toBe(true);
    });

    test('(trusted)付きのツール使用行を正しく判定する', () => {
      expect(isToolUsageLine('🛠️ Using tool: fs_read (trusted)')).toBe(true);
      expect(isToolUsageLine('🛠️ Using tool: github_mcp (trusted)')).toBe(true);
      expect(isToolUsageLine('🛠️ Using tool: web_search (trusted)')).toBe(true);
    });

    test('ツール使用行でない場合は false を返す', () => {
      expect(isToolUsageLine('通常のテキスト')).toBe(false);
      expect(isToolUsageLine('これはツール使用行ではありません')).toBe(false);
      expect(isToolUsageLine('')).toBe(false);
      expect(isToolUsageLine('Using tool: fs_read')).toBe(false); // 絵文字なし
    });

    test('不完全なツール使用行は false を返す', () => {
      expect(isToolUsageLine('🛠️ Using tool:')).toBe(false); // ツール名なし
      expect(isToolUsageLine('🛠️ Using tool: ')).toBe(false); // 空のツール名
      expect(isToolUsageLine('🛠️')).toBe(false); // 絵文字のみ
      expect(isToolUsageLine('Using tool: fs_read (trusted)')).toBe(false); // 絵文字なし
    });

    test('前後にテキストがある場合でも正しく判定する', () => {
      expect(isToolUsageLine('前のテキスト🛠️ Using tool: fs_read')).toBe(true);
      expect(isToolUsageLine('🛠️ Using tool: fs_read後のテキスト')).toBe(true);
      expect(isToolUsageLine('前🛠️ Using tool: fs_read後')).toBe(true);
    });

    test('特殊文字を含むツール名を正しく判定する', () => {
      expect(isToolUsageLine('🛠️ Using tool: fs_read_v2')).toBe(true);
      expect(isToolUsageLine('🛠️ Using tool: web-search')).toBe(true);
      expect(isToolUsageLine('🛠️ Using tool: api_call_1')).toBe(true);
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
      expect(isToolUsageLine('🛠️ using tool: fs_read')).toBe(false); // 小文字は無効
      expect(isToolUsageLine('🛠️ USING TOOL: fs_read')).toBe(false); // 大文字は無効
      expect(isToolUsageLine('🛠️ Using Tool: fs_read')).toBe(false); // 混在は無効
    });

    test('複数のツール使用パターンが含まれる場合', () => {
      expect(isToolUsageLine('🛠️ Using tool: fs_read🛠️ Using tool: github_mcp')).toBe(true);
      expect(isToolUsageLine('text🛠️ Using tool: fs_read text🛠️ Using tool: github_mcp text')).toBe(
        true
      );
    });
  });
});

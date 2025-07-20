/**
 * ツール表示判定機能のテスト
 */

import { shouldShowTools } from '../should-show-tools';
import { ToolList } from '../../../../../core/types/tool-display.types';

describe('shouldShowTools', () => {
  describe('TDD Green: ツール表示判定機能', () => {
    test('ツールリストがある場合は true を返す', () => {
      const tools: ToolList = ['fs_read', 'github_mcp'];
      expect(shouldShowTools(tools)).toBe(true);
    });

    test('単一ツールでも true を返す', () => {
      const tools: ToolList = ['fs_read'];
      expect(shouldShowTools(tools)).toBe(true);
    });

    test('空のツールリストの場合は false を返す', () => {
      const tools: ToolList = [];
      expect(shouldShowTools(tools)).toBe(false);
    });

    test('undefined の場合は false を返す', () => {
      expect(shouldShowTools(undefined)).toBe(false);
    });

    test('null の場合は false を返す', () => {
      expect(shouldShowTools(null as unknown as ToolList)).toBe(false);
    });

    test('配列でない場合は false を返す', () => {
      expect(shouldShowTools('not_array' as unknown as ToolList)).toBe(false);
    });
  });
});

/**
 * ツール表示フォーマット機能のテスト
 */

import { formatToolsDisplay } from '../format-tools-display';
import { ToolList } from '../../../../../core/types/tool-display.types';

describe('formatToolsDisplay', () => {
  describe('TDD Green: ツール表示フォーマット機能', () => {
    test('複数ツールをカンマ区切りでフォーマットする', () => {
      const tools: ToolList = ['fs_read', 'github_mcp', 'web_search'];
      expect(formatToolsDisplay(tools)).toBe('tools: fs_read, github_mcp, web_search');
    });

    test('単一ツールを正しくフォーマットする', () => {
      const tools: ToolList = ['fs_read'];
      expect(formatToolsDisplay(tools)).toBe('tools: fs_read');
    });

    test('空のツールリストは空文字列を返す', () => {
      const tools: ToolList = [];
      expect(formatToolsDisplay(tools)).toBe('');
    });

    test('undefined は空文字列を返す', () => {
      expect(formatToolsDisplay(undefined)).toBe('');
    });

    test('null は空文字列を返す', () => {
      expect(formatToolsDisplay(null as unknown as ToolList)).toBe('');
    });

    test('配列でない場合は空文字列を返す', () => {
      expect(formatToolsDisplay('not_array' as unknown as ToolList)).toBe('');
    });

    test('特殊文字を含むツール名も正しくフォーマットする', () => {
      const tools: ToolList = ['fs_read_v2', 'web-search', 'api_call_1'];
      expect(formatToolsDisplay(tools)).toBe('tools: fs_read_v2, web-search, api_call_1');
    });
  });
});

import { describe, test, expect } from 'vitest';

import { formatToolsUsed } from '../../../services/amazon-q-message-formatter/format-tools-used';
import type { ToolUse } from '../../../services/amazon-q-history-types';

describe('formatToolsUsed', () => {
  describe('TDD Red: ツール表示の統一', () => {
    test('ツールが使用されていない場合は空文字を返す', () => {
      const tools: ToolUse[] = [];
      const result = formatToolsUsed(tools);

      expect(result).toBe('');
    });

    test('単一ツールをシンプルなtools:形式で表示する', () => {
      const tools: ToolUse[] = [
        {
          id: 'tool1',
          name: 'fs_read',
          orig_name: 'fs_read',
          args: { path: '/test' },
          orig_args: { path: '/test' },
        },
      ];
      const result = formatToolsUsed(tools);

      expect(result).toBe('tools: fs_read');
    });

    test('複数ツールをカンマ区切りで表示する', () => {
      const tools: ToolUse[] = [
        {
          id: 'tool1',
          name: 'fs_read',
          orig_name: 'fs_read',
          args: { path: '/test' },
          orig_args: { path: '/test' },
        },
        {
          id: 'tool2',
          name: 'github_mcp',
          orig_name: 'github_mcp',
          args: { query: 'test' },
          orig_args: { query: 'test' },
        },
      ];
      const result = formatToolsUsed(tools);

      expect(result).toBe('tools: fs_read, github_mcp');
    });

    test('多数のツールを適切に表示する', () => {
      const tools: ToolUse[] = [
        {
          id: 'tool1',
          name: 'fs_read',
          orig_name: 'fs_read',
          args: {},
          orig_args: {},
        },
        {
          id: 'tool2',
          name: 'github_mcp',
          orig_name: 'github_mcp',
          args: {},
          orig_args: {},
        },
        {
          id: 'tool3',
          name: 'web_search',
          orig_name: 'web_search',
          args: {},
          orig_args: {},
        },
      ];
      const result = formatToolsUsed(tools);

      expect(result).toBe('tools: fs_read, github_mcp, web_search');
    });

    test('重複したツール名を除去する', () => {
      const tools: ToolUse[] = [
        {
          id: 'tool1',
          name: 'fs_read',
          orig_name: 'fs_read',
          args: { path: '/test1' },
          orig_args: { path: '/test1' },
        },
        {
          id: 'tool2',
          name: 'fs_read',
          orig_name: 'fs_read',
          args: { path: '/test2' },
          orig_args: { path: '/test2' },
        },
        {
          id: 'tool3',
          name: 'github_mcp',
          orig_name: 'github_mcp',
          args: {},
          orig_args: {},
        },
      ];
      const result = formatToolsUsed(tools);

      expect(result).toBe('tools: fs_read, github_mcp');
    });

    test('ツール名のソートを維持する', () => {
      const tools: ToolUse[] = [
        {
          id: 'tool1',
          name: 'web_search',
          orig_name: 'web_search',
          args: {},
          orig_args: {},
        },
        {
          id: 'tool2',
          name: 'fs_read',
          orig_name: 'fs_read',
          args: {},
          orig_args: {},
        },
        {
          id: 'tool3',
          name: 'github_mcp',
          orig_name: 'github_mcp',
          args: {},
          orig_args: {},
        },
      ];
      const result = formatToolsUsed(tools);

      // 出現順序を維持（ソートしない）
      expect(result).toBe('tools: web_search, fs_read, github_mcp');
    });

    test('引数の詳細は表示しない（シンプル表示）', () => {
      const tools: ToolUse[] = [
        {
          id: 'tool1',
          name: 'fs_read',
          orig_name: 'fs_read',
          args: {
            path: '/very/long/path/to/file.ts',
            encoding: 'utf-8',
            maxLines: 1000,
          },
          orig_args: {
            path: '/very/long/path/to/file.ts',
            encoding: 'utf-8',
            maxLines: 1000,
          },
        },
      ];
      const result = formatToolsUsed(tools);

      // 引数の詳細は含まない
      expect(result).toBe('tools: fs_read');
      expect(result).not.toContain('path');
      expect(result).not.toContain('encoding');
      expect(result).not.toContain('maxLines');
    });
  });
});

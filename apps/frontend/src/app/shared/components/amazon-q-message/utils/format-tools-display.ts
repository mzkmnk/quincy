/**
 * ツール表示フォーマット機能
 * 最適化されたパフォーマンスと視覚的改善
 */

import { ToolList } from '../../../../core/types/tool-display.types';

/**
 * ツール表示設定
 */
export interface ToolDisplayConfig {
  maxToolsShown: number;
  showIcon: boolean;
  useCompactMode: boolean;
  highlightRecentTools: boolean;
}

/**
 * デフォルトツール表示設定
 */
export const DEFAULT_TOOL_DISPLAY_CONFIG: ToolDisplayConfig = {
  maxToolsShown: 5,
  showIcon: true,
  useCompactMode: false,
  highlightRecentTools: true,
};

/**
 * ツール名の表示用変換マップ
 */
const TOOL_DISPLAY_MAP: Record<string, string> = {
  fs_read: '📖 ファイル読込',
  fs_write: '✏️ ファイル書込',
  fs_list: '📋 ファイル一覧',
  github_mcp: '🐙 GitHub',
  web_search: '🔍 ウェブ検索',
  code_execution: '⚡ コード実行',
  terminal: '💻 ターミナル',
  database: '🗃️ データベース',
};

/**
 * ツールリストを表示用文字列にフォーマットする（最適化版）
 *
 * @param tools ツールリスト
 * @param config 表示設定（オプション）
 * @returns フォーマットされた表示文字列
 */
export function formatToolsDisplay(
  tools?: ToolList,
  config: Partial<ToolDisplayConfig> = {}
): string {
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return '';
  }

  const finalConfig = { ...DEFAULT_TOOL_DISPLAY_CONFIG, ...config };

  // 重複除去（Set使用で高速化）
  const uniqueTools = Array.from(new Set(tools));

  // 最大表示数制限
  const toolsToShow = uniqueTools.slice(0, finalConfig.maxToolsShown);
  const hasMoreTools = uniqueTools.length > finalConfig.maxToolsShown;

  // ツール名変換
  const displayTools = toolsToShow.map(tool => {
    if (finalConfig.showIcon && TOOL_DISPLAY_MAP[tool]) {
      return TOOL_DISPLAY_MAP[tool];
    }
    return tool;
  });

  // フォーマット結果生成
  let result = finalConfig.useCompactMode
    ? displayTools.join(',')
    : `tools: ${displayTools.join(', ')}`;

  // 省略表示
  if (hasMoreTools) {
    const remainingCount = uniqueTools.length - finalConfig.maxToolsShown;
    result += ` +${remainingCount}`;
  }

  return result;
}

/**
 * ツールの重要度を計算する
 *
 * @param tool ツール名
 * @returns 重要度スコア（1-10）
 */
export function getToolImportance(tool: string): number {
  const importanceMap: Record<string, number> = {
    fs_write: 9,
    code_execution: 8,
    database: 8,
    fs_read: 7,
    github_mcp: 7,
    terminal: 6,
    web_search: 5,
    fs_list: 4,
  };

  return importanceMap[tool] || 3;
}

/**
 * ツールリストを重要度順にソートする
 *
 * @param tools ツールリスト
 * @returns ソートされたツールリスト
 */
export function sortToolsByImportance(tools: string[]): string[] {
  return [...tools].sort((a, b) => getToolImportance(b) - getToolImportance(a));
}

/**
 * コンパクト表示用のツールフォーマット
 *
 * @param tools ツールリスト
 * @returns コンパクト形式の文字列
 */
export function formatToolsCompact(tools?: ToolList): string {
  return formatToolsDisplay(tools, {
    useCompactMode: true,
    maxToolsShown: 3,
    showIcon: false,
  });
}

/**
 * アイコン付き詳細表示用のツールフォーマット
 *
 * @param tools ツールリスト
 * @returns アイコン付き詳細形式の文字列
 */
export function formatToolsDetailed(tools?: ToolList): string {
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return '';
  }

  const sortedTools = sortToolsByImportance(Array.from(new Set(tools)));

  return formatToolsDisplay(sortedTools, {
    showIcon: true,
    maxToolsShown: 8,
    useCompactMode: false,
  });
}

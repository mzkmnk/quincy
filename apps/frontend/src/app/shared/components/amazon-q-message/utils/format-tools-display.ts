/**
 * ツール表示フォーマット機能
 */

import { ToolList } from '../../../../core/types/tool-display.types';

/**
 * ツールリストを表示用文字列にフォーマットする
 *
 * @param tools ツールリスト
 * @returns フォーマットされた表示文字列
 */
export function formatToolsDisplay(tools?: ToolList): string {
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return '';
  }

  return `tools: ${tools.join(', ')}`;
}

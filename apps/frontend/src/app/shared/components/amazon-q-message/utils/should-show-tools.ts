/**
 * ツール表示判定機能
 */

import { ToolList } from '../../../../core/types/tool-display.types';

/**
 * ツール情報を表示するかどうかを判定する
 *
 * @param tools ツールリスト
 * @returns ツール表示すべき場合は true、そうでなければ false
 */
export function shouldShowTools(tools?: ToolList): boolean {
  if (!tools || !Array.isArray(tools)) {
    return false;
  }

  return tools.length > 0;
}

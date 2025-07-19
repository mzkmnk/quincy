import { amazonQHistoryState, DisplayMessage } from '../amazon-q-history.state';

/**
 * 詳細履歴表示に切り替える
 * @param messages 表示するメッセージ
 * @param stats 表示する統計情報
 */
export function switchToDetailedHistoryView(
  messages: DisplayMessage[],
  stats: {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  } | null
): void {
  amazonQHistoryState.update(state => ({
    ...state,
    detailedHistoryMessages: messages,
    historyStats: stats,
  }));
}

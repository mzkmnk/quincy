import { amazonQHistoryState } from '../amazon-q-history.state';

/**
 * 履歴統計情報を設定する
 * @param stats 設定する履歴統計情報
 */
export function setHistoryStats(
  stats: {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  } | null
): void {
  amazonQHistoryState.update(state => ({
    ...state,
    historyStats: stats,
  }));
}

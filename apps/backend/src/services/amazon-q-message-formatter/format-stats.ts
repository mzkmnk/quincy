/**
 * 統計情報を整形
 */

export function formatStats(stats: {
  totalEntries: number;
  totalTurns: number;
  averageToolUsesPerTurn: number;
  totalToolUses: number;
}): string {
  return [
    `📊 会話の統計情報:`,
    `• 総エントリー数: ${stats.totalEntries}`,
    `• 会話ターン数: ${stats.totalTurns}`,
    `• 総ツール使用回数: ${stats.totalToolUses}`,
    `• 1ターン平均ツール使用回数: ${stats.averageToolUsesPerTurn.toFixed(1)}`
  ].join('\n');
}
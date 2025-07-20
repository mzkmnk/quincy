/**
 * ツール実行の詳細出力をフィルタリング
 */

export interface FilterResult {
  shouldSkip: boolean;
  cleanedLine: string;
}

/**
 * ツール実行の詳細情報をフィルタリングする
 *
 * @param line 検査対象の行
 * @returns フィルタリング結果
 */
export function filterToolOutput(line: string): FilterResult {
  if (!line || typeof line !== 'string') {
    return {
      shouldSkip: false,
      cleanedLine: line || '',
    };
  }

  // 進行状況インジケーター（⋮）を除外
  if (line.trim() === '⋮') {
    return {
      shouldSkip: true,
      cleanedLine: '',
    };
  }

  // 実行詳細（● で始まる行）を除外
  if (line.trim().startsWith('● ')) {
    return {
      shouldSkip: true,
      cleanedLine: '',
    };
  }

  // 通常のテキストはそのまま返す
  return {
    shouldSkip: false,
    cleanedLine: line,
  };
}

/**
 * 複数行のツール出力をフィルタリング
 *
 * @param lines 検査対象の行配列
 * @returns フィルタリング後の行配列
 */
export function filterToolOutputLines(lines: string[]): string[] {
  return lines
    .map(line => filterToolOutput(line))
    .filter(result => !result.shouldSkip)
    .map(result => result.cleanedLine);
}

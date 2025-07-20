/**
 * ツール使用行の判定機能
 */

/**
 * 行がツール使用パターンを含むかどうかを判定する
 *
 * @param line 検査対象の行
 * @returns ツール使用行の場合 true、そうでなければ false
 */
export function isToolUsageLine(line: string): boolean {
  // 型安全性チェック
  if (!line || typeof line !== 'string') {
    return false;
  }

  // ツール使用パターンの正規表現: [Tool uses: ツール名]
  const toolPattern = /\[Tool uses: ([^\]]+)\]/;

  const match = toolPattern.exec(line);

  if (!match) {
    return false;
  }

  // マッチした部分のツール名をチェック
  const toolsString = match[1];

  // ツール名が空でないことを確認
  const tools = toolsString
    .split(',')
    .map(tool => tool.trim())
    .filter(tool => tool.length > 0);

  return tools.length > 0;
}

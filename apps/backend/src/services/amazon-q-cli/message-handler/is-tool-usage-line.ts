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

  // ツール使用パターンの正規表現: 🛠️ Using tool: ツール名
  const toolPattern = /🛠️ Using tool: ([^\s(]+)/;

  const match = toolPattern.exec(line);

  if (!match) {
    return false;
  }

  // マッチした部分のツール名をチェック
  const toolName = match[1].trim();

  // ツール名が空でないことを確認
  return toolName.length > 0;
}

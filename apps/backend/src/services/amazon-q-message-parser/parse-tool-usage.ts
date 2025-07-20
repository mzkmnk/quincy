/**
 * Amazon Q CLIのツール使用パターンを検出・解析する
 */

export interface ToolUsageDetection {
  hasTools: boolean;
  tools: string[];
  originalLine: string;
  cleanedLine: string;
}

/**
 * メッセージ行からツール使用パターンを検出する
 *
 * @param line 検査対象の行
 * @returns ツール検出結果
 */
export function parseToolUsage(line: string): ToolUsageDetection {
  if (!line || typeof line !== 'string') {
    return {
      hasTools: false,
      tools: [],
      originalLine: line || '',
      cleanedLine: line || '',
    };
  }

  // ツール使用パターンの正規表現: [Tool uses: ツール名]
  const toolPattern = /\[Tool uses: ([^\]]+)\]/g;

  const detectedTools: string[] = [];
  let cleanedLine = line;
  const matches = [...line.matchAll(toolPattern)];

  // 全てのマッチを処理
  for (const match of matches) {
    const toolsString = match[1];

    // カンマ区切りのツールを分離
    const tools = toolsString
      .split(',')
      .map(tool => tool.trim())
      .filter(tool => tool.length > 0);

    detectedTools.push(...tools);

    // マッチした部分を行から除去
    cleanedLine = cleanedLine.replace(match[0], '');
  }

  return {
    hasTools: detectedTools.length > 0,
    tools: detectedTools,
    originalLine: line,
    cleanedLine: cleanedLine.trim(),
  };
}

/**
 * 不完全なツールパターンを検出する（ストリーミング対応）
 *
 * @param line 検査対象の行
 * @returns 不完全パターンの存在
 */
export function hasIncompleteToolPattern(line: string): boolean {
  // 不完全なパターンを検出: "[Tool uses:" で始まるが "]" で終わらない
  const incompletePattern = /\[Tool uses:[^\]]*$/;
  return incompletePattern.test(line);
}

/**
 * 複数行にまたがるツールパターンを結合する
 *
 * @param previousLine 前の行
 * @param currentLine 現在の行
 * @returns 結合された行とツール検出結果
 */
export function combineToolPatterns(
  previousLine: string,
  currentLine: string
): { combinedLine: string; detection: ToolUsageDetection } {
  const combinedLine = previousLine + currentLine;
  const detection = parseToolUsage(combinedLine);

  return {
    combinedLine,
    detection,
  };
}

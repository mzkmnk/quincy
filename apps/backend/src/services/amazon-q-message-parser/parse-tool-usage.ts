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

  // ツール使用パターンの正規表現: 🛠️ Using tool: ツール名 (trusted部分も含めて)
  // ツール名は空白、括弧、または次の🛠️まで
  const toolPattern = /🛠️ Using tool: ([a-zA-Z0-9_-]+)(?:\s*\([^)]*\))?/g;

  const detectedTools: string[] = [];
  let cleanedLine = line;
  const matches = [...line.matchAll(toolPattern)];

  // 全てのマッチを処理
  for (const match of matches) {
    const toolName = match[1].trim();

    // ツール名が有効な場合のみ追加
    if (toolName.length > 0) {
      detectedTools.push(toolName);
    }

    // マッチした部分を行から除去（正確にマッチした部分のみ削除）
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
  // 不完全なパターンを検出: "🛠️ Using tool:" で始まるが完全でない

  // パターン1: "🛠️ Using tool:" で終わる（ツール名なし）
  if (line.trimEnd().endsWith('🛠️ Using tool:')) {
    return true;
  }

  // パターン2: ツール名が不完全（3文字未満）で行末にある
  const incompletePattern = /🛠️ Using tool:\s*([a-zA-Z0-9_-]*)$/;
  const match = line.match(incompletePattern);

  if (match) {
    const toolNamePart = match[1];
    return toolNamePart.length < 3;
  }

  return false;
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

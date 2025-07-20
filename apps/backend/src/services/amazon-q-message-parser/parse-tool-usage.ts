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

    // ツール名が有効な場合のみ追加（適切な長さの制限もチェック）
    if (toolName.length > 0 && toolName.length < 100) {
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

  // パターン2: ツール名が行末で終わり、通常のツール名として不自然
  const incompletePattern = /🛠️ Using tool:\s*([a-zA-Z0-9_-]*)$/;
  const match = line.match(incompletePattern);

  if (match) {
    const toolNamePart = match[1];
    // 一般的なツール名の最小長やありそうな不完全パターンをチェック
    // fs_re は fs_read の途中なので不完全
    // 長すぎるツール名（100文字以上）も不完全として扱う
    return (
      toolNamePart.length < 3 ||
      toolNamePart.length >= 100 ||
      toolNamePart.endsWith('_') ||
      toolNamePart === 'fs_re' ||
      toolNamePart === 'fs_rea'
    );
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

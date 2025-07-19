export function shouldSkipOutput(output: string): boolean {
  const trimmed = output.trim();

  // 空の出力
  if (!trimmed) {
    return true;
  }

  // Amazon Q CLIの初期化メッセージをスキップ
  const skipPatterns = [
    /^\s*$/, // 空白のみ
    /^\s*[.•●]\s*$/, // ドットやブレットのみ
    /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*$/, // スピナー文字のみ
    /^\s*\p{Cc}\s*$/u, // 制御文字のみ（Unicode対応）
  ];

  return skipPatterns.some(pattern => pattern.test(trimmed));
}

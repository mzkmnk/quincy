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
    /^[\x00-\x1F\x7F\s]*$/, // 制御文字のみ（改行文字含む）
    /^[\u2800-\u28FF\s]*$/, // Brailleパターンのみ
    /^[\u2500-\u257F\s]*$/, // Unicodeボックス描画文字のみ
    /^[\u23C0-\u23FF\s]*$/, // CJK統合漢字拡張（装飾文字）のみ
    /^[▁▂▃▄▅▆▇█░▒▓■□▪▫▬▭▮▯―\s]*$/, // プログレスバー文字のみ
    /^[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\s]*$/, // Unicodeスペース文字のみ
  ];

  return skipPatterns.some(pattern => pattern.test(trimmed));
}

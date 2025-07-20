export function classifyStderrMessage(message: string): 'info' | 'error' | 'skip' {
  const trimmed = message.trim();

  // 空のメッセージ
  if (!trimmed) {
    return 'skip';
  }

  // 完全にスキップすべきパターン
  const skipPatterns = [
    /^\s*$/, // 空白のみ
    /^[\x00-\x1F\x7F\s]*$/, // 制御文字のみ（改行文字含む）
    /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠿⠾⠽⠻⠺⠯⠟⠞⠜⠛⠚⠉⠈⠁]\s*$/, // スピナー文字のみ
    /^\s*\d+\s*\d*\s*$/, // 数字のみの断片
    /^\s*[[{]+\s*$/u, // 開いた括弧のみ
    /^\s*m[\x00-\x1F\x7F]*\s*$/u, // エスケープ文字の残骸
    /^[\u2800-\u28FF\s]*$/, // Brailleパターンのみ
    /^[\u2500-\u257F\s]*$/, // Unicodeボックス描画文字のみ
    /^[\u23C0-\u23FF\s]*$/, // CJK統合漢字拡張（装飾文字）のみ
    /^[▁▂▃▄▅▆▇█░▒▓■□▪▫▬▭▮▯―\s]*$/, // プログレスバー文字のみ
    /^[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\s]*$/, // Unicodeスペース文字のみ
  ];

  if (skipPatterns.some(pattern => pattern.test(trimmed))) {
    return 'skip';
  }

  // 情報メッセージのパターン
  const infoPatterns = [
    /welcome to amazon q/i, // Amazon Qへようこそ
    /✓.*loaded/i, // ローディング完了メッセージ
    /github loaded/i, // GitHubローディング
    /mcp servers? initialized/i, // MCPサーバー初期化
    /ctrl[\s-]?[cj]/i, // キーボードショートカット案内
    /press.*enter/i, // Enterキー指示
    /loading|initializing/i, // ローディング/初期化
    /starting|started/i, // 開始メッセージ
    /ready|connected/i, // 準備完了メッセージ
    /you are chatting with/i, // チャットモード案内
    /if you want to file an issue/i, // フィードバック案内
    /.*help.*commands?/i, // ヘルプ案内
    /ctrl.*new.*lines?/i, // ショートカット案内
    /fuzzy search/i, // 検索機能案内
    /^\/\w+/, // コマンド案内（/helpなど）
    /of \d+/, // プログレス表示（"1 of 2"など）
    /\d+\.\d+\s*s$/, // 時間表示（"0.26 s"など）
    /^thinking\.?\.?\.?$/i, // Thinkingメッセージ
  ];

  if (infoPatterns.some(pattern => pattern.test(trimmed))) {
    return 'info';
  }

  // 明確なエラーパターン
  const errorPatterns = [
    /error(?!.*loaded)/i, // Error（ただしloadedは除く）
    /failed/i, // Failed
    /exception/i, // Exception
    /cannot|can't/i, // Cannot/Can't
    /unable to/i, // Unable to
    /permission denied/i, // Permission denied
    /access denied/i, // Access denied
    /not found/i, // Not found
    /invalid/i, // Invalid
    /timeout/i, // Timeout
    /connection.*(?:refused|reset|lost)/i, // Connection issues
  ];

  if (errorPatterns.some(pattern => pattern.test(trimmed))) {
    return 'error';
  }

  // デフォルトでは情報メッセージとして扱う
  // Amazon Q CLIは多くの情報をstderrに出力するため
  return 'info';
}

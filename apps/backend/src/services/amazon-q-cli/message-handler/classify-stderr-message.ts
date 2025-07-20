export function classifyStderrMessage(message: string): 'info' | 'error' | 'skip' {
  const trimmed = message.trim();

  // 空のメッセージ
  if (!trimmed) {
    return 'skip';
  }

  // 完全にスキップすべきパターン
  const skipPatterns = [
    /^\s*$/, // 空白のみ
    /^\s*\p{Cc}\s*$/u, // 制御文字のみ（Unicode対応）
    /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠿⠾⠽⠻⠺⠯⠟⠞⠜⠛⠚⠉⠈⠁]\s*$/, // スピナー文字のみ
    /^\s*\d+\s*\d*\s*$/, // 数字のみの断片
    /^\s*[[{]+\s*$/u, // 開いた括弧のみ
    /^\s*m\p{Cc}*\s*$/u, // エスケープ文字の残骸
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

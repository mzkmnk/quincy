/**
 * CLI パス検証ユーティリティ
 */

/**
 * CLIパスが安全かどうかを検証
 * @param path 検証対象のCLIパス
 * @returns 安全な場合はtrue
 */
export function isValidCLIPath(path: string): boolean {
  // 空文字列や未定義をチェック
  if (!path || typeof path !== 'string') {
    return false;
  }

  // 許可されたパスパターンのみ実行を許可
  const allowedPatterns = [
    /^q$/, // PATH内の'q'コマンド
    /^\/usr\/local\/bin\/q$/, // 標準的なインストール場所
    /^\/opt\/homebrew\/bin\/q$/, // Apple Silicon Mac
    /^\/home\/[a-zA-Z0-9_-]+\/\.local\/bin\/q$/, // ユーザーローカル
    new RegExp(`^${process.env.HOME?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\.local/bin/q$`), // ホームディレクトリ
  ].filter(Boolean);

  const isAllowed = allowedPatterns.some(pattern => pattern.test(path));

  // 危険な文字列をチェック
  const dangerousChars = [
    ';',
    '&',
    '|',
    '`',
    '$',
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    '<',
    '>',
    '"',
    "'",
  ];
  const hasDangerousChars = dangerousChars.some(char => path.includes(char));

  if (hasDangerousChars) {
    return false;
  }

  return isAllowed;
}

/**
 * 標準的なCLI候補パスのリストを取得
 * @returns CLI候補パスの配列
 */
export function getCLICandidates(): string[] {
  return [
    'q',
    '/usr/local/bin/q',
    '/opt/homebrew/bin/q',
    process.env.HOME + '/.local/bin/q',
  ].filter(Boolean); // undefined要素を除外
}

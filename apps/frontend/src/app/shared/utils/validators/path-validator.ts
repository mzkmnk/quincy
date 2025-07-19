/**
 * プロジェクトパスの妥当性を検証する
 * @param path 検証するパス
 * @returns エラーメッセージ（エラーがない場合はnull）
 */
export function validatePath(path: string): string | null {
  // 型チェック：文字列以外の場合はエラー
  if (typeof path !== 'string') {
    return 'パスを入力してください';
  }

  const trimmedPath = path.trim();

  if (!trimmedPath) {
    return 'パスを入力してください';
  }

  if (trimmedPath.length < 2) {
    return '有効なパスを入力してください';
  }

  // 絶対パスチェック（Unix/Linux/Mac、Windows、ネットワークパス）
  const isUnixPath = trimmedPath.startsWith('/');
  const isWindowsPath = trimmedPath.match(/^[A-Za-z]:\\/);
  const isUNCPath = trimmedPath.startsWith('\\\\') || trimmedPath.startsWith('//');
  
  if (!isUnixPath && !isWindowsPath && !isUNCPath) {
    return '絶対パスを入力してください（例: /Users/username/project）';
  }

  // 危険な文字列チェック（連続するスラッシュ・バックスラッシュ）
  if (trimmedPath.includes('..') || 
      trimmedPath.includes('///') || 
      trimmedPath.includes('\\\\\\')) {
    return '無効な文字が含まれています';
  }

  return null;
}
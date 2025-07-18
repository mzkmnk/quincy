/**
 * プロジェクトパスの妥当性を検証する
 * @param path 検証するパス
 * @returns エラーメッセージ（エラーがない場合はnull）
 */
export function validatePath(path: string): string | null {
  const trimmedPath = path.trim();

  if (!trimmedPath) {
    return 'パスを入力してください';
  }

  if (trimmedPath.length < 2) {
    return '有効なパスを入力してください';
  }

  // 絶対パスチェック（Unix/Linux/Mac）
  if (!trimmedPath.startsWith('/') && !trimmedPath.match(/^[A-Za-z]:\\/)) {
    return '絶対パスを入力してください（例: /Users/username/project）';
  }

  // 危険な文字列チェック
  if (trimmedPath.includes('..') || trimmedPath.includes('//')) {
    return '無効な文字が含まれています';
  }

  return null;
}
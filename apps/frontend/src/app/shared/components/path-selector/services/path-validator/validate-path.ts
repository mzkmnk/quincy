import { validatePath as baseValidatePath } from '../../../../utils/validators';

/**
 * パスの検証を行う
 * @param path 検証するパス
 * @returns エラーメッセージ（null = エラーなし）
 */
export function validatePath(path: string): string | null {
  return baseValidatePath(path);
}

/**
 * パスが有効かどうかを判定する
 * @param path 検証するパス
 * @param pathError 現在のエラー状態
 * @returns パスが有効かどうか
 */
export function isValidPath(path: string, pathError: string | null): boolean {
  return path.trim().length > 0 && !pathError;
}

/**
 * プロジェクトを開始可能かどうかを判定する
 * @param path 検証するパス
 * @param pathError 現在のエラー状態
 * @param starting 開始中かどうか
 * @returns 開始可能かどうか
 */
export function canStartProject(
  path: string,
  pathError: string | null,
  starting: boolean
): boolean {
  return isValidPath(path, pathError) && !starting;
}

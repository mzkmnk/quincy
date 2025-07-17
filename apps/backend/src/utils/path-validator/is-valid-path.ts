/**
 * 基本的なパス検証ユーティリティ
 */

import { isAbsolute } from 'path';
import { getDangerousPaths } from './get-dangerous-paths';

/**
 * パスが基本的なバリデーションをパスするかチェック
 * @param path チェック対象のパス
 * @returns バリデーション結果
 */
export function isValidPath(path: string): { valid: boolean; error?: string } {
  // 基本的なバリデーション
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Project path is required and must be a string' };
  }

  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return { valid: false, error: 'Project path cannot be empty' };
  }

  // 絶対パスチェック
  if (!isAbsolute(trimmedPath)) {
    return { valid: false, error: 'Project path must be an absolute path' };
  }

  return { valid: true };
}

/**
 * パスが危険なシステムディレクトリかチェック
 * @param normalizedPath 正規化されたパス
 * @returns 危険な場合はtrue
 */
export function isDangerousPath(normalizedPath: string): boolean {
  const dangerousPaths = getDangerousPaths();
  return dangerousPaths.some(dangerous => 
    normalizedPath === dangerous || normalizedPath.startsWith(dangerous + '/')
  );
}
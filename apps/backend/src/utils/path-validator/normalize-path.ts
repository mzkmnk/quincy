/**
 * パス正規化ユーティリティ
 */

import { normalize, resolve } from 'path';

/**
 * パスを正規化する（../ などの相対パス要素を解決）
 * @param inputPath 正規化対象のパス
 * @returns 正規化されたパス
 */
export function normalizePath(inputPath: string): string {
  return normalize(resolve(inputPath));
}
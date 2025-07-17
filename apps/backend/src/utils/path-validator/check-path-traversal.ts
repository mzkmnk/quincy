/**
 * パストラバーサル攻撃チェックユーティリティ
 */

/**
 * パストラバーサル攻撃の可能性をチェックする
 * @param normalizedPath 正規化されたパス
 * @param originalPath 元のパス（正規化前）
 * @returns パストラバーサル攻撃の可能性がある場合はtrue
 */
export function checkPathTraversal(normalizedPath: string, originalPath: string): boolean {
  // '..' が含まれている場合は危険
  if (normalizedPath.includes('..')) {
    return true;
  }
  
  // 正規化後と元のパス（重複スラッシュを除去）が異なる場合は危険
  const cleanedOriginalPath = originalPath.replace(/\/+/g, '/');
  if (normalizedPath !== cleanedOriginalPath) {
    return true;
  }
  
  return false;
}
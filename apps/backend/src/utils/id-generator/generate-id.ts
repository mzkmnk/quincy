/**
 * 基本的なID生成ユーティリティ
 * プレフィックス + タイムスタンプ + ランダム文字列の形式でユニークなIDを生成
 */

/**
 * ランダム文字列を生成する
 * @param length 生成する文字列の長さ（デフォルト: 9）
 * @returns ランダムな英数字文字列
 */
export function generateRandomString(length: number = 9): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * プレフィックス付きのユニークなIDを生成する
 * @param prefix IDのプレフィックス
 * @param randomLength ランダム部分の長さ（デフォルト: 9）
 * @returns ユニークなID文字列
 */
export function generateId(prefix: string, randomLength: number = 9): string {
  const timestamp = Date.now();
  const randomPart = generateRandomString(randomLength);
  return `${prefix}_${timestamp}_${randomPart}`;
}
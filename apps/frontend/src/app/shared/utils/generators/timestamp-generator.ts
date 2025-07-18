/**
 * 現在のタイムスタンプを生成する
 * @returns 現在のタイムスタンプ
 */
export function generateTimestamp(): number {
  return Date.now();
}

/**
 * 現在の日時を生成する
 * @returns 現在の日時（Dateオブジェクト）
 */
export function generateCurrentDate(): Date {
  return new Date();
}
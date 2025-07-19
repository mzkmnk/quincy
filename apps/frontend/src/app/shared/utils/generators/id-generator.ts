/**
 * ユニークなIDを生成する
 * @param prefix IDのプレフィックス
 * @returns 生成されたID
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

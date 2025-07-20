/**
 * フルサイズのボタンを表示するかどうかを判定する
 */
export function shouldShowFullButton(collapsed: boolean): boolean {
  return !collapsed;
}

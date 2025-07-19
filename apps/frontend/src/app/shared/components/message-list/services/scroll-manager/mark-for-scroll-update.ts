/**
 * スクロール更新をマークする
 * @param scrollToBottomRequest スクロール要求signal
 */
export function markForScrollUpdate(scrollToBottomRequest: {
  set: (value: boolean) => void;
}): void {
  scrollToBottomRequest.set(true);
}

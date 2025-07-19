import { ElementRef } from '@angular/core';

/**
 * メッセージコンテナーをスクロールして最下部に移動する
 * @param messageContainer メッセージコンテナーのElementRef
 */
export function scrollToBottom(messageContainer: ElementRef<HTMLDivElement>): void {
  try {
    if (messageContainer) {
      const element = messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  } catch {
    // スクロールエラーを無視
  }
}
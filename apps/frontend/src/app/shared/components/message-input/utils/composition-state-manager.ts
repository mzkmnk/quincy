import { ElementRef } from '@angular/core';

/**
 * コンポジション開始を処理する
 * @param isComposingSignal コンポジション状態のsignal
 */
export function handleCompositionStart(
  isComposingSignal: { set: (value: boolean) => void }
): void {
  isComposingSignal.set(true);
}

/**
 * コンポジション終了を処理する
 * @param isComposingSignal コンポジション状態のsignal
 */
export function handleCompositionEnd(
  isComposingSignal: { set: (value: boolean) => void }
): void {
  isComposingSignal.set(false);
}

/**
 * テキストエリアの高さを自動調整する
 * @param messageTextarea テキストエリアのElementRef
 */
export function adjustTextareaHeight(messageTextarea: ElementRef<HTMLTextAreaElement>): void {
  if (messageTextarea) {
    const textarea = messageTextarea.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
  }
}

/**
 * キーボードイベントを処理する
 * @param event キーボードイベント
 * @param isComposing コンポジション中かどうか
 * @param sendMessage メッセージ送信関数
 * @param adjustHeight 高さ調整関数
 */
export function handleKeyDown(
  event: KeyboardEvent,
  isComposing: boolean,
  sendMessage: () => void,
  adjustHeight: () => void
): void {
  if (event.key === 'Enter' && !event.shiftKey && !isComposing && !event.isComposing) {
    event.preventDefault();
    sendMessage();
  } else if (event.key === 'Enter' && event.shiftKey) {
    // Allow new line
    setTimeout(() => adjustHeight(), 0);
  }
}
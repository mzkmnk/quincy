import { ElementRef } from '@angular/core';
import type { MessageService } from 'primeng/api';

/**
 * テキストエリアの高さを自動調整する
 * @param pathTextarea テキストエリアのElementRef
 */
export function adjustTextareaHeight(pathTextarea: ElementRef<HTMLTextAreaElement>): void {
  if (pathTextarea) {
    const textarea = pathTextarea.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
  }
}

/**
 * キーボードイベントを処理する
 * @param event キーボードイベント
 * @param startProject プロジェクト開始関数
 * @param adjustTextareaHeight テキストエリア調整関数
 */
export function handleKeyDown(
  event: KeyboardEvent,
  startProject: () => void,
  adjustTextareaHeight: () => void
): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    startProject();
  } else if (event.key === 'Enter' && event.shiftKey) {
    // Allow new line
    setTimeout(() => adjustTextareaHeight(), 0);
  }
}

/**
 * 履歴オプションを切り替える
 * @param resumeSession 現在の履歴オプション状態
 * @param resumeSignal 履歴オプションのsignal
 */
export function toggleResumeOption(
  resumeSession: boolean,
  resumeSignal: { set: (value: boolean) => void }
): void {
  resumeSignal.set(!resumeSession);
}

/**
 * フォルダ選択のメッセージを表示する
 * @param messageService メッセージサービス
 */
export function selectFolder(messageService: MessageService): void {
  // ブラウザ環境では直接フォルダ選択はできないため、
  // ユーザーに手動入力を促すメッセージを表示
  messageService.add({
    severity: 'info',
    summary: '情報',
    detail: 'プロジェクトフォルダの絶対パスを入力してください',
    life: 3000,
  });
}

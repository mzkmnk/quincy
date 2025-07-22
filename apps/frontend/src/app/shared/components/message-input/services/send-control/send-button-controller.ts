/**
 * 送信ボタンの制御ロジック
 * 統合チャット状態に基づいて送信可能性を判定
 */

import { computed } from '@angular/core';

import { chatStateManager } from '../../../../../core/store/chat/actions';

/**
 * 送信ボタンの制御状態を管理
 */
export interface SendControlState {
  canSend: boolean;
  isLoading: boolean;
  buttonText: string;
  disabledReason?: string;
}

/**
 * 送信制御状態のcomputed値
 */
export const sendControlState = computed<SendControlState>(() => {
  const chatState = chatStateManager.state();

  switch (chatState.status) {
    case 'idle':
      return {
        canSend: true,
        isLoading: false,
        buttonText: '送信',
      };

    case 'prompt-ready':
      return {
        canSend: true,
        isLoading: false,
        buttonText: '送信',
      };

    case 'thinking':
      return {
        canSend: false,
        isLoading: true,
        buttonText: '考え中...',
        disabledReason: 'Amazon Q CLIが考え中です',
      };

    case 'responding':
      return {
        canSend: false,
        isLoading: true,
        buttonText: '応答中...',
        disabledReason: 'Amazon Q CLIが応答中です',
      };

    case 'error':
      return {
        canSend: false,
        isLoading: false,
        buttonText: '送信',
        disabledReason: chatState.errorMessage || 'エラーが発生しています',
      };

    default:
      return {
        canSend: false,
        isLoading: false,
        buttonText: '送信',
        disabledReason: '不明な状態です',
      };
  }
});

/**
 * メッセージが送信可能かどうかを判定
 */
export function canSendMessage(messageContent: string): boolean {
  const trimmedContent = messageContent.trim();
  const controlState = sendControlState();

  return controlState.canSend && trimmedContent.length > 0;
}

/**
 * 送信制御の理由を取得
 */
export function getSendDisabledReason(messageContent: string): string | undefined {
  const trimmedContent = messageContent.trim();
  const controlState = sendControlState();

  if (trimmedContent.length === 0) {
    return 'メッセージを入力してください';
  }

  return controlState.disabledReason;
}

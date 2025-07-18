import { AppStore } from '../../../../../core/store/app.state';

/**
 * タイピングインジケーターを削除する
 * @param appStore アプリストア
 */
export function removeTypingIndicator(appStore: AppStore): void {
  appStore.removeChatMessage('typing');
}
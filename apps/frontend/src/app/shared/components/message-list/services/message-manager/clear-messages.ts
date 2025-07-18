import { AppStore } from '../../../../../core/store/app.state';

/**
 * メッセージをクリアする
 * @param appStore アプリストア
 */
export function clearMessages(appStore: AppStore): void {
  appStore.clearChatMessages();
}
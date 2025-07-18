import { amazonQHistoryState, DisplayMessage } from '../amazon-q-history.state';

/**
 * 詳細履歴メッセージを設定する
 * @param messages 設定する詳細履歴メッセージの配列
 */
export function setDetailedHistoryMessages(messages: DisplayMessage[]): void {
  amazonQHistoryState.update(state => ({
    ...state,
    detailedHistoryMessages: messages
  }));
}
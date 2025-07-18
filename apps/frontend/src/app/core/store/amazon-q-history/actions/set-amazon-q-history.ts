import type { ConversationMetadata } from '@quincy/shared';
import { amazonQHistoryState } from '../amazon-q-history.state';

/**
 * Amazon Q履歴を設定する
 * @param history 設定するAmazon Q履歴の配列
 */
export function setAmazonQHistory(history: ConversationMetadata[]): void {
  amazonQHistoryState.update(state => ({
    ...state,
    amazonQHistory: history,
    qHistoryLoading: false
  }));
}
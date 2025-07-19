import type { ConversationMetadata } from '@quincy/shared';

import { amazonQHistoryState } from '../amazon-q-history.state';

/**
 * Amazon Q履歴アイテムを追加する
 * @param item 追加するAmazon Q履歴アイテム
 */
export function addQHistoryItem(item: ConversationMetadata): void {
  amazonQHistoryState.update(state => ({
    ...state,
    amazonQHistory: [...state.amazonQHistory, item]
  }));
}
import type { AmazonQConversation } from '@quincy/shared';
import { amazonQHistoryState } from '../amazon-q-history.state';

/**
 * 現在のAmazon Q会話を設定する
 * @param conversation 設定するAmazon Q会話（nullの場合は選択解除）
 */
export function setCurrentQConversation(conversation: AmazonQConversation | null): void {
  amazonQHistoryState.update(state => ({
    ...state,
    currentQConversation: conversation
  }));
}
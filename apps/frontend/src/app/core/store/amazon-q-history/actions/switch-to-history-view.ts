import type { AmazonQConversation } from '@quincy/shared';

import { amazonQHistoryState } from '../amazon-q-history.state';

/**
 * 履歴表示に切り替える
 * @param conversation 表示する会話
 */
export function switchToHistoryView(conversation: AmazonQConversation): void {
  amazonQHistoryState.update(state => ({
    ...state,
    currentQConversation: conversation,
  }));
}

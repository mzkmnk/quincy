/**
 * SQLite3データベース変更ハンドラー（チャット内容付き）
 */

import { promises as fs } from 'fs';

import { getLatestConversationEntry } from '../get-latest-conversation-entry';
import { extractLastChatMessage } from '../extract-last-chat-message';
import type { WebSocketEmitFunction } from '../../../types/database-watcher';
import type { LastChatMessage } from '../extract-last-chat-message';

export interface DatabaseChangeEventWithChat {
  filePath: string;
  timestamp: Date;
  changeType: 'add' | 'modified' | 'deleted';
  latestChat: LastChatMessage | null;
}

export async function handleDatabaseChangeWithChat(
  filePath: string,
  emitFn: WebSocketEmitFunction
): Promise<boolean> {
  try {
    // ファイルの存在確認
    await fs.access(filePath);

    let latestChat: LastChatMessage | null = null;

    try {
      // 最新の会話エントリを取得
      const latestConversation = await getLatestConversationEntry(filePath);

      if (latestConversation) {
        // 最後のチャットメッセージを抽出
        latestChat = extractLastChatMessage(latestConversation);
      }
    } catch (error) {
      // チャット取得エラーは無視してイベントは送信する
      console.error('Error extracting latest chat:', error);
      latestChat = null;
    }

    // WebSocketイベントデータを作成
    const eventData: DatabaseChangeEventWithChat = {
      filePath,
      timestamp: new Date(),
      changeType: 'modified',
      latestChat,
    };

    // WebSocketで通知
    emitFn('database-changed-with-chat', eventData);

    return true;
  } catch (error) {
    console.error('Error handling database change:', error);
    return false;
  }
}

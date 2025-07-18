/**
 * HistoryEntry配列の検証
 */

import { isToolUseResponse, isResponse } from '../amazon-q-history-types';

export function validateHistoryEntries(entries: unknown[]): boolean {
  // 各エントリが[入力, 応答]の形式かチェック
  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length !== 2) {
      return false;
    }
    
    const [inputMessage, responseMessage] = entry;
    
    // 入力メッセージの基本構造チェック
    if (!inputMessage || typeof inputMessage !== 'object' || !inputMessage.content) {
      return false;
    }
    
    // 応答メッセージの基本構造チェック
    if (!responseMessage || typeof responseMessage !== 'object') {
      return false;
    }
    
    // 応答メッセージにToolUseまたはResponseが含まれているかチェック
    if (!isToolUseResponse(responseMessage) && !isResponse(responseMessage)) {
      return false;
    }
  }
  
  return true;
}
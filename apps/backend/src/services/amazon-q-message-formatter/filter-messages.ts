/**
 * 表示設定に基づいてメッセージをフィルタリング
 */

import type { DisplayMessage } from '../amazon-q-history-types';

export function filterMessages(
  messages: DisplayMessage[], 
  options: {
    showThinking?: boolean;
    showEnvironmentInfo?: boolean;
    showToolsUsed?: boolean;
  }
): DisplayMessage[] {
  const { showThinking = true, showEnvironmentInfo = true, showToolsUsed = true } = options;
  
  return messages.filter(message => {
    if (message.type === 'thinking' && !showThinking) {
      return false;
    }
    
    if (message.metadata?.environmentInfo && !showEnvironmentInfo) {
      // 環境情報を削除
      delete message.metadata.environmentInfo;
    }
    
    if (message.metadata?.toolsUsed && !showToolsUsed) {
      // ツール情報を削除
      delete message.metadata.toolsUsed;
    }
    
    return true;
  });
}
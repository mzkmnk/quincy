/**
 * チャットストアのアクション
 */

import type { ChatMessage as CommonChatMessage, MessageId } from '../../types/common.types';

import { chatState, type ChatMessage as ExistingChatMessage } from './chat.state';
import { chatStateManager } from './chat-state-manager';

/**
 * 既存のChatMessageと新しいChatMessageの型統合
 */
function convertToChatMessage(msg: CommonChatMessage | ExistingChatMessage): CommonChatMessage {
  if ('role' in msg) {
    // 新しいChatMessage形式の場合
    return msg;
  } else {
    // 既存のChatMessage形式の場合は変換
    return {
      id: msg.id,
      content: msg.content,
      role: msg.sender === 'user' ? 'user' : 'assistant',
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.getTime() : 0,
      tools: msg.tools,
      hasToolContent: msg.hasToolContent,
    };
  }
}

/**
 * 既存の形式に変換
 */
function convertToExistingChatMessage(
  msg: CommonChatMessage | ExistingChatMessage
): ExistingChatMessage {
  if ('role' in msg) {
    // 新しい形式から既存の形式に変換
    return {
      id: msg.id,
      content: msg.content,
      sender: msg.role === 'user' ? 'user' : 'assistant',
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      tools: msg.tools,
      hasToolContent: msg.hasToolContent,
    };
  } else {
    // 既存の形式の場合はそのまま
    return msg;
  }
}

/**
 * チャットストアインターフェース
 */
export const chatStore = {
  /**
   * 全メッセージを取得
   */
  getAllMessages(): CommonChatMessage[] {
    const messages = chatState().chatMessages;
    return messages.map(convertToChatMessage);
  },

  /**
   * メッセージIDでメッセージを取得
   */
  getMessageById(messageId: MessageId): CommonChatMessage | null {
    const messages = chatState().chatMessages;
    const message = messages.find(msg => msg.id === messageId);
    return message ? convertToChatMessage(message) : null;
  },

  /**
   * メッセージを追加
   */
  addMessage(message: CommonChatMessage): void {
    const existingMessage = convertToExistingChatMessage(message);
    chatState.update(state => ({
      ...state,
      chatMessages: [...state.chatMessages, existingMessage],
    }));
  },

  /**
   * メッセージを更新
   */
  updateMessage(messageId: MessageId, updates: Partial<CommonChatMessage>): void {
    chatState.update(state => {
      const messages = state.chatMessages.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: updates.content ?? msg.content,
            tools: updates.tools ?? msg.tools,
            hasToolContent: updates.hasToolContent ?? msg.hasToolContent,
            timestamp: updates.timestamp ? new Date(updates.timestamp) : msg.timestamp,
          };
        }
        return msg;
      });

      return { ...state, chatMessages: messages };
    });
  },

  /**
   * メッセージを削除
   */
  removeMessage(messageId: MessageId): void {
    chatState.update(state => ({
      ...state,
      chatMessages: state.chatMessages.filter(msg => msg.id !== messageId),
    }));
  },

  /**
   * セッション別メッセージを取得
   */
  getMessagesBySession(sessionId: string): CommonChatMessage[] {
    const messages = chatState().chatMessages.filter(msg => msg.sessionId === sessionId);
    return messages.map(convertToChatMessage);
  },

  /**
   * 全メッセージをクリア
   */
  clearMessages(): void {
    chatState.update(state => ({
      ...state,
      chatMessages: [],
    }));
  },

  /**
   * ストリーミング中のメッセージを取得
   */
  getStreamingMessages(): CommonChatMessage[] {
    const messages = this.getAllMessages();
    return messages.filter(msg => msg.isStreaming);
  },
};

// 既存のAPIと互換性のあるアクション関数を追加
export function addChatMessage(message: ExistingChatMessage): void {
  chatState.update(state => ({
    ...state,
    chatMessages: [...state.chatMessages, message],
  }));
}

export function updateChatMessage(
  messageId: MessageId,
  updates: Partial<ExistingChatMessage>
): void {
  chatState.update(state => ({
    ...state,
    chatMessages: state.chatMessages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
  }));
}

export function removeChatMessage(messageId: MessageId): void {
  chatState.update(state => ({
    ...state,
    chatMessages: state.chatMessages.filter(msg => msg.id !== messageId),
  }));
}

export function clearChatMessages(): void {
  chatState.update(state => ({
    ...state,
    chatMessages: [],
  }));
}

export function setChatMessages(messages: ExistingChatMessage[]): void {
  chatState.update(state => ({
    ...state,
    chatMessages: messages,
  }));
}

// 統合チャット状態マネージャーをエクスポート
export { chatStateManager };

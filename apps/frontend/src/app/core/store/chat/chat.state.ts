import { signal, computed } from '@angular/core';

import type { MessageId, SessionId, Timestamp } from '../../types/common.types';
import type { AmazonQMessageSender } from '../../types/amazon-q.types';
import type { ToolList } from '../../types/tool-display.types';

export interface ChatMessage {
  id: MessageId;
  content: string;
  sender: AmazonQMessageSender;
  timestamp: Timestamp;
  isTyping?: boolean;
  sessionId?: SessionId;
  tools?: ToolList;
  hasToolContent?: boolean;
}

export interface ChatNotification {
  id: string;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
  turnId: string;
  changeInfo: {
    filePath: string;
    changeType: 'add' | 'modified' | 'deleted';
    timestamp: Date;
  };
  isRead: boolean;
}

export interface ChatState {
  chatMessages: ChatMessage[];
  latestChatNotification: ChatNotification | null;
  databaseChangeInfo: {
    filePath: string | null;
    changeType: 'add' | 'modified' | 'deleted' | null;
    lastChange: Date | null;
  };
}

export const chatInitialState: ChatState = {
  chatMessages: [],
  latestChatNotification: null,
  databaseChangeInfo: {
    filePath: null,
    changeType: null,
    lastChange: null,
  },
};

export const chatState = signal<ChatState>(chatInitialState);

// Computed selectors
export const chatMessages = computed(() => chatState().chatMessages);
export const latestChatNotification = computed(() => chatState().latestChatNotification);
export const databaseChangeInfo = computed(() => chatState().databaseChangeInfo);

// Derived selectors
export const hasChatMessages = computed(() => chatMessages().length > 0);
export const hasUnreadNotification = computed(() => latestChatNotification()?.isRead === false);
export const hasRecentDatabaseChange = computed(() => databaseChangeInfo().lastChange !== null);

// Session-specific selectors
export const getCurrentSessionMessages = (sessionId: string) =>
  computed(() => chatMessages().filter(m => m.sessionId === sessionId));

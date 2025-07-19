import { signal, computed } from '@angular/core';

import type { MessageId, SessionId, Timestamp } from '../../types/common.types';
import type { AmazonQMessageSender } from '../../types/amazon-q.types';

export interface ChatMessage {
  id: MessageId;
  content: string;
  sender: AmazonQMessageSender;
  timestamp: Timestamp;
  isTyping?: boolean;
  sessionId?: SessionId;
}

export interface ChatState {
  chatMessages: ChatMessage[];
}

export const chatInitialState: ChatState = {
  chatMessages: [],
};

export const chatState = signal<ChatState>(chatInitialState);

// Computed selectors
export const chatMessages = computed(() => chatState().chatMessages);

// Derived selectors
export const hasChatMessages = computed(() => chatMessages().length > 0);

// Session-specific selectors
export const getCurrentSessionMessages = (sessionId: string) =>
  computed(() => chatMessages().filter(m => m.sessionId === sessionId));

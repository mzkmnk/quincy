import { signal, computed } from '@angular/core';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
  sessionId?: string;
}

export interface ChatState {
  chatMessages: ChatMessage[];
}

export const chatInitialState: ChatState = {
  chatMessages: []
};

export const chatState = signal<ChatState>(chatInitialState);

// Computed selectors
export const chatMessages = computed(() => chatState().chatMessages);

// Derived selectors
export const hasChatMessages = computed(() => chatMessages().length > 0);

// Session-specific selectors
export const getCurrentSessionMessages = (sessionId: string) => 
  computed(() => chatMessages().filter(m => m.sessionId === sessionId));
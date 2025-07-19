import { signal, computed } from '@angular/core';
import type { ConversationMetadata, AmazonQConversation } from '@quincy/shared';

export interface DisplayMessage {
  id: string;
  type: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp?: Date;
  metadata?: {
    environmentInfo?: {
      operating_system: string;
      current_working_directory: string;
      environment_variables: string[];
    };
    toolsUsed?: {
      id: string;
      name: string;
      orig_name: string;
      args: Record<string, string | number | boolean>;
      orig_args: Record<string, string | number | boolean>;
    }[];
    messageId?: string;
  };
}

export interface AmazonQHistoryState {
  amazonQHistory: ConversationMetadata[];
  currentQConversation: AmazonQConversation | null;
  detailedHistoryMessages: DisplayMessage[];
  historyStats: {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  } | null;
  qHistoryLoading: boolean;
}

export const amazonQHistoryInitialState: AmazonQHistoryState = {
  amazonQHistory: [],
  currentQConversation: null,
  detailedHistoryMessages: [],
  historyStats: null,
  qHistoryLoading: false,
};

export const amazonQHistoryState = signal<AmazonQHistoryState>(amazonQHistoryInitialState);

// Computed selectors
export const amazonQHistory = computed(() => amazonQHistoryState().amazonQHistory);
export const currentQConversation = computed(() => amazonQHistoryState().currentQConversation);
export const detailedHistoryMessages = computed(
  () => amazonQHistoryState().detailedHistoryMessages
);
export const historyStats = computed(() => amazonQHistoryState().historyStats);
export const qHistoryLoading = computed(() => amazonQHistoryState().qHistoryLoading);

// Derived selectors
export const hasAmazonQHistory = computed(() => amazonQHistory().length > 0);
export const isQConversationSelected = computed(() => currentQConversation() !== null);

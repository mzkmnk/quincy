import type {
  AmazonQConversation,
  ConversationMetadata,
  QSessionStartedEvent,
} from '@quincy/shared';

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export interface ChatListeners {
  onResponse: (data: { sessionId: string; data: string; type: string }) => void;
  onError: (data: { sessionId: string; error: string; code: string }) => void;
  onInfo: (data: { sessionId: string; message: string; type?: string }) => void;
  onComplete: (data: { sessionId: string; exitCode: number }) => void;
}

export interface HistoryListeners {
  onHistoryData: (data: {
    projectPath: string;
    conversation: AmazonQConversation | null;
    message?: string;
  }) => void;
  onHistoryList: (data: { projects: ConversationMetadata[]; count: number }) => void;
}

export interface ProjectSessionListeners {
  onSessionStarted: (data: QSessionStartedEvent) => void;
}

export interface ListenerFlags {
  chatListenersSetup: boolean;
  historyListenersSetup: boolean;
  projectSessionListenersSetup: boolean;
  conversationListenersSetup: boolean;
}

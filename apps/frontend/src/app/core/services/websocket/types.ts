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
  onHistoryData: (data: { projectPath: string; conversation: any; message?: string }) => void;
  onHistoryList: (data: { projects: any[]; count: number }) => void;
}

export interface ProjectSessionListeners {
  onSessionStarted: (data: any) => void;
}

export interface ListenerFlags {
  chatListenersSetup: boolean;
  historyListenersSetup: boolean;
  projectSessionListenersSetup: boolean;
}
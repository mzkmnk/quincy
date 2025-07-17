import { signal, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import type { Project, Session, ConversationMetadata, AmazonQConversation, QSessionStartedEvent } from '@quincy/shared';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
  sessionId?: string;
}

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

export interface AppState {
  projects: Project[];
  currentProject: Project | null;
  sessions: Session[];
  currentSession: Session | null;
  amazonQHistory: ConversationMetadata[];
  currentQConversation: AmazonQConversation | null;
  currentQSession: QSessionStartedEvent | null;
  detailedHistoryMessages: DisplayMessage[];
  historyStats: {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  } | null;
  chatMessages: ChatMessage[];
  qHistoryLoading: boolean;
  sessionStarting: boolean;
  sessionError: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  projects: [],
  currentProject: null,
  sessions: [],
  currentSession: null,
  amazonQHistory: [],
  currentQConversation: null,
  currentQSession: null,
  detailedHistoryMessages: [],
  historyStats: null,
  chatMessages: [],
  qHistoryLoading: false,
  sessionStarting: false,
  sessionError: null,
  loading: false,
  error: null
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ projects, currentProject, sessions, currentSession, amazonQHistory, currentQConversation, currentQSession, detailedHistoryMessages, historyStats, chatMessages, qHistoryLoading, sessionStarting, sessionError }) => ({
    hasProjects: computed(() => projects().length > 0),
    hasSessions: computed(() => sessions().length > 0),
    hasAmazonQHistory: computed(() => amazonQHistory().length > 0),
    currentProjectSessions: computed(() => {
      const projectId = currentProject()?.id;
      return projectId ? sessions().filter(s => s.projectId === projectId) : [];
    }),
    currentProjectQHistory: computed(() => {
      const projectPath = currentProject()?.path;
      return projectPath ? amazonQHistory().filter(h => h.projectPath === projectPath) : [];
    }),
    isProjectSelected: computed(() => currentProject() !== null),
    isSessionSelected: computed(() => currentSession() !== null),
    isQConversationSelected: computed(() => currentQConversation() !== null),
    isQSessionActive: computed(() => currentQSession() !== null),
    currentSessionMessages: computed(() => {
      const sessionId = currentQSession()?.sessionId;
      return sessionId ? chatMessages().filter(m => m.sessionId === sessionId) : [];
    }),
    hasChatMessages: computed(() => chatMessages().length > 0),
  })),
  withMethods((store) => ({
    setProjects: (projects: Project[]) => {
      patchState(store, { projects, loading: false, error: null });
    },
    setCurrentProject: (project: Project | null) => {
      patchState(store, { currentProject: project });
    },
    setSessions: (sessions: Session[]) => {
      patchState(store, { sessions, loading: false, error: null });
    },
    setCurrentSession: (session: Session | null) => {
      patchState(store, { currentSession: session });
    },
    setLoading: (loading: boolean) => {
      patchState(store, { loading });
    },
    setError: (error: string | null) => {
      patchState(store, { error, loading: false });
    },
    addProject: (project: Project) => {
      patchState(store, { 
        projects: [...store.projects(), project],
        error: null 
      });
    },
    updateProject: (updatedProject: Project) => {
      patchState(store, {
        projects: store.projects().map(p => 
          p.id === updatedProject.id ? updatedProject : p
        ),
        currentProject: store.currentProject()?.id === updatedProject.id 
          ? updatedProject 
          : store.currentProject(),
        error: null
      });
    },
    removeProject: (projectId: string) => {
      patchState(store, {
        projects: store.projects().filter(p => p.id !== projectId),
        currentProject: store.currentProject()?.id === projectId 
          ? null 
          : store.currentProject(),
        error: null
      });
    },
    addSession: (session: Session) => {
      patchState(store, { 
        sessions: [...store.sessions(), session],
        error: null 
      });
    },
    setAmazonQHistory: (amazonQHistory: ConversationMetadata[]) => {
      patchState(store, { amazonQHistory, qHistoryLoading: false, error: null });
    },
    setCurrentQConversation: (currentQConversation: AmazonQConversation | null) => {
      patchState(store, { currentQConversation });
    },
    setQHistoryLoading: (qHistoryLoading: boolean) => {
      patchState(store, { qHistoryLoading });
    },
    addQHistoryItem: (item: ConversationMetadata) => {
      patchState(store, {
        amazonQHistory: [...store.amazonQHistory(), item],
        error: null
      });
    },
    clearError: () => {
      patchState(store, { error: null });
    },
    setCurrentQSession: (currentQSession: QSessionStartedEvent | null) => {
      // 新しいセッション開始時は詳細履歴をクリア
      patchState(store, { 
        currentQSession,
        detailedHistoryMessages: currentQSession ? [] : store.detailedHistoryMessages()
      });
    },
    setSessionStarting: (sessionStarting: boolean) => {
      patchState(store, { sessionStarting });
    },
    setSessionError: (sessionError: string | null) => {
      patchState(store, { sessionError, sessionStarting: false });
    },
    addChatMessage: (message: ChatMessage) => {
      patchState(store, {
        chatMessages: [...store.chatMessages(), message]
      });
    },
    updateChatMessage: (messageId: string, updates: Partial<ChatMessage>) => {
      patchState(store, {
        chatMessages: store.chatMessages().map(m => 
          m.id === messageId ? { ...m, ...updates } : m
        )
      });
    },
    removeChatMessage: (messageId: string) => {
      patchState(store, {
        chatMessages: store.chatMessages().filter(m => m.id !== messageId)
      });
    },
    clearChatMessages: () => {
      patchState(store, { chatMessages: [] });
    },
    setChatMessages: (chatMessages: ChatMessage[]) => {
      patchState(store, { chatMessages });
    },
    
    // セッション/会話切り替え用のメソッド（historyデータ専用）
    switchToHistoryView: (conversation: AmazonQConversation) => {
      patchState(store, { 
        currentQConversation: conversation,
        currentQSession: null,  // アクティブセッションをクリア
        chatMessages: [],  // historyデータは別の仕組みで表示
        sessionStarting: false,
        sessionError: null
      });
    },
    
    switchToActiveSession: (session: QSessionStartedEvent) => {
      patchState(store, { 
        currentQSession: session,
        currentQConversation: null,  // 履歴表示をクリア
        sessionStarting: false,
        sessionError: null
      });
    },
    
    clearCurrentView: () => {
      patchState(store, { 
        currentQSession: null,
        currentQConversation: null,
        sessionStarting: false,
        sessionError: null
      });
    },
    
    // 詳細履歴データを設定
    setDetailedHistoryMessages: (messages: DisplayMessage[]) => {
      patchState(store, { detailedHistoryMessages: messages });
    },
    
    // 履歴統計情報を設定
    setHistoryStats: (stats: {
      totalEntries: number;
      totalTurns: number;
      averageToolUsesPerTurn: number;
      totalToolUses: number;
    } | null) => {
      patchState(store, { historyStats: stats });
    },
    
    // 詳細履歴表示に切り替え
    switchToDetailedHistoryView: (messages: DisplayMessage[], stats: {
      totalEntries: number;
      totalTurns: number;
      averageToolUsesPerTurn: number;
      totalToolUses: number;
    } | null) => {
      patchState(store, { 
        detailedHistoryMessages: messages,
        historyStats: stats,
        currentQSession: null,
        sessionStarting: false,
        sessionError: null
      });
    }
  }))
);
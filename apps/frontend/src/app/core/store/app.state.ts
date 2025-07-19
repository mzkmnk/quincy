import { signal, computed, Injectable } from '@angular/core';
import type {
  Project,
  Session,
  ConversationMetadata,
  AmazonQConversation,
  QSessionStartedEvent,
} from '@quincy/shared';

import type { BaseUIState } from '../../shared/types/ui.types';

import { projects, currentProject, hasProjects, isProjectSelected } from './project/project.state';
import {
  sessions,
  currentSession,
  currentQSession,
  sessionStarting,
  sessionError,
  hasSessions,
  isSessionSelected,
  isQSessionActive,
} from './session/session.state';
import {
  amazonQHistory,
  currentQConversation,
  detailedHistoryMessages,
  historyStats,
  qHistoryLoading,
  hasAmazonQHistory,
  isQConversationSelected,
} from './amazon-q-history/amazon-q-history.state';
import { chatMessages, hasChatMessages } from './chat/chat.state';
import * as ProjectActions from './project/actions';
import * as SessionActions from './session/actions';
import * as AmazonQHistoryActions from './amazon-q-history/actions';
import * as ChatActions from './chat/actions';
import type { ChatMessage } from './chat/chat.state';
import type { DisplayMessage } from './amazon-q-history/amazon-q-history.state';

// UI状態
type UIState = BaseUIState;

const uiState = signal<UIState>({
  loading: false,
  error: null,
});

@Injectable({
  providedIn: 'root',
})
export class AppStore {
  // === State Getters ===
  // プロジェクト関連
  projects = projects;
  currentProject = currentProject;
  hasProjects = hasProjects;
  isProjectSelected = isProjectSelected;

  // セッション関連
  sessions = sessions;
  currentSession = currentSession;
  currentQSession = currentQSession;
  sessionStarting = sessionStarting;
  sessionError = sessionError;
  hasSessions = hasSessions;
  isSessionSelected = isSessionSelected;
  isQSessionActive = isQSessionActive;

  // Amazon Q履歴関連
  amazonQHistory = amazonQHistory;
  currentQConversation = currentQConversation;
  detailedHistoryMessages = detailedHistoryMessages;
  historyStats = historyStats;
  qHistoryLoading = qHistoryLoading;
  hasAmazonQHistory = hasAmazonQHistory;
  isQConversationSelected = isQConversationSelected;

  // チャット関連
  chatMessages = chatMessages;
  hasChatMessages = hasChatMessages;

  // UI関連
  loading = computed(() => uiState().loading);
  error = computed(() => uiState().error);

  // === Computed Selectors ===
  // プロジェクト固有のセッション
  currentProjectSessions = computed(() => {
    const projectId = this.currentProject()?.id;
    return projectId ? this.sessions().filter(s => s.projectId === projectId) : [];
  });

  // プロジェクト固有のAmazon Q履歴
  currentProjectQHistory = computed(() => {
    const projectPath = this.currentProject()?.path;
    return projectPath ? this.amazonQHistory().filter(h => h.projectPath === projectPath) : [];
  });

  // 現在のセッションのメッセージ
  currentSessionMessages = computed(() => {
    const sessionId = this.currentQSession()?.sessionId;
    return sessionId ? this.chatMessages().filter(m => m.sessionId === sessionId) : [];
  });

  // === Project Actions ===
  setProjects = (projects: Project[]) => {
    ProjectActions.setProjects(projects);
    this.clearError();
  };

  setCurrentProject = (project: Project | null) => {
    ProjectActions.setCurrentProject(project);
  };

  addProject = (project: Project) => {
    ProjectActions.addProject(project);
    this.clearError();
  };

  updateProject = (updatedProject: Project) => {
    ProjectActions.updateProject(updatedProject);
    this.clearError();
  };

  removeProject = (projectId: string) => {
    ProjectActions.removeProject(projectId);
    this.clearError();
  };

  // === Session Actions ===
  setSessions = (sessions: Session[]) => {
    SessionActions.setSessions(sessions);
    this.clearError();
  };

  setCurrentSession = (session: Session | null) => {
    SessionActions.setCurrentSession(session);
  };

  setCurrentQSession = (currentQSession: QSessionStartedEvent | null) => {
    SessionActions.setCurrentQSession(currentQSession);
    // 新しいセッション開始時は詳細履歴をクリア
    if (currentQSession) {
      AmazonQHistoryActions.setDetailedHistoryMessages([]);
    }
  };

  addSession = (session: Session) => {
    SessionActions.addSession(session);
    this.clearError();
  };

  setSessionStarting = (starting: boolean) => {
    SessionActions.setSessionStarting(starting);
  };

  setSessionError = (error: string | null) => {
    SessionActions.setSessionError(error);
  };

  switchToActiveSession = (session: QSessionStartedEvent) => {
    SessionActions.switchToActiveSession(session);
    // 履歴表示をクリア
    AmazonQHistoryActions.setCurrentQConversation(null);
  };

  // === Amazon Q History Actions ===
  setAmazonQHistory = (history: ConversationMetadata[]) => {
    AmazonQHistoryActions.setAmazonQHistory(history);
    this.clearError();
  };

  setCurrentQConversation = (conversation: AmazonQConversation | null) => {
    AmazonQHistoryActions.setCurrentQConversation(conversation);
  };

  setQHistoryLoading = (loading: boolean) => {
    AmazonQHistoryActions.setQHistoryLoading(loading);
  };

  addQHistoryItem = (item: ConversationMetadata) => {
    AmazonQHistoryActions.addQHistoryItem(item);
    this.clearError();
  };

  setDetailedHistoryMessages = (messages: DisplayMessage[]) => {
    AmazonQHistoryActions.setDetailedHistoryMessages(messages);
  };

  setHistoryStats = (
    stats: {
      totalEntries: number;
      totalTurns: number;
      averageToolUsesPerTurn: number;
      totalToolUses: number;
    } | null
  ) => {
    AmazonQHistoryActions.setHistoryStats(stats);
  };

  switchToHistoryView = (conversation: AmazonQConversation) => {
    AmazonQHistoryActions.switchToHistoryView(conversation);
    // アクティブセッションをクリア
    SessionActions.setCurrentQSession(null);
    ChatActions.clearChatMessages();
    SessionActions.setSessionStarting(false);
    SessionActions.setSessionError(null);
  };

  switchToDetailedHistoryView = (
    messages: DisplayMessage[],
    stats: {
      totalEntries: number;
      totalTurns: number;
      averageToolUsesPerTurn: number;
      totalToolUses: number;
    } | null
  ) => {
    AmazonQHistoryActions.switchToDetailedHistoryView(messages, stats);
    // アクティブセッションをクリア
    SessionActions.setCurrentQSession(null);
    SessionActions.setSessionStarting(false);
    SessionActions.setSessionError(null);
  };

  // === Chat Actions ===
  addChatMessage = (message: ChatMessage) => {
    ChatActions.addChatMessage(message);
  };

  updateChatMessage = (messageId: string, updates: Partial<ChatMessage>) => {
    ChatActions.updateChatMessage(messageId, updates);
  };

  removeChatMessage = (messageId: string) => {
    ChatActions.removeChatMessage(messageId);
  };

  clearChatMessages = () => {
    ChatActions.clearChatMessages();
  };

  setChatMessages = (messages: ChatMessage[]) => {
    ChatActions.setChatMessages(messages);
  };

  // === UI Actions ===
  setLoading = (loading: boolean) => {
    uiState.update(state => ({ ...state, loading }));
  };

  setError = (error: string | null) => {
    uiState.update(state => ({ ...state, error, loading: false }));
  };

  clearError = () => {
    uiState.update(state => ({ ...state, error: null }));
  };

  // === Combined Actions ===
  clearCurrentView = () => {
    SessionActions.setCurrentQSession(null);
    AmazonQHistoryActions.setCurrentQConversation(null);
    SessionActions.setSessionStarting(false);
    SessionActions.setSessionError(null);
  };
}

// 型定義のエクスポート
export type { ChatMessage, DisplayMessage };

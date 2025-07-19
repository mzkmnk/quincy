import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

// Connection管理
import type { ConversationMetadata, AmazonQConversation, QSessionStartedEvent } from '@quincy/shared';

import { connect, disconnect, emit, on, off, ConnectionStateManager } from './connection';

// Amazon Q履歴管理
import { 
  getProjectHistory, 
  getAllProjectsHistory, 
  getProjectHistoryDetailed,
  setupHistoryListeners,
  setupHistoryDetailedListeners,
  removeHistoryListeners,
  removeHistoryDetailedListeners
} from './amazon-q-history';

// チャット管理
import { 
  sendQMessage, 
  setupChatListeners, 
  removeChatListeners, 
  abortQSession 
} from './chat';

// プロジェクトセッション管理
import { 
  startProjectSession, 
  resumeSession, 
  setupProjectSessionListeners, 
  createSessionFailedObservable, 
  removeProjectSessionListeners 
} from './project-session';

// 型定義
import { 
  ChatListeners, 
  HistoryListeners, 
  ListenerFlags 
} from './types';


@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionStateManager = new ConnectionStateManager();
  private readonly backendUrl = 'http://localhost:3000';
  
  // リスナーの重複防止用フラグ
  private listenerFlags: ListenerFlags = {
    chatListenersSetup: false,
    historyListenersSetup: false,
    projectSessionListenersSetup: false
  };

  // Connection state getters
  readonly connected = this.connectionStateManager.connected;
  readonly connecting = this.connectionStateManager.connecting;
  readonly error = this.connectionStateManager.error;

  // === Connection管理 ===
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = connect(this.backendUrl, this.connectionStateManager.getConnectionState());
  }

  disconnect(): void {
    disconnect(this.socket, this.connectionStateManager.getConnectionState());
    this.socket = null;
  }

  emit<T = unknown>(event: string, data?: T): void {
    emit(this.socket, event, data);
  }

  on<T = unknown>(event: string, callback: (data: T) => void): void {
    on(this.socket, event, callback);
  }

  off<T = unknown>(event: string, callback?: (data: T) => void): void {
    off(this.socket, event, callback);
  }

  // === Amazon Q履歴管理 ===
  getProjectHistory(projectPath: string): void {
    getProjectHistory(this.socket, projectPath);
  }

  getProjectHistoryDetailed(projectPath: string): void {
    getProjectHistoryDetailed(this.socket, projectPath);
  }

  getAllProjectsHistory(): Promise<void> {
    return getAllProjectsHistory(this.socket);
  }

  setupQHistoryListeners(
    onHistoryData: (data: { projectPath: string; conversation: AmazonQConversation | null; message?: string }) => void,
    onHistoryList: (data: { projects: ConversationMetadata[]; count: number }) => void
  ): void {
    // 重複セットアップを防止
    if (this.listenerFlags.historyListenersSetup) {
      this.removeQHistoryListeners();
    }
    
    const listeners: HistoryListeners = {
      onHistoryData,
      onHistoryList
    };
    
    setupHistoryListeners(this.socket, listeners);
    this.listenerFlags.historyListenersSetup = true;
  }

  removeQHistoryListeners(): void {
    removeHistoryListeners(this.socket);
    this.listenerFlags.historyListenersSetup = false;
  }

  setupQHistoryDetailedListeners(
    onDetailedHistoryData: (data: { 
      projectPath: string; 
      displayMessages: any[]; 
      stats: { 
        totalEntries: number; 
        totalTurns: number; 
        averageToolUsesPerTurn: number; 
        totalToolUses: number; 
      } | null; 
      message?: string 
    }) => void
  ): void {
    setupHistoryDetailedListeners(this.socket, onDetailedHistoryData);
  }

  removeQHistoryDetailedListeners(): void {
    removeHistoryDetailedListeners(this.socket);
  }

  // === チャット管理 ===
  async sendQMessage(sessionId: string, message: string): Promise<void> {
    return sendQMessage(this.socket, sessionId, message);
  }

  setupChatListeners(
    onResponse: (data: { sessionId: string; data: string; type: string }) => void,
    onError: (data: { sessionId: string; error: string; code: string }) => void,
    onInfo: (data: { sessionId: string; message: string; type?: string }) => void,
    onComplete: (data: { sessionId: string; exitCode: number }) => void
  ): void {
    // 重複セットアップを防止
    if (this.listenerFlags.chatListenersSetup) {
      this.removeChatListeners();
    }
    
    const listeners: ChatListeners = {
      onResponse,
      onError,
      onInfo,
      onComplete
    };
    
    setupChatListeners(this.socket, listeners);
    this.listenerFlags.chatListenersSetup = true;
  }

  removeChatListeners(): void {
    removeChatListeners(this.socket);
    this.listenerFlags.chatListenersSetup = false;
  }

  abortQSession(sessionId: string): void {
    abortQSession(this.socket, sessionId);
  }

  // === プロジェクトセッション管理 ===
  startProjectSession(projectPath: string, resume?: boolean): void {
    startProjectSession(this.socket, projectPath, resume);
  }

  resumeSession(projectPath: string, conversationId?: string): void {
    resumeSession(this.socket, projectPath, conversationId);
  }

  setupProjectSessionListeners(
    onSessionStarted: (data: QSessionStartedEvent) => void
  ): void {
    // 重複セットアップを防止
    if (this.listenerFlags.projectSessionListenersSetup) {
      this.removeProjectSessionListeners();
    }
    
    setupProjectSessionListeners(this.socket, onSessionStarted);
    this.listenerFlags.projectSessionListenersSetup = true;
  }

  removeProjectSessionListeners(): void {
    removeProjectSessionListeners(this.socket);
    this.listenerFlags.projectSessionListenersSetup = false;
  }

  onSessionFailed(): Observable<{ error: string }> {
    return createSessionFailedObservable(this.socket);
  }
}
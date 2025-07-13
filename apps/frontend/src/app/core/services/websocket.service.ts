import { Injectable, Signal, WritableSignal, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import type { ConversationMetadata, AmazonQConversation, QProjectStartEvent, QSessionStartedEvent } from '@quincy/shared';

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: WritableSignal<ConnectionState> = signal({
    connected: false,
    connecting: false,
    error: null
  });

  readonly connected: Signal<boolean> = computed(() => this.connectionState().connected);
  readonly connecting: Signal<boolean> = computed(() => this.connectionState().connecting);
  readonly error: Signal<string | null> = computed(() => this.connectionState().error);

  private readonly backendUrl = 'http://localhost:3000';

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.connectionState.set({ connected: false, connecting: true, error: null });

    this.socket = io(this.backendUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.connectionState.set({ connected: true, connecting: false, error: null });
    });

    this.socket.on('disconnect', () => {
      this.connectionState.set({ connected: false, connecting: false, error: null });
    });

    this.socket.on('connect_error', (error: Error) => {
      this.connectionState.set({ 
        connected: false, 
        connecting: false, 
        error: error.message || 'Connection failed' 
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState.set({ connected: false, connecting: false, error: null });
  }

  emit<T = unknown>(event: string, data?: T): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on<T = unknown>(event: string, callback: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off<T = unknown>(event: string, callback?: (data: T) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Amazon Q履歴関連のメソッド
  getProjectHistory(projectPath: string): void {
    this.emit('q:history', { projectPath });
  }

  getAllProjectsHistory(): void {
    this.emit('q:projects');
  }

  resumeSession(projectPath: string, conversationId?: string): void {
    this.emit('q:resume', { projectPath, conversationId });
  }

  // 新しいプロジェクトセッションを開始
  startProjectSession(projectPath: string, resume?: boolean): void {
    const data: QProjectStartEvent = { projectPath, resume };
    this.emit('q:project:start', data);
  }

  // Amazon Q履歴イベントリスナーのセットアップ
  setupQHistoryListeners(
    onHistoryData: (data: { projectPath: string; conversation: AmazonQConversation | null; message?: string }) => void,
    onHistoryList: (data: { projects: ConversationMetadata[]; count: number }) => void
  ): void {
    this.on('q:history:data', onHistoryData);
    this.on('q:history:list', onHistoryList);
  }

  // Amazon Q履歴イベントリスナーの削除
  removeQHistoryListeners(): void {
    this.off('q:history:data');
    this.off('q:history:list');
  }

  // プロジェクトセッション開始イベントリスナーのセットアップ
  setupProjectSessionListeners(
    onSessionStarted: (data: QSessionStartedEvent) => void
  ): void {
    this.on('q:session:started', onSessionStarted);
  }

  // プロジェクトセッション開始イベントリスナーの削除
  removeProjectSessionListeners(): void {
    this.off('q:session:started');
  }
}
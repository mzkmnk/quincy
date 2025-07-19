import { Injectable, Signal, WritableSignal, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
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
  
  // リスナーの重複防止用フラグ
  private chatListenersSetup = false;
  private historyListenersSetup = false;
  private projectSessionListenersSetup = false;

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

  getProjectHistoryDetailed(projectPath: string): void {
    this.emit('q:history:detailed', { projectPath });
  }

  getAllProjectsHistory(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // タイムアウトを設定（10秒）
      const timeout = setTimeout(() => {
        reject(new Error('履歴取得がタイムアウトしました'));
      }, 10000);

      // 一時的なリスナーを設定してレスポンスを待つ
      const onSuccess = () => {
        clearTimeout(timeout);
        resolve();
      };

      const onError = (error: any) => {
        clearTimeout(timeout);
        reject(new Error(error.message || '履歴取得エラー'));
      };

      // 一回だけのリスナーを設定
      this.socket.once('q:history:list', onSuccess);
      this.socket.once('error', onError);

      // リクエストを送信
      this.emit('q:projects');
    });
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
    // 重複セットアップを防止
    if (this.historyListenersSetup) {
      this.removeQHistoryListeners();
    }
    
    this.on('q:history:data', onHistoryData);
    this.on('q:history:list', onHistoryList);
    
    this.historyListenersSetup = true;
  }

  // Amazon Q履歴イベントリスナーの削除
  removeQHistoryListeners(): void {
    this.off('q:history:data');
    this.off('q:history:list');
    this.historyListenersSetup = false;
  }

  // Amazon Q詳細履歴イベントリスナーのセットアップ
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
    this.on('q:history:detailed:data', onDetailedHistoryData);
  }

  // Amazon Q詳細履歴イベントリスナーの削除
  removeQHistoryDetailedListeners(): void {
    this.off('q:history:detailed:data');
  }

  // プロジェクトセッション開始イベントリスナーのセットアップ
  setupProjectSessionListeners(
    onSessionStarted: (data: QSessionStartedEvent) => void
  ): void {
    // 重複セットアップを防止
    if (this.projectSessionListenersSetup) {
      this.removeProjectSessionListeners();
    }
    
    this.on('q:session:started', onSessionStarted);
    
    this.projectSessionListenersSetup = true;
  }

  // プロジェクトセッション開始イベントリスナーの削除
  removeProjectSessionListeners(): void {
    this.off('q:session:started');
    this.projectSessionListenersSetup = false;
  }

  // セッション失敗イベントのリスナー
  onSessionFailed(): Observable<{ error: string }> {
    return new Observable((subscriber) => {
      const handler = (data: { error: string }) => {
        subscriber.next(data);
      };
      this.on('q:session:failed', handler);
      
      return () => {
        this.off('q:session:failed', handler);
      };
    });
  }

  // Amazon Q チャット関連のメソッド
  async sendQMessage(sessionId: string, message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Send message to Amazon Q CLI session
      this.emit('q:message', {
        sessionId,
        message
      });

      // Resolve immediately since this is fire-and-forget
      // The response will come through q:response event
      resolve();
    });
  }

  // チャット関連イベントリスナーのセットアップ
  setupChatListeners(
    onResponse: (data: { sessionId: string; data: string; type: string }) => void,
    onError: (data: { sessionId: string; error: string; code: string }) => void,
    onInfo: (data: { sessionId: string; message: string; type?: string }) => void,
    onComplete: (data: { sessionId: string; exitCode: number }) => void
  ): void {
    // 重複セットアップを防止
    if (this.chatListenersSetup) {
      this.removeChatListeners();
    }
    
    this.on('q:response', onResponse);
    this.on('q:error', onError);
    this.on('q:info', onInfo);
    this.on('q:complete', onComplete);
    
    this.chatListenersSetup = true;
  }

  // チャット関連イベントリスナーの削除
  removeChatListeners(): void {
    this.off('q:response');
    this.off('q:error');
    this.off('q:info');
    this.off('q:complete');
    this.chatListenersSetup = false;
  }

  // セッション中止
  abortQSession(sessionId: string): void {
    this.emit('q:abort', { sessionId });
  }
}
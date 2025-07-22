/**
 * WebSocket接続の自動復旧機能
 * ネットワーク切断時の自動再接続
 */

import { signal, computed } from '@angular/core';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';

/**
 * 自動再接続設定
 */
export interface AutoReconnectConfig {
  maxRetries: number; // 最大再試行回数
  retryDelayMs: number; // 再試行間隔（ms）
  exponentialBackoff: boolean; // 指数バックオフの有効化
  maxRetryDelayMs: number; // 最大再試行間隔（ms）
  pingTimeoutMs: number; // Ping タイムアウト（ms）
  pingIntervalMs: number; // Ping 間隔（ms）
  enableHeartbeat: boolean; // ハートビートの有効化
  networkCheckInterval: number; // ネットワーク状態チェック間隔（ms）
}

/**
 * デフォルト自動再接続設定
 */
export const DEFAULT_AUTO_RECONNECT_CONFIG: AutoReconnectConfig = {
  maxRetries: 10,
  retryDelayMs: 2000,
  exponentialBackoff: true,
  maxRetryDelayMs: 30000, // 最大30秒
  pingTimeoutMs: 5000,
  pingIntervalMs: 25000,
  enableHeartbeat: true,
  networkCheckInterval: 10000, // 10秒
};

/**
 * 接続状態
 */
export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  retryCount: number;
  lastConnectTime: number;
  lastDisconnectTime: number;
  totalReconnects: number;
  consecutiveFailures: number;
  networkStatus: 'online' | 'offline' | 'unknown';
}

/**
 * 再接続イベント
 */
export interface ReconnectEvent {
  type:
    | 'reconnect-started'
    | 'reconnect-success'
    | 'reconnect-failed'
    | 'max-retries-reached'
    | 'network-change';
  timestamp: number;
  retryCount?: number;
  error?: Error;
  networkStatus?: 'online' | 'offline';
}

/**
 * WebSocket自動再接続マネージャー
 */
export class AutoReconnectManager {
  private config: AutoReconnectConfig;
  private socket: Socket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private networkCheckTimer: number | null = null;

  // Reactive state
  private connectionState = signal<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    retryCount: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
    totalReconnects: 0,
    consecutiveFailures: 0,
    networkStatus: 'unknown',
  });

  // Computed properties
  public readonly state = computed(() => this.connectionState());

  public readonly isHealthy = computed(() => {
    const state = this.connectionState();
    return state.isConnected && !state.isReconnecting && state.networkStatus === 'online';
  });

  public readonly shouldShowReconnecting = computed(() => {
    const state = this.connectionState();
    return state.isReconnecting || (!state.isConnected && state.networkStatus === 'online');
  });

  // Event callbacks
  private onConnectCallbacks: Array<() => void> = [];
  private onDisconnectCallbacks: Array<(reason: string) => void> = [];
  private onReconnectCallbacks: Array<(event: ReconnectEvent) => void> = [];

  constructor(config: Partial<AutoReconnectConfig> = {}) {
    this.config = { ...DEFAULT_AUTO_RECONNECT_CONFIG, ...config };

    // ネットワーク状態監視
    this.setupNetworkMonitoring();

    // ページの可視性変化監視
    this.setupVisibilityMonitoring();
  }

  /**
   * WebSocket接続開始
   */
  connect(url: string, options: Partial<ManagerOptions & SocketOptions> = {}): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Socket.IOオプション設定
    const socketOptions: Partial<ManagerOptions & SocketOptions> = {
      autoConnect: false,
      timeout: this.config.pingTimeoutMs,
      reconnection: false, // 手動で再接続制御
      ...options,
    };

    // 新しいSocket作成
    this.socket = io(url, socketOptions);

    // イベントリスナー設定
    this.setupSocketListeners();

    // 接続開始
    this.socket.connect();

    return this.socket;
  }

  /**
   * Socket.IOイベントリスナー設定
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket接続成功');

      this.connectionState.update(state => ({
        ...state,
        isConnected: true,
        isReconnecting: false,
        lastConnectTime: Date.now(),
        consecutiveFailures: 0,
        retryCount: 0,
      }));

      // 接続成功コールバック実行
      this.onConnectCallbacks.forEach(callback => callback());

      // ハートビート開始
      if (this.config.enableHeartbeat) {
        this.startHeartbeat();
      }

      // 再接続タイマークリア
      this.clearReconnectTimer();
    });

    this.socket.on('disconnect', reason => {
      console.warn('WebSocket切断:', reason);

      this.connectionState.update(state => ({
        ...state,
        isConnected: false,
        lastDisconnectTime: Date.now(),
        consecutiveFailures: state.consecutiveFailures + 1,
      }));

      // 切断コールバック実行
      this.onDisconnectCallbacks.forEach(callback => callback(reason));

      // ハートビート停止
      this.stopHeartbeat();

      // 自動再接続開始
      if (this.shouldAttemptReconnect(reason)) {
        this.startReconnectProcess();
      }
    });

    this.socket.on('connect_error', error => {
      console.error('WebSocket接続エラー:', error);

      this.connectionState.update(state => ({
        ...state,
        isConnected: false,
        consecutiveFailures: state.consecutiveFailures + 1,
      }));

      // 自動再接続開始
      this.startReconnectProcess();
    });

    this.socket.on('reconnect', attemptNumber => {
      console.log(`WebSocket再接続成功: 試行回数=${attemptNumber}`);

      this.connectionState.update(state => ({
        ...state,
        totalReconnects: state.totalReconnects + 1,
      }));

      this.emitReconnectEvent({
        type: 'reconnect-success',
        timestamp: Date.now(),
        retryCount: attemptNumber,
      });
    });
  }

  /**
   * 再接続プロセス開始
   */
  private startReconnectProcess(): void {
    const state = this.connectionState();

    if (state.isReconnecting) {
      return; // 既に再接続中
    }

    if (state.consecutiveFailures > this.config.maxRetries) {
      console.error('最大再試行回数に達しました');
      this.emitReconnectEvent({
        type: 'max-retries-reached',
        timestamp: Date.now(),
        retryCount: state.retryCount,
      });
      return;
    }

    // 再接続状態更新
    this.connectionState.update(currentState => ({
      ...currentState,
      isReconnecting: true,
      retryCount: currentState.retryCount + 1,
    }));

    this.emitReconnectEvent({
      type: 'reconnect-started',
      timestamp: Date.now(),
      retryCount: state.retryCount + 1,
    });

    // 再接続遅延計算
    const delay = this.calculateReconnectDelay(state.retryCount);

    this.reconnectTimer = window.setTimeout(() => {
      this.attemptReconnect();
    }, delay);
  }

  /**
   * 再接続試行
   */
  private attemptReconnect(): void {
    if (!this.socket) return;

    console.log('WebSocket再接続試行中...');

    try {
      this.socket.connect();
    } catch (error) {
      console.error('再接続エラー:', error);

      this.emitReconnectEvent({
        type: 'reconnect-failed',
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // 次の再接続試行をスケジュール
      this.startReconnectProcess();
    }
  }

  /**
   * 再接続遅延計算
   */
  private calculateReconnectDelay(retryCount: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelayMs;
    }

    // 指数バックオフ
    const delay = this.config.retryDelayMs * Math.pow(2, Math.min(retryCount, 6));
    return Math.min(delay, this.config.maxRetryDelayMs);
  }

  /**
   * 再接続が必要かどうかを判定
   */
  private shouldAttemptReconnect(reason: string): boolean {
    // 手動切断の場合は再接続しない
    if (reason === 'io client disconnect') {
      return false;
    }

    // ネットワークがオフラインの場合は待機
    if (this.connectionState().networkStatus === 'offline') {
      return false;
    }

    return true;
  }

  /**
   * ハートビート開始
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', Date.now());
      }
    }, this.config.pingIntervalMs);
  }

  /**
   * ハートビート停止
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * ネットワーク監視設定
   */
  private setupNetworkMonitoring(): void {
    // ブラウザのネットワーク状態API
    const updateNetworkStatus = () => {
      const networkStatus = navigator.onLine ? 'online' : 'offline';

      this.connectionState.update(state => ({
        ...state,
        networkStatus,
      }));

      this.emitReconnectEvent({
        type: 'network-change',
        timestamp: Date.now(),
        networkStatus,
      });

      // ネットワークが復旧した場合は再接続試行
      if (networkStatus === 'online' && !this.socket?.connected) {
        this.startReconnectProcess();
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // 初期状態設定
    updateNetworkStatus();

    // 定期的なネットワーク状態チェック
    this.networkCheckTimer = window.setInterval(() => {
      updateNetworkStatus();
    }, this.config.networkCheckInterval);
  }

  /**
   * ページ可視性監視設定
   */
  private setupVisibilityMonitoring(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.socket?.connected) {
        // ページが見える状態になった時に再接続試行
        setTimeout(() => {
          if (!this.socket?.connected) {
            this.startReconnectProcess();
          }
        }, 1000);
      }
    });
  }

  /**
   * 再接続タイマークリア
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 再接続イベント発行
   */
  private emitReconnectEvent(event: ReconnectEvent): void {
    this.onReconnectCallbacks.forEach(callback => callback(event));
  }

  /**
   * イベントリスナー登録
   */
  onConnect(callback: () => void): void {
    this.onConnectCallbacks.push(callback);
  }

  onDisconnect(callback: (reason: string) => void): void {
    this.onDisconnectCallbacks.push(callback);
  }

  onReconnect(callback: (event: ReconnectEvent) => void): void {
    this.onReconnectCallbacks.push(callback);
  }

  /**
   * 手動再接続
   */
  forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      setTimeout(() => {
        this.socket?.connect();
      }, 1000);
    }
  }

  /**
   * 接続切断
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.disconnect();
    }

    this.connectionState.update(state => ({
      ...state,
      isConnected: false,
      isReconnecting: false,
    }));
  }

  /**
   * 設定更新
   */
  updateConfig(config: Partial<AutoReconnectConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Socket取得
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * リソースクリーンアップ
   */
  dispose(): void {
    this.disconnect();

    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
    }

    // イベントリスナーをクリア
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onReconnectCallbacks = [];
  }
}

/**
 * 単一インスタンス（シングルトン）
 */
export const autoReconnectManager = new AutoReconnectManager();

/**
 * 便利関数: 自動再接続付きWebSocket接続
 */
export function connectWithAutoReconnect(
  url: string,
  options?: Partial<ManagerOptions & SocketOptions>,
  config?: Partial<AutoReconnectConfig>
): Socket {
  if (config) {
    autoReconnectManager.updateConfig(config);
  }
  return autoReconnectManager.connect(url, options);
}

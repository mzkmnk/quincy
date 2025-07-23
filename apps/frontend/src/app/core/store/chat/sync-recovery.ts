/**
 * フロントエンド・バックエンド状態の自動同期修復機能
 */

import { signal, computed, effect } from '@angular/core';

import type { ChatMessage as CommonChatMessage, MessageId } from '../../types/common.types';

import { chatStore } from './actions';

/**
 * 同期エラー設定
 */
export interface SyncRecoveryConfig {
  checkIntervalMs: number; // 同期チェック間隔（ms）
  maxSyncAge: number; // メッセージの最大同期許容時間（ms）
  maxRecoveryRetries: number; // 最大復旧試行回数
  enableAutoRecovery: boolean; // 自動復旧の有効化
  syncTimeoutMs: number; // 同期タイムアウト（ms）
  conflictResolutionStrategy: 'client-wins' | 'server-wins' | 'merge';
}

/**
 * デフォルト同期復旧設定
 */
export const DEFAULT_SYNC_RECOVERY_CONFIG: SyncRecoveryConfig = {
  checkIntervalMs: 30000, // 30秒
  maxSyncAge: 300000, // 5分
  maxRecoveryRetries: 3,
  enableAutoRecovery: true,
  syncTimeoutMs: 10000, // 10秒
  conflictResolutionStrategy: 'server-wins',
};

/**
 * 同期状態
 */
export interface SyncState {
  lastSyncTime: number;
  pendingSyncMessages: Set<MessageId>;
  failedSyncMessages: Set<MessageId>;
  syncErrors: Array<{ messageId: MessageId; error: string; timestamp: number }>;
  isRecovering: boolean;
  recoveryAttempts: number;
}

/**
 * 同期エラータイプ
 */
export interface SyncError {
  type: 'message-mismatch' | 'missing-message' | 'timeout' | 'network-error';
  messageId: MessageId;
  clientMessage?: CommonChatMessage;
  serverMessage?: CommonChatMessage;
  error: string;
  timestamp: number;
}

/**
 * 同期復旧イベント
 */
export interface SyncRecoveryEvent {
  type: 'sync-error-detected' | 'recovery-started' | 'recovery-success' | 'recovery-failed';
  timestamp: number;
  errors?: SyncError[];
  recoveredMessages?: MessageId[];
}

/**
 * 状態同期復旧マネージャー
 */
export class SyncRecoveryManager {
  private config: SyncRecoveryConfig;
  private syncCheckTimer: number | null = null;
  private syncState = signal<SyncState>({
    lastSyncTime: 0,
    pendingSyncMessages: new Set(),
    failedSyncMessages: new Set(),
    syncErrors: [],
    isRecovering: false,
    recoveryAttempts: 0,
  });

  // Computed properties
  public readonly state = computed(() => this.syncState());

  public readonly hasSyncIssues = computed(() => {
    const state = this.syncState();
    return (
      state.pendingSyncMessages.size > 0 ||
      state.failedSyncMessages.size > 0 ||
      state.syncErrors.length > 0
    );
  });

  public readonly syncHealth = computed(() => {
    const state = this.syncState();
    const now = Date.now();
    const timeSinceLastSync = now - state.lastSyncTime;

    if (timeSinceLastSync > this.config.maxSyncAge) {
      return 'stale';
    }

    if (this.hasSyncIssues()) {
      return 'error';
    }

    return 'healthy';
  });

  // Event callbacks
  private onSyncRecoveryCallbacks: Array<(event: SyncRecoveryEvent) => void> = [];

  constructor(config: Partial<SyncRecoveryConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_RECOVERY_CONFIG, ...config };

    if (this.config.enableAutoRecovery) {
      this.startSyncMonitoring();
    }

    // チャットストア変更の監視
    this.setupStoreMonitoring();
  }

  /**
   * 同期監視開始
   */
  private startSyncMonitoring(): void {
    this.syncCheckTimer = window.setInterval(() => {
      this.performSyncCheck();
    }, this.config.checkIntervalMs);
  }

  /**
   * ストア監視設定
   */
  private setupStoreMonitoring(): void {
    // チャットストアの変更を監視してペンディングメッセージを追跡
    effect(() => {
      const messages = chatStore.getAllMessages();
      const pendingMessages = messages.filter(
        (msg: CommonChatMessage) =>
          msg.isStreaming || (msg.timestamp && Date.now() - msg.timestamp < 5000) // 5秒以内の新しいメッセージ
      );

      this.syncState.update(state => ({
        ...state,
        pendingSyncMessages: new Set(pendingMessages.map((msg: CommonChatMessage) => msg.id)),
        lastSyncTime: Date.now(),
      }));
    });
  }

  /**
   * 同期チェック実行
   */
  private async performSyncCheck(): Promise<void> {
    const state = this.syncState();

    if (state.isRecovering) {
      return; // 既に復旧中
    }

    const errors = await this.detectSyncErrors();

    if (errors.length > 0) {
      this.emitSyncRecoveryEvent({
        type: 'sync-error-detected',
        timestamp: Date.now(),
        errors,
      });

      if (this.config.enableAutoRecovery) {
        await this.startRecoveryProcess(errors);
      }
    }
  }

  /**
   * 同期エラー検出
   */
  private async detectSyncErrors(): Promise<SyncError[]> {
    const errors: SyncError[] = [];
    const state = this.syncState();
    const now = Date.now();

    // タイムアウトしたペンディングメッセージをチェック
    for (const messageId of state.pendingSyncMessages) {
      const message = chatStore.getMessageById(messageId);
      if (message && message.timestamp) {
        const age = now - message.timestamp;

        if (age > this.config.maxSyncAge) {
          errors.push({
            type: 'timeout',
            messageId,
            clientMessage: message,
            error: `メッセージが${Math.round(age / 1000)}秒間同期されていません`,
            timestamp: now,
          });
        }
      }
    }

    // 失敗したメッセージをチェック
    for (const messageId of state.failedSyncMessages) {
      const message = chatStore.getMessageById(messageId);
      if (message) {
        errors.push({
          type: 'network-error',
          messageId,
          clientMessage: message,
          error: '同期に失敗しました',
          timestamp: now,
        });
      }
    }

    return errors;
  }

  /**
   * 復旧プロセス開始
   */
  private async startRecoveryProcess(errors: SyncError[]): Promise<void> {
    const state = this.syncState();

    if (state.recoveryAttempts >= this.config.maxRecoveryRetries) {
      console.warn('最大復旧試行回数に達しました');
      return;
    }

    // 復旧開始状態更新
    this.syncState.update(currentState => ({
      ...currentState,
      isRecovering: true,
      recoveryAttempts: currentState.recoveryAttempts + 1,
      syncErrors: [...currentState.syncErrors, ...errors],
    }));

    this.emitSyncRecoveryEvent({
      type: 'recovery-started',
      timestamp: Date.now(),
      errors,
    });

    try {
      const recoveredMessages = await this.performRecovery(errors);

      // 復旧成功
      this.syncState.update(currentState => ({
        ...currentState,
        isRecovering: false,
        pendingSyncMessages: new Set(
          [...currentState.pendingSyncMessages].filter(id => !recoveredMessages.includes(id))
        ),
        failedSyncMessages: new Set(
          [...currentState.failedSyncMessages].filter(id => !recoveredMessages.includes(id))
        ),
        lastSyncTime: Date.now(),
      }));

      this.emitSyncRecoveryEvent({
        type: 'recovery-success',
        timestamp: Date.now(),
        recoveredMessages,
      });
    } catch (error) {
      // 復旧失敗
      this.syncState.update(currentState => ({
        ...currentState,
        isRecovering: false,
      }));

      this.emitSyncRecoveryEvent({
        type: 'recovery-failed',
        timestamp: Date.now(),
        errors: [
          {
            type: 'network-error',
            messageId: '',
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          },
        ],
      });
    }
  }

  /**
   * 復旧実行
   */
  private async performRecovery(errors: SyncError[]): Promise<MessageId[]> {
    const recoveredMessages: MessageId[] = [];

    for (const error of errors) {
      try {
        const success = await this.recoverMessage(error);
        if (success) {
          recoveredMessages.push(error.messageId);
        }
      } catch (recoveryError) {
        console.error(`メッセージ復旧失敗: ${error.messageId}`, recoveryError);
      }
    }

    return recoveredMessages;
  }

  /**
   * 個別メッセージ復旧
   */
  private async recoverMessage(error: SyncError): Promise<boolean> {
    switch (error.type) {
      case 'timeout':
        return this.recoverTimeoutMessage(error);

      case 'missing-message':
        return this.recoverMissingMessage();

      case 'message-mismatch':
        return this.recoverMismatchedMessage(error);

      case 'network-error':
        return this.recoverNetworkErrorMessage(error);

      default:
        return false;
    }
  }

  /**
   * タイムアウトメッセージの復旧
   */
  private async recoverTimeoutMessage(error: SyncError): Promise<boolean> {
    const message = error.clientMessage;
    if (!message) return false;

    // メッセージの状態をリセット
    chatStore.updateMessage(error.messageId, {
      isStreaming: false,
      error: '同期タイムアウトが発生しました',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 欠落メッセージの復旧
   */
  private async recoverMissingMessage(): Promise<boolean> {
    // サーバーからメッセージを再取得
    try {
      // ここでWebSocketを使ってサーバーに問い合わせ
      // 実装は省略（実際のWebSocketサービスに依存）
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 不整合メッセージの復旧
   */
  private async recoverMismatchedMessage(error: SyncError): Promise<boolean> {
    const { clientMessage, serverMessage } = error;

    if (!clientMessage || !serverMessage) return false;

    switch (this.config.conflictResolutionStrategy) {
      case 'server-wins':
        chatStore.updateMessage(error.messageId, serverMessage);
        break;

      case 'client-wins':
        // クライアント側を保持（何もしない）
        break;

      case 'merge': {
        // メッセージをマージ（簡単な実装）
        const mergedMessage = {
          ...clientMessage,
          content: serverMessage.content || clientMessage.content,
          tools: [...(clientMessage.tools || []), ...(serverMessage.tools || [])],
          timestamp: Math.max(clientMessage.timestamp || 0, serverMessage.timestamp || 0),
        };
        chatStore.updateMessage(error.messageId, mergedMessage);
        break;
      }
    }

    return true;
  }

  /**
   * ネットワークエラーメッセージの復旧
   */
  private async recoverNetworkErrorMessage(error: SyncError): Promise<boolean> {
    const message = error.clientMessage;
    if (!message) return false;

    // メッセージを再送信対象としてマーク
    chatStore.updateMessage(error.messageId, {
      needsResync: true,
      error: 'ネットワークエラーが発生しました。再同期が必要です。',
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * 手動同期実行
   */
  async forceSyncCheck(): Promise<SyncError[]> {
    const errors = await this.detectSyncErrors();

    if (errors.length > 0 && this.config.enableAutoRecovery) {
      await this.startRecoveryProcess(errors);
    }

    return errors;
  }

  /**
   * メッセージを同期失敗としてマーク
   */
  markMessageSyncFailed(messageId: MessageId): void {
    this.syncState.update(state => ({
      ...state,
      failedSyncMessages: new Set([...state.failedSyncMessages, messageId]),
      pendingSyncMessages: new Set([...state.pendingSyncMessages].filter(id => id !== messageId)),
    }));
  }

  /**
   * メッセージ同期成功をマーク
   */
  markMessageSyncSuccess(messageId: MessageId): void {
    this.syncState.update(state => ({
      ...state,
      pendingSyncMessages: new Set([...state.pendingSyncMessages].filter(id => id !== messageId)),
      failedSyncMessages: new Set([...state.failedSyncMessages].filter(id => id !== messageId)),
      lastSyncTime: Date.now(),
    }));
  }

  /**
   * 同期復旧イベント発行
   */
  private emitSyncRecoveryEvent(event: SyncRecoveryEvent): void {
    this.onSyncRecoveryCallbacks.forEach(callback => callback(event));
  }

  /**
   * イベントリスナー登録
   */
  onSyncRecovery(callback: (event: SyncRecoveryEvent) => void): void {
    this.onSyncRecoveryCallbacks.push(callback);
  }

  /**
   * 同期エラーをクリア
   */
  clearSyncErrors(): void {
    this.syncState.update(state => ({
      ...state,
      syncErrors: [],
      recoveryAttempts: 0,
    }));
  }

  /**
   * 設定更新
   */
  updateConfig(config: Partial<SyncRecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 監視停止
   */
  stop(): void {
    if (this.syncCheckTimer) {
      clearInterval(this.syncCheckTimer);
      this.syncCheckTimer = null;
    }
  }

  /**
   * リソースクリーンアップ
   */
  dispose(): void {
    this.stop();
    this.onSyncRecoveryCallbacks = [];
    this.syncState.set({
      lastSyncTime: 0,
      pendingSyncMessages: new Set(),
      failedSyncMessages: new Set(),
      syncErrors: [],
      isRecovering: false,
      recoveryAttempts: 0,
    });
  }
}

/**
 * 単一インスタンス（シングルトン）
 */
export const syncRecoveryManager = new SyncRecoveryManager();

/**
 * 便利関数: 同期復旧の開始
 */
export function startSyncRecovery(config?: Partial<SyncRecoveryConfig>): void {
  if (config) {
    syncRecoveryManager.updateConfig(config);
  }
  // 既にコンストラクタで開始されているため、何もしない
}

/**
 * 便利関数: メッセージ同期状態の更新
 */
export function updateMessageSyncStatus(messageId: MessageId, success: boolean): void {
  if (success) {
    syncRecoveryManager.markMessageSyncSuccess(messageId);
  } else {
    syncRecoveryManager.markMessageSyncFailed(messageId);
  }
}

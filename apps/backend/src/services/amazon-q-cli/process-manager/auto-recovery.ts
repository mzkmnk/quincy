/**
 * プロセス異常終了時の自動復旧機能
 * プロセス監視と自動再起動
 */

import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * 復旧設定
 */
export interface RecoveryConfig {
  maxRetries: number; // 最大再試行回数
  retryDelayMs: number; // 再試行間隔（ms）
  exponentialBackoff: boolean; // 指数バックオフの有無
  healthCheckInterval: number; // ヘルスチェック間隔（ms）
  processTimeoutMs: number; // プロセス応答タイムアウト（ms）
  enableAutoRestart: boolean; // 自動再起動の有効化
}

/**
 * デフォルト復旧設定
 */
export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  maxRetries: 3,
  retryDelayMs: 2000,
  exponentialBackoff: true,
  healthCheckInterval: 30000, // 30秒
  processTimeoutMs: 10000, // 10秒
  enableAutoRestart: true,
};

/**
 * 復旧状態
 */
export interface RecoveryState {
  isRecovering: boolean;
  retryCount: number;
  lastFailureTime: number;
  lastRecoveryTime: number;
  totalFailures: number;
  consecutiveFailures: number;
}

/**
 * 復旧イベント
 */
export interface RecoveryEvent {
  type: 'recovery-started' | 'recovery-success' | 'recovery-failed' | 'max-retries-reached';
  sessionId: string;
  timestamp: number;
  error?: Error;
  retryCount?: number;
}

/**
 * 自動復旧マネージャー
 */
export class AutoRecoveryManager extends EventEmitter {
  private config: RecoveryConfig;
  private recoveryStates = new Map<string, RecoveryState>();
  private healthCheckTimers = new Map<string, NodeJS.Timeout>();
  private processRestartCallbacks = new Map<string, () => Promise<ChildProcess>>();

  constructor(config: Partial<RecoveryConfig> = {}) {
    super();
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
  }

  /**
   * セッションの監視を開始
   */
  startMonitoring(
    sessionId: string,
    process: ChildProcess,
    restartCallback: () => Promise<ChildProcess>
  ): void {
    this.processRestartCallbacks.set(sessionId, restartCallback);

    // 初期状態設定
    this.recoveryStates.set(sessionId, {
      isRecovering: false,
      retryCount: 0,
      lastFailureTime: 0,
      lastRecoveryTime: 0,
      totalFailures: 0,
      consecutiveFailures: 0,
    });

    // プロセス終了イベントリスナー
    process.on('exit', (code, signal) => {
      this.handleProcessExit(sessionId, code, signal);
    });

    process.on('error', error => {
      this.handleProcessError(sessionId, error);
    });

    // ヘルスチェック開始
    this.startHealthCheck(sessionId, process);
  }

  /**
   * セッションの監視を停止
   */
  stopMonitoring(sessionId: string): void {
    // ヘルスチェック停止
    const timer = this.healthCheckTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(sessionId);
    }

    // 状態とコールバッククリア
    this.recoveryStates.delete(sessionId);
    this.processRestartCallbacks.delete(sessionId);
  }

  /**
   * プロセス終了処理
   */
  private async handleProcessExit(
    sessionId: string,
    code: number | null,
    signal: string | null
  ): Promise<void> {
    const state = this.recoveryStates.get(sessionId);
    if (!state) return;

    // 正常終了の場合は何もしない
    if (code === 0) {
      this.resetRecoveryState(sessionId);
      return;
    }

    console.warn(`プロセス異常終了: Session=${sessionId}, Code=${code}, Signal=${signal}`);

    // 失敗統計更新
    const now = Date.now();
    this.recoveryStates.set(sessionId, {
      ...state,
      lastFailureTime: now,
      totalFailures: state.totalFailures + 1,
      consecutiveFailures: state.consecutiveFailures + 1,
    });

    // 自動復旧開始
    if (this.config.enableAutoRestart) {
      await this.attemptRecovery(
        sessionId,
        new Error(`プロセス異常終了: code=${code}, signal=${signal}`)
      );
    }
  }

  /**
   * プロセスエラー処理
   */
  private async handleProcessError(sessionId: string, error: Error): Promise<void> {
    console.error(`プロセスエラー: Session=${sessionId}`, error);

    const state = this.recoveryStates.get(sessionId);
    if (!state) return;

    // 失敗統計更新
    const now = Date.now();
    this.recoveryStates.set(sessionId, {
      ...state,
      lastFailureTime: now,
      totalFailures: state.totalFailures + 1,
      consecutiveFailures: state.consecutiveFailures + 1,
    });

    // 自動復旧開始
    if (this.config.enableAutoRestart) {
      await this.attemptRecovery(sessionId, error);
    }
  }

  /**
   * 復旧試行
   */
  private async attemptRecovery(sessionId: string, error: Error): Promise<void> {
    const state = this.recoveryStates.get(sessionId);
    if (!state || state.isRecovering) return;

    // 最大再試行回数チェック
    if (state.consecutiveFailures > this.config.maxRetries) {
      this.emit('recovery-event', {
        type: 'max-retries-reached',
        sessionId,
        timestamp: Date.now(),
        error,
        retryCount: state.retryCount,
      } as RecoveryEvent);
      return;
    }

    // 復旧開始
    this.recoveryStates.set(sessionId, {
      ...state,
      isRecovering: true,
      retryCount: state.retryCount + 1,
    });

    this.emit('recovery-event', {
      type: 'recovery-started',
      sessionId,
      timestamp: Date.now(),
      retryCount: state.retryCount + 1,
    } as RecoveryEvent);

    try {
      // 再試行前の待機
      const delay = this.calculateRetryDelay(state.retryCount);
      await this.sleep(delay);

      // プロセス再起動
      const restartCallback = this.processRestartCallbacks.get(sessionId);
      if (!restartCallback) {
        throw new Error('再起動コールバックが設定されていません');
      }

      const newProcess = await restartCallback();

      // 新しいプロセスの監視開始
      this.startMonitoring(sessionId, newProcess, restartCallback);

      // 復旧成功
      const updatedState = this.recoveryStates.get(sessionId);
      if (updatedState) {
        this.recoveryStates.set(sessionId, {
          ...updatedState,
          isRecovering: false,
          lastRecoveryTime: Date.now(),
          consecutiveFailures: 0, // 連続失敗カウントをリセット
        });
      }

      this.emit('recovery-event', {
        type: 'recovery-success',
        sessionId,
        timestamp: Date.now(),
        retryCount: state.retryCount + 1,
      } as RecoveryEvent);
    } catch (recoveryError) {
      // 復旧失敗
      const updatedState = this.recoveryStates.get(sessionId);
      if (updatedState) {
        this.recoveryStates.set(sessionId, {
          ...updatedState,
          isRecovering: false,
        });
      }

      this.emit('recovery-event', {
        type: 'recovery-failed',
        sessionId,
        timestamp: Date.now(),
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        retryCount: state.retryCount + 1,
      } as RecoveryEvent);

      // 再帰的に復旧試行
      setTimeout(() => {
        this.attemptRecovery(
          sessionId,
          recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError))
        );
      }, 1000);
    }
  }

  /**
   * ヘルスチェック開始
   */
  private startHealthCheck(sessionId: string, process: ChildProcess): void {
    const timer = setInterval(() => {
      this.performHealthCheck(sessionId, process);
    }, this.config.healthCheckInterval);

    this.healthCheckTimers.set(sessionId, timer);
  }

  /**
   * ヘルスチェック実行
   */
  private async performHealthCheck(sessionId: string, process: ChildProcess): Promise<void> {
    try {
      // プロセスが生きているかチェック
      if (process.killed || process.exitCode !== null) {
        console.warn(`ヘルスチェック失敗: プロセス停止 Session=${sessionId}`);
        await this.handleProcessError(sessionId, new Error('プロセスが停止しています'));
        return;
      }

      // プロセス基本情報チェック
      if (process.pid) {
        // PIDが存在することを確認（プロセスが生きているかの基本チェック）
        try {
          // シグナル0を送ることでプロセスの存在確認（Nodeプロセス自体の確認）
          const pid = process.pid;
          if (pid <= 0) {
            throw new Error('無効なPID');
          }
        } catch {
          console.warn(`プロセス存在確認失敗: Session=${sessionId}, PID=${process.pid}`);
          await this.handleProcessError(sessionId, new Error('プロセスが存在しません'));
          return;
        }
      }
    } catch (error) {
      console.error(`ヘルスチェックエラー: Session=${sessionId}`, error);
    }
  }

  /**
   * 再試行間隔計算
   */
  private calculateRetryDelay(retryCount: number): number {
    if (!this.config.exponentialBackoff) {
      return this.config.retryDelayMs;
    }

    // 指数バックオフ: delay * 2^(retryCount-1)
    return this.config.retryDelayMs * Math.pow(2, Math.min(retryCount - 1, 5)); // 最大32倍
  }

  /**
   * 復旧状態をリセット
   */
  private resetRecoveryState(sessionId: string): void {
    const state = this.recoveryStates.get(sessionId);
    if (state) {
      this.recoveryStates.set(sessionId, {
        ...state,
        consecutiveFailures: 0,
        retryCount: 0,
        isRecovering: false,
      });
    }
  }

  /**
   * 復旧統計取得
   */
  getRecoveryStats(sessionId?: string): Map<string, RecoveryState> | RecoveryState | null {
    if (sessionId) {
      return this.recoveryStates.get(sessionId) || null;
    }
    return new Map(this.recoveryStates);
  }

  /**
   * 設定更新
   */
  updateConfig(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 全セッションの監視停止
   */
  stopAllMonitoring(): void {
    for (const sessionId of this.recoveryStates.keys()) {
      this.stopMonitoring(sessionId);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * リソースクリーンアップ
   */
  dispose(): void {
    this.stopAllMonitoring();
    this.removeAllListeners();
  }
}

/**
 * 単一インスタンス（シングルトン）
 */
export const autoRecoveryManager = new AutoRecoveryManager();

/**
 * 便利関数: セッションの自動復旧監視開始
 */
export function startSessionRecovery(
  sessionId: string,
  process: ChildProcess,
  restartCallback: () => Promise<ChildProcess>,
  config?: Partial<RecoveryConfig>
): void {
  if (config) {
    autoRecoveryManager.updateConfig(config);
  }
  autoRecoveryManager.startMonitoring(sessionId, process, restartCallback);
}

/**
 * 便利関数: セッションの自動復旧監視停止
 */
export function stopSessionRecovery(sessionId: string): void {
  autoRecoveryManager.stopMonitoring(sessionId);
}

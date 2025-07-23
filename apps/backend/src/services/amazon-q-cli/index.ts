import { EventEmitter } from 'events';
import { promisify } from 'util';
import { exec } from 'child_process';

import { generateSessionId } from '../../utils/id-generator';
import { validateProjectPath } from '../../utils/path-validator';
import { isValidCLIPath, getCLICandidates } from '../../utils/cli-validator';

// 分離した関数のインポート
import {
  spawnProcess,
  waitForProcessStart,
  startResourceMonitoring,
  updateAllSessionResources,
  setupCleanupHandlers,
  destroy as destroyProcessManager,
} from './process-manager';
import {
  QProcessSession,
  QProcessOptions,
  createSession,
  getSession,
  getActiveSessions,
  getSessionRuntime,
  getSessionStats,
  terminateAllSessions,
  updateSessionResources,
  sendInput,
  abortSession,
} from './session-manager';
import { setupProcessHandlers } from './message-handler';
import {
  flushIncompleteOutputLine,
  flushIncompleteErrorLine,
  flushOutputBuffer,
  addToInitializationBuffer,
  flushInitializationBuffer,
} from './buffer-manager';
import { checkCLIAvailabilityService, buildCommandArgs } from './cli-checker';

export class AmazonQCLIService extends EventEmitter {
  private sessions: Map<string, QProcessSession> = new Map();
  private readonly CLI_COMMAND = process.env.AMAZON_Q_CLI_PATH || 'q';
  private readonly CLI_CANDIDATES = getCLICandidates();
  private readonly DEFAULT_TIMEOUT = 0; // タイムアウト無効化（0 = 無期限）
  private readonly MAX_BUFFER_SIZE = 10 * 1024; // 10KB制限
  private readonly execAsync = promisify(exec);
  private cliPath: string | null = null;
  private cliChecked: boolean = false;

  // メモリリーク対策：タイマーとリスナーの管理
  private resourceMonitorInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private isDestroyed: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(50); // EventEmitterのリスナー上限を増加
    this.setupCleanupHandlers();
    this.startResourceMonitoring();
  }

  /**
   * セキュアなCLI実行
   */
  private async executeSecureCLI(
    cliPath: string,
    args: string[]
  ): Promise<{ stdout: string; stderr: string }> {
    if (!isValidCLIPath(cliPath)) {
      throw new Error(`Invalid CLI path for security reasons: ${cliPath}`);
    }

    // 引数も検証
    const safeArgs = args.filter(arg => {
      // 基本的な引数のみ許可
      return typeof arg === 'string' && arg.length < 100 && !/[;|&`$()]/.test(arg);
    });

    if (safeArgs.length !== args.length) {
      throw new Error('Invalid arguments detected for security reasons');
    }

    return this.execAsync(`"${cliPath}" ${safeArgs.join(' ')}`, { timeout: 5000 });
  }

  async checkCLIAvailability(): Promise<{ available: boolean; path?: string; error?: string }> {
    if (this.cliChecked && this.cliPath) {
      return { available: true, path: this.cliPath };
    }

    const result = await checkCLIAvailabilityService();

    if (result.available && result.path) {
      this.cliPath = result.path;
      this.cliChecked = true;
    } else {
      this.cliChecked = true;
    }

    return result;
  }

  /**
   * Amazon Q CLIプロセスを起動
   */
  async startSession(command: string, options: QProcessOptions): Promise<string> {
    const sessionId = generateSessionId();

    try {
      // プロジェクトパスの検証
      const pathValidation = await validateProjectPath(options.workingDir);
      if (!pathValidation.valid) {
        throw new Error(`Invalid project path: ${pathValidation.error}`);
      }

      // 検証済みの正規化されたパスを使用
      const validatedWorkingDir = pathValidation.normalizedPath!;

      // CLI可用性をチェック
      const cliCheck = await this.checkCLIAvailability();
      if (!cliCheck.available) {
        throw new Error(cliCheck.error || 'Amazon Q CLI is not available');
      }

      const cliCommand = cliCheck.path || this.CLI_COMMAND;

      // コマンドライン引数を構築
      const args = buildCommandArgs(command, options);

      // プロセスを起動
      const childProcess = spawnProcess(cliCommand, args, validatedWorkingDir);

      // セッション情報を登録
      const session = createSession(sessionId, childProcess, validatedWorkingDir, command, options);
      this.sessions.set(sessionId, session);

      this.setupProcessHandlers(session);

      // タイムアウト設定
      if (options.timeout !== undefined || this.DEFAULT_TIMEOUT > 0) {
        const timeout = options.timeout || this.DEFAULT_TIMEOUT;
        setTimeout(() => {
          if (this.sessions.has(sessionId)) {
            this.abortSession(sessionId, 'timeout');
          }
        }, timeout);
      }

      // プロセス起動の確認
      await waitForProcessStart(childProcess);
      session.status = 'running';

      return sessionId;
    } catch (error) {
      this.sessions.delete(sessionId);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to start Amazon Q CLI: ${errorMessage}`);
    }
  }

  /**
   * セッションを強制終了
   */
  async abortSession(sessionId: string, reason: string = 'user_request'): Promise<boolean> {
    return await abortSession(this.sessions, sessionId, reason, this.emit.bind(this));
  }

  /**
   * セッションにテキスト入力を送信
   */
  async sendInput(sessionId: string, input: string): Promise<boolean> {
    return await sendInput(this.sessions, sessionId, input);
  }

  /**
   * アクティブなセッション一覧を取得
   */
  getActiveSessions(): QProcessSession[] {
    return getActiveSessions(this.sessions);
  }

  /**
   * 指定セッションの情報を取得
   */
  getSession(sessionId: string): QProcessSession | undefined {
    return getSession(this.sessions, sessionId);
  }

  /**
   * 全セッションを終了
   */
  async terminateAllSessions(): Promise<void> {
    await terminateAllSessions(this.sessions, this.abortSession.bind(this));
  }

  /**
   * セッションのリソース使用量を更新
   */
  async updateSessionResources(sessionId: string): Promise<void> {
    await updateSessionResources(this.sessions, sessionId);
  }

  /**
   * セッションの実行時間を取得
   */
  getSessionRuntime(sessionId: string): number {
    return getSessionRuntime(this.sessions, sessionId);
  }

  /**
   * セッションの詳細統計を取得
   */
  getSessionStats(sessionId: string): {
    sessionId: string;
    pid?: number;
    status: string;
    runtime: number;
    memoryUsage?: number;
    cpuUsage?: number;
    workingDir: string;
    command: string;
    startTime: number;
    lastActivity: number;
    isActive: boolean;
  } | null {
    return getSessionStats(this.sessions, sessionId);
  }

  private setupCleanupHandlers(): void {
    this.cleanupInterval = setupCleanupHandlers(this.sessions, this.destroy.bind(this));
  }

  private startResourceMonitoring(): void {
    this.resourceMonitorInterval = startResourceMonitoring(() => {
      if (!this.isDestroyed) {
        return updateAllSessionResources(this.sessions);
      }
      return Promise.resolve();
    });
  }

  private setupProcessHandlers(session: QProcessSession): void {
    setupProcessHandlers(
      session,
      this.emit.bind(this),
      (session, emitCallback) => flushIncompleteOutputLine(session, emitCallback),
      session =>
        flushIncompleteErrorLine(session, this.emit.bind(this), (session, message) =>
          addToInitializationBuffer(session, message, session =>
            flushInitializationBuffer(session, this.emit.bind(this))
          )
        ),
      (session, message) =>
        addToInitializationBuffer(session, message, session =>
          flushInitializationBuffer(session, this.emit.bind(this))
        ),
      session => flushInitializationBuffer(session, this.emit.bind(this)),
      session => flushOutputBuffer(session, this.emit.bind(this)),
      sessionId => this.sessions.delete(sessionId),
      sessionId => {
        // プロンプト準備完了イベントを発行
        this.emit('q:info', { sessionId, message: 'prompt-ready', type: 'status' });
      }
    );
  }

  /**
   * リソースとイベントリスナーの完全な破棄
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // すべてのアクティブセッションを終了
    this.terminateAllSessions();

    // インターバルの停止
    destroyProcessManager(this.resourceMonitorInterval, this.cleanupInterval);

    // EventEmitterのリスナーをすべて削除
    this.removeAllListeners();

    // セッションマップをクリア
    this.sessions.clear();
  }
}

// 既存のインターフェースもエクスポート
export type { QProcessSession, QProcessOptions };

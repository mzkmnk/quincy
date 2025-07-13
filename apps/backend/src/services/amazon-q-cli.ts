import { spawn, ChildProcess, exec } from 'child_process';
import { EventEmitter } from 'events';
import { promisify } from 'util';
import type { 
  QCommandEvent, 
  QResponseEvent, 
  QErrorEvent, 
  QCompleteEvent 
} from '@quincy/shared';

export interface QProcessSession {
  sessionId: string;
  process: ChildProcess;
  workingDir: string;
  startTime: number;
  status: 'starting' | 'running' | 'completed' | 'error' | 'aborted';
  lastActivity: number;
  pid?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  command: string;
  options: QProcessOptions;
}

export interface QProcessOptions {
  workingDir: string;
  model?: string;
  resume?: boolean;
  timeout?: number;
}

export class AmazonQCLIService extends EventEmitter {
  private sessions: Map<string, QProcessSession> = new Map();
  private readonly CLI_COMMAND = process.env.AMAZON_Q_CLI_PATH || 'q';
  private readonly CLI_CANDIDATES = [
    'q',
    '/usr/local/bin/q',
    '/opt/homebrew/bin/q',
    process.env.HOME + '/.local/bin/q'
  ].filter(Boolean); // undefined要素を除外
  private readonly DEFAULT_TIMEOUT = 300000; // 5分
  private readonly execAsync = promisify(exec);
  private cliPath: string | null = null;
  private cliChecked: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(50); // EventEmitterのリスナー上限を増加
    this.setupCleanupHandlers();
    this.startResourceMonitoring();
  }

  /**
   * Amazon Q CLIの存在と可用性をチェック
   */
  async checkCLIAvailability(): Promise<{ available: boolean; path?: string; error?: string }> {
    if (this.cliChecked && this.cliPath) {
      return { available: true, path: this.cliPath };
    }

    console.log('🔍 Checking Amazon Q CLI availability...');
    console.log(`📂 Current PATH: ${process.env.PATH}`);
    console.log(`📍 Current working directory: ${process.cwd()}`);

    // 候補パスを順番にチェック
    for (const candidate of this.CLI_CANDIDATES) {
      try {
        console.log(`🔍 Trying CLI candidate: ${candidate}`);
        const { stdout, stderr } = await this.execAsync(`"${candidate}" --version`, { timeout: 5000 });
        
        if (stdout && stdout.includes('q')) {
          console.log(`✅ Found Amazon Q CLI at: ${candidate}`);
          console.log(`📋 Version output: ${stdout.trim()}`);
          this.cliPath = candidate;
          this.cliChecked = true;
          return { available: true, path: candidate };
        }
      } catch (error) {
        console.log(`❌ CLI candidate ${candidate} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    // whichコマンドで検索
    try {
      console.log('🔍 Trying with "which q" command...');
      const { stdout } = await this.execAsync('which q', { timeout: 5000 });
      if (stdout.trim()) {
        const path = stdout.trim();
        console.log(`✅ Found Amazon Q CLI via which: ${path}`);
        this.cliPath = path;
        this.cliChecked = true;
        return { available: true, path };
      }
    } catch (error) {
      console.log('❌ "which q" failed:', error instanceof Error ? error.message : String(error));
    }

    const errorMsg = `Amazon Q CLI not found. Please install Amazon Q CLI and ensure 'q' command is available in PATH. Tried paths: ${this.CLI_CANDIDATES.join(', ')}`;
    console.error(`❌ ${errorMsg}`);
    this.cliChecked = true;
    
    return { 
      available: false, 
      error: errorMsg
    };
  }

  /**
   * Amazon Q CLIプロセスを起動
   */
  async startSession(command: string, options: QProcessOptions): Promise<string> {
    const sessionId = this.generateSessionId();
    
    try {
      // CLI可用性をチェック
      const cliCheck = await this.checkCLIAvailability();
      if (!cliCheck.available) {
        throw new Error(cliCheck.error || 'Amazon Q CLI is not available');
      }

      const cliCommand = cliCheck.path || this.CLI_COMMAND;
      console.log(`🚀 Starting Amazon Q CLI session with command: ${cliCommand}`);
      console.log(`📂 Working directory: ${options.workingDir}`);

      // コマンドライン引数を構築
      const args = this.buildCommandArgs(command, options);
      console.log(`📋 CLI arguments: ${args.join(' ')}`);
      
      // プロセスを起動
      const childProcess = spawn(cliCommand, args, {
        cwd: options.workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Amazon Q CLI用の環境変数設定
          AWS_PAGER: '',
          NO_COLOR: '1'
        }
      });

      // セッション情報を登録
      const session: QProcessSession = {
        sessionId,
        process: childProcess,
        workingDir: options.workingDir,
        startTime: Date.now(),
        status: 'starting',
        lastActivity: Date.now(),
        pid: childProcess.pid,
        command,
        options
      };

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
      await this.waitForProcessStart(childProcess);
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
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      session.status = 'aborted';
      
      // プロセスを強制終了
      if (!session.process.killed) {
        session.process.kill('SIGTERM');
        
        // SIGTERM後、一定時間待ってもプロセスが終了しない場合はSIGKILL
        setTimeout(() => {
          if (!session.process.killed) {
            session.process.kill('SIGKILL');
          }
        }, 5000);
      }

      this.sessions.delete(sessionId);
      
      // 終了イベントを発行
      this.emit('session:aborted', {
        sessionId,
        reason,
        exitCode: 0 // 正常な中止として扱う
      });

      return true;
    } catch (error) {
      console.error(`Failed to abort session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * セッションにテキスト入力を送信
   */
  async sendInput(sessionId: string, input: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'running') {
      return false;
    }

    try {
      if (session.process.stdin && !session.process.stdin.destroyed) {
        session.process.stdin.write(input);
        session.lastActivity = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to send input to session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * アクティブなセッション一覧を取得
   */
  getActiveSessions(): QProcessSession[] {
    return Array.from(this.sessions.values()).filter(
      session => ['starting', 'running'].includes(session.status)
    );
  }

  /**
   * 指定セッションの情報を取得
   */
  getSession(sessionId: string): QProcessSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 全セッションを終了
   */
  async terminateAllSessions(): Promise<void> {
    const activeSessionIds = Array.from(this.sessions.keys());
    const terminations = activeSessionIds.map(sessionId => 
      this.abortSession(sessionId, 'shutdown')
    );
    
    await Promise.allSettled(terminations);
  }

  /**
   * セッションのリソース使用量を更新
   */
  async updateSessionResources(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.pid) {
      return;
    }

    try {
      const usage = process.cpuUsage();
      const memUsage = process.memoryUsage();
      
      // 概算値として設定（実際のプロセス固有値の取得は OS依存）
      session.cpuUsage = (usage.user + usage.system) / 1000; // マイクロ秒をミリ秒に
      session.memoryUsage = memUsage.rss / (1024 * 1024); // バイトをMBに
      session.lastActivity = Date.now();
    } catch (error) {
      console.warn(`Failed to update resources for session ${sessionId}:`, error);
    }
  }

  /**
   * セッションの実行時間を取得
   */
  getSessionRuntime(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return 0;
    }
    
    return Date.now() - session.startTime;
  }

  /**
   * セッションの詳細統計を取得
   */
  getSessionStats(sessionId: string): Record<string, any> | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      pid: session.pid,
      status: session.status,
      runtime: this.getSessionRuntime(sessionId),
      memoryUsage: session.memoryUsage,
      cpuUsage: session.cpuUsage,
      workingDir: session.workingDir,
      command: session.command,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      isActive: ['starting', 'running'].includes(session.status)
    };
  }

  private buildCommandArgs(command: string, options: QProcessOptions): string[] {
    const args: string[] = [];
    
    // モデル指定
    if (options.model) {
      args.push('--model', options.model);
    }
    
    // resume指定
    if (options.resume) {
      args.push('--resume');
    }
    
    // コマンド追加
    args.push(...command.split(' ').filter(arg => arg.length > 0));
    
    return args;
  }

  private setupProcessHandlers(session: QProcessSession): void {
    const { sessionId, process } = session;

    // 標準出力の処理
    process.stdout?.on('data', (data: Buffer) => {
      session.lastActivity = Date.now();
      const output = data.toString();
      
      const responseEvent: QResponseEvent = {
        sessionId,
        data: output,
        type: 'stream'
      };
      
      this.emit('q:response', responseEvent);
    });

    // 標準エラー出力の処理
    process.stderr?.on('data', (data: Buffer) => {
      session.lastActivity = Date.now();
      const error = data.toString();
      
      const errorEvent: QErrorEvent = {
        sessionId,
        error,
        code: 'STDERR'
      };
      
      this.emit('q:error', errorEvent);
    });

    // プロセス終了の処理
    process.on('exit', (code: number | null, signal: string | null) => {
      session.status = code === 0 ? 'completed' : 'error';
      
      const completeEvent: QCompleteEvent = {
        sessionId,
        exitCode: code || -1
      };
      
      this.emit('q:complete', completeEvent);
      
      // セッションをクリーンアップ（遅延実行）
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, 5000);
    });

    // プロセスエラーの処理
    process.on('error', (error: Error) => {
      session.status = 'error';
      
      const errorEvent: QErrorEvent = {
        sessionId,
        error: error.message,
        code: 'PROCESS_ERROR'
      };
      
      this.emit('q:error', errorEvent);
    });
  }

  private async waitForProcessStart(process: ChildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Process start timeout'));
      }, 10000); // 10秒でタイムアウト

      process.on('spawn', () => {
        clearTimeout(timeout);
        resolve();
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private generateSessionId(): string {
    return `q_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private setupCleanupHandlers(): void {
    // プロセス終了時のクリーンアップ
    const cleanup = () => {
      this.terminateAllSessions();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

    // 非アクティブセッションの定期クリーンアップ
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 60000); // 1分毎
  }

  private startResourceMonitoring(): void {
    // 定期的なリソース監視
    setInterval(() => {
      this.updateAllSessionResources();
    }, 30000); // 30秒毎
  }

  private async updateAllSessionResources(): Promise<void> {
    const activeSessionIds = this.getActiveSessions().map(s => s.sessionId);
    
    for (const sessionId of activeSessionIds) {
      await this.updateSessionResources(sessionId);
    }
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30分

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > INACTIVE_THRESHOLD) {
        console.log(`Cleaning up inactive session: ${sessionId}`);
        this.abortSession(sessionId, 'inactive');
      }
    }
  }
}
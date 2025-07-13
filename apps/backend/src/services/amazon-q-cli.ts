import { spawn, ChildProcess, exec } from 'child_process';
import { EventEmitter } from 'events';
import { promisify } from 'util';
import { access, stat } from 'fs/promises';
import { resolve, normalize, isAbsolute } from 'path';
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
  status: 'starting' | 'running' | 'completed' | 'error' | 'aborted' | 'terminated';
  lastActivity: number;
  pid?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  command: string;
  options: QProcessOptions;
  // レスポンスバッファリング用
  outputBuffer: string;
  errorBuffer: string;
  bufferTimeout?: NodeJS.Timeout;
  bufferFlushCount: number;
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
   * プロジェクトパスの検証
   */
  async validateProjectPath(projectPath: string): Promise<{ valid: boolean; error?: string; normalizedPath?: string }> {
    try {
      console.log(`🔍 Validating project path: ${projectPath}`);

      // 基本的なバリデーション
      if (!projectPath || typeof projectPath !== 'string') {
        return { valid: false, error: 'Project path is required and must be a string' };
      }

      const trimmedPath = projectPath.trim();
      if (!trimmedPath) {
        return { valid: false, error: 'Project path cannot be empty' };
      }

      // 絶対パスチェック
      if (!isAbsolute(trimmedPath)) {
        return { valid: false, error: 'Project path must be an absolute path' };
      }

      // パスの正規化（../ などの解決）
      const normalizedPath = normalize(resolve(trimmedPath));
      console.log(`📍 Normalized path: ${normalizedPath}`);

      // セキュリティチェック：危険なパス
      const dangerousPaths = [
        '/',
        '/etc',
        '/bin',
        '/usr/bin',
        '/sbin',
        '/usr/sbin',
        '/var',
        '/tmp',
        '/System',
        '/Applications'
      ];

      if (dangerousPaths.some(dangerous => normalizedPath === dangerous || normalizedPath.startsWith(dangerous + '/'))) {
        return { valid: false, error: 'Access to system directories is not allowed for security reasons' };
      }

      // パストラバーサル攻撃チェック
      if (normalizedPath.includes('..') || normalizedPath !== trimmedPath.replace(/\/+/g, '/')) {
        return { valid: false, error: 'Invalid path: path traversal detected' };
      }

      // ディレクトリの存在確認
      try {
        await access(normalizedPath);
        const stats = await stat(normalizedPath);
        
        if (!stats.isDirectory()) {
          return { valid: false, error: 'Path exists but is not a directory' };
        }

        console.log(`✅ Path validation successful: ${normalizedPath}`);
        return { valid: true, normalizedPath };

      } catch (accessError) {
        console.log(`❌ Path does not exist or is not accessible: ${normalizedPath}`);
        return { valid: false, error: `Directory does not exist or is not accessible: ${normalizedPath}` };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Path validation error:`, error);
      return { valid: false, error: `Path validation failed: ${errorMessage}` };
    }
  }

  /**
   * Amazon Q CLIの存在と可用性をチェック
   */
  /**
   * CLIパスが安全かどうかを検証
   */
  private isValidCLIPath(path: string): boolean {
    // 空文字列や未定義をチェック
    if (!path || typeof path !== 'string') {
      return false;
    }

    // 許可されたパスパターンのみ実行を許可
    const allowedPatterns = [
      /^q$/,                                    // PATH内の'q'コマンド
      /^\/usr\/local\/bin\/q$/,                // 標準的なインストール場所
      /^\/opt\/homebrew\/bin\/q$/,             // Apple Silicon Mac
      /^\/home\/[a-zA-Z0-9_-]+\/\.local\/bin\/q$/,  // ユーザーローカル
      new RegExp(`^${process.env.HOME?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\.local/bin/q$`) // ホームディレクトリ
    ].filter(Boolean);

    const isAllowed = allowedPatterns.some(pattern => pattern.test(path));
    
    // 危険な文字列をチェック
    const dangerousChars = [';', '&', '|', '`', '$', '(', ')', '{', '}', '[', ']', '<', '>', '"', "'"];
    const hasDangerousChars = dangerousChars.some(char => path.includes(char));
    
    if (hasDangerousChars) {
      console.warn(`🚨 Dangerous characters detected in CLI path: ${path}`);
      return false;
    }

    return isAllowed;
  }

  /**
   * セキュアなCLI実行
   */
  private async executeSecureCLI(cliPath: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    if (!this.isValidCLIPath(cliPath)) {
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

    console.log('🔍 Checking Amazon Q CLI availability...');
    console.log(`📂 Current PATH: ${process.env.PATH?.substring(0, 200)}...`); // PATH情報を制限
    console.log(`📍 Current working directory: ${process.cwd()}`);

    // 候補パスを順番にチェック
    for (const candidate of this.CLI_CANDIDATES) {
      if (!this.isValidCLIPath(candidate)) {
        console.log(`🚨 Skipping invalid CLI path: ${candidate}`);
        continue;
      }

      try {
        console.log(`🔍 Trying CLI candidate: ${candidate}`);
        const { stdout, stderr } = await this.executeSecureCLI(candidate, ['--version']);
        
        if (stdout && (stdout.includes('q') || stdout.includes('amazon') || stdout.includes('version'))) {
          console.log(`✅ Found Amazon Q CLI at: ${candidate}`);
          console.log(`📋 Version output: ${stdout.trim().substring(0, 200)}`); // 出力を制限
          this.cliPath = candidate;
          this.cliChecked = true;
          return { available: true, path: candidate };
        }
      } catch (error) {
        console.log(`❌ CLI candidate ${candidate} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    // セキュアなwhichコマンド実行
    try {
      console.log('🔍 Trying with "which q" command...');
      const { stdout } = await this.execAsync('which q', { timeout: 5000 });
      if (stdout.trim()) {
        const path = stdout.trim();
        // whichの結果も検証
        if (this.isValidCLIPath(path)) {
          console.log(`✅ Found Amazon Q CLI via which: ${path}`);
          this.cliPath = path;
          this.cliChecked = true;
          return { available: true, path };
        } else {
          console.warn(`🚨 which command returned invalid path: ${path}`);
        }
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
      // プロジェクトパスの検証
      const pathValidation = await this.validateProjectPath(options.workingDir);
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
      console.log(`🚀 Starting Amazon Q CLI session with command: ${cliCommand}`);
      console.log(`📂 Working directory: ${validatedWorkingDir}`);

      // コマンドライン引数を構築
      const args = this.buildCommandArgs(command, options);
      console.log(`📋 CLI arguments: ${args.join(' ')}`);
      
      // プロセスを起動
      const childProcess = spawn(cliCommand, args, {
        cwd: validatedWorkingDir,
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
        workingDir: validatedWorkingDir,
        startTime: Date.now(),
        status: 'starting',
        lastActivity: Date.now(),
        pid: childProcess.pid,
        command,
        options,
        outputBuffer: '',
        errorBuffer: '',
        bufferFlushCount: 0
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
    if (!session || !['starting', 'running'].includes(session.status)) {
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

    // 標準出力の処理（バッファリング付き）
    process.stdout?.on('data', (data: Buffer) => {
      session.lastActivity = Date.now();
      const rawOutput = data.toString();
      
      // ANSIエスケープシーケンスを除去
      const cleanOutput = this.stripAnsiCodes(rawOutput);
      
      // Amazon Q CLIの初期化メッセージや空の出力をフィルタリング
      if (this.shouldSkipOutput(cleanOutput)) {
        return;
      }
      
      // バッファサイズ制限チェック
      if (session.outputBuffer.length > this.MAX_BUFFER_SIZE) {
        // バッファが大きすぎる場合は後半を保持
        session.outputBuffer = session.outputBuffer.slice(-this.MAX_BUFFER_SIZE / 2);
      }
      
      // バッファに追加
      session.outputBuffer += cleanOutput;
      
      // 既存のタイムアウトをクリア
      if (session.bufferTimeout) {
        clearTimeout(session.bufferTimeout);
      }
      
      // 適応的タイムアウトを設定（コンテンツ長に基づく）
      const adaptiveTimeout = this.getAdaptiveBufferTimeout(session.outputBuffer);
      session.bufferTimeout = setTimeout(() => {
        this.flushOutputBuffer(session);
      }, adaptiveTimeout);
      
      // 改行文字がある場合は即座にフラッシュ
      if (session.outputBuffer.includes('\n')) {
        if (session.bufferTimeout) {
          clearTimeout(session.bufferTimeout);
          session.bufferTimeout = undefined;
        }
        this.flushOutputBuffer(session);
      }
    });

    // 標準エラー出力の処理（バッファリング付き）
    process.stderr?.on('data', (data: Buffer) => {
      session.lastActivity = Date.now();
      const rawError = data.toString();
      
      // ANSIエスケープシーケンスを除去
      const cleanError = this.stripAnsiCodes(rawError);
      
      // Amazon Q CLIの初期化メッセージや空のエラーをフィルタリング
      if (this.shouldSkipError(cleanError)) {
        return;
      }
      
      // エラーはバッファせず即座に送信
      const errorEvent: QErrorEvent = {
        sessionId,
        error: cleanError,
        code: 'STDERR'
      };
      
      this.emit('q:error', errorEvent);
    });

    // プロセス終了の処理
    process.on('exit', (code: number | null, signal: string | null) => {
      // 残りのバッファをフラッシュ
      if (session.outputBuffer.trim()) {
        this.flushOutputBuffer(session);
      }
      
      // タイムアウトをクリア
      if (session.bufferTimeout) {
        clearTimeout(session.bufferTimeout);
        session.bufferTimeout = undefined;
      }
      
      session.status = code === 0 ? 'completed' : 'error';
      
      const completeEvent: QCompleteEvent = {
        sessionId,
        exitCode: code || -1
      };
      
      this.emit('q:complete', completeEvent);
      
      // セッションを即座に無効化してID衝突を防ぐ
      session.status = 'terminated';
      
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
      this.destroy();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    process.on('uncaughtException', cleanup);
    process.on('unhandledRejection', cleanup);

    // 非アクティブセッションの定期クリーンアップ
    this.cleanupInterval = setInterval(() => {
      if (!this.isDestroyed) {
        this.cleanupInactiveSessions();
      }
    }, 60000); // 1分毎
  }

  private startResourceMonitoring(): void {
    // 定期的なリソース監視
    this.resourceMonitorInterval = setInterval(() => {
      if (!this.isDestroyed) {
        this.updateAllSessionResources();
      }
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
    if (this.resourceMonitorInterval) {
      clearInterval(this.resourceMonitorInterval);
      this.resourceMonitorInterval = undefined;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // EventEmitterのリスナーをすべて削除
    this.removeAllListeners();

    // セッションマップをクリア
    this.sessions.clear();

    console.log('AmazonQCLIService destroyed and resources cleaned up');
  }

  /**
   * ANSIエスケープシーケンス、スピナー、その他の制御文字を除去
   */
  private stripAnsiCodes(text: string): string {
    let cleanText = text;
    
    // 1. ANSIエスケープシーケンスを除去
    // より包括的なパターンでANSIコードをマッチ
    const ansiRegex = /\x1b\[[0-9;]*[a-zA-Z]/g;
    cleanText = cleanText.replace(ansiRegex, '');
    
    // 2. カーソル保存・復元シーケンスを除去 (\x1B7, \x1B8)
    const cursorSaveRestoreRegex = /\x1b[78]/g;
    cleanText = cleanText.replace(cursorSaveRestoreRegex, '');
    
    // 3. その他の単文字ANSIエスケープシーケンス
    const singleCharAnsiRegex = /\x1b[DMH]/g;
    cleanText = cleanText.replace(singleCharAnsiRegex, '');
    
    // 4. スピナー文字を除去 (ユニコードスピナー)
    const spinnerRegex = /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g;
    cleanText = cleanText.replace(spinnerRegex, '');
    
    // 5. カーソル制御文字を除去
    const cursorRegex = /\x1b\[\?25[lh]/g;
    cleanText = cleanText.replace(cursorRegex, '');
    
    // 6. バックスペースとカリッジリターンを正規化
    cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 7. 余分な空白を正規化
    cleanText = cleanText.replace(/[ \t]+/g, ' ');
    
    return cleanText;
  }

  /**
   * バッファされた出力をフラッシュ
   */
  private flushOutputBuffer(session: QProcessSession): void {
    if (!session.outputBuffer.trim()) {
      return;
    }

    const responseEvent: QResponseEvent = {
      sessionId: session.sessionId,
      data: session.outputBuffer,
      type: 'stream'
    };
    
    this.emit('q:response', responseEvent);
    
    // バッファをクリア
    session.outputBuffer = '';
    
    // タイムアウトをクリア
    if (session.bufferTimeout) {
      clearTimeout(session.bufferTimeout);
      session.bufferTimeout = undefined;
    }
  }

  /**
   * 出力をスキップすべきか判定
   */
  private shouldSkipOutput(output: string): boolean {
    const trimmed = output.trim();
    
    // 空の出力
    if (!trimmed) {
      return true;
    }
    
    // Amazon Q CLIの初期化メッセージをスキップ
    const skipPatterns = [
      /^\s*$/,                                    // 空白のみ
      /^\s*[\.•●]\s*$/,                      // ドットやブレットのみ
      /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*$/, // スピナー文字のみ
      /^\s*[\x00-\x1f]\s*$/,                     // 制御文字のみ
    ];
    
    return skipPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * エラーをスキップすべきか判定
   */
  private shouldSkipError(error: string): boolean {
    const trimmed = error.trim();
    
    // 空のエラー
    if (!trimmed) {
      return true;
    }
    
    // Amazon Q CLIの初期化メッセージや情報メッセージをスキップ
    const skipPatterns = [
      /^\s*$/,                                           // 空白のみ
      /^\s*[\x00-\x1f]\s*$/,                            // 制御文字のみ
      /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*$/, // スピナー文字のみ
      /mcp servers? initialized/i,                       // MCPサーバー初期化メッセージ
      /ctrl-c to start chatting/i,                       // チャット開始指示
      /press.*enter.*continue/i,                         // Enterキー指示
      /loading|initializing/i,                           // ローディングメッセージ
    ];
    
    return skipPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * 適応的バッファタイムアウトを計算
   */
  private getAdaptiveBufferTimeout(buffer: string): number {
    const baseTimeout = 100;
    const maxTimeout = 300;
    const contentLength = buffer.length;
    
    // コンテンツ長に基づいてタイムアウトを調整
    if (contentLength > 1000) {
      return Math.min(maxTimeout, baseTimeout * 2);
    } else if (contentLength > 500) {
      return baseTimeout * 1.5;
    }
    
    return baseTimeout;
  }
}
import { spawn, ChildProcess, exec } from 'child_process';
import { EventEmitter } from 'events';
import { promisify } from 'util';
import { access, stat } from 'fs/promises';
import { resolve, normalize, isAbsolute } from 'path';
import type { 
  QCommandEvent, 
  QResponseEvent, 
  QErrorEvent, 
  QInfoEvent,
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
  // 行ベースバッファリング用
  incompleteOutputLine: string;
  incompleteErrorLine: string;
  // 重複メッセージ防止用
  lastInfoMessage: string;
  lastInfoMessageTime: number;
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
        bufferFlushCount: 0,
        incompleteOutputLine: '',
        incompleteErrorLine: '',
        lastInfoMessage: '',
        lastInfoMessageTime: 0
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

    // 標準出力の処理（行ベースバッファリング）
    process.stdout?.on('data', (data: Buffer) => {
      session.lastActivity = Date.now();
      const rawOutput = data.toString();
      
      // 前回の不完全な行と結合
      const fullText = session.incompleteOutputLine + rawOutput;
      
      // 行単位で分割
      const lines = fullText.split('\n');
      
      // 最後の要素は不完全な行の可能性があるため、次回に回す
      session.incompleteOutputLine = lines.pop() || '';
      
      // 完全な行のみを処理
      for (const line of lines) {
        const cleanLine = this.stripAnsiCodes(line);
        
        // 空の行や無意味な行をスキップ
        if (this.shouldSkipOutput(cleanLine)) {
          continue;
        }
        
        // 直接レスポンスイベントを発行（行ベース）
        const responseEvent: QResponseEvent = {
          sessionId: session.sessionId,
          data: cleanLine + '\n', // 改行を復元
          type: 'stream'
        };
        
        this.emit('q:response', responseEvent);
      }
      
      // 不完全な行がある場合は短時間でタイムアウト処理
      if (session.incompleteOutputLine.trim()) {
        if (session.bufferTimeout) {
          clearTimeout(session.bufferTimeout);
        }
        
        session.bufferTimeout = setTimeout(() => {
          this.flushIncompleteOutputLine(session);
        }, 200); // 200ms後にフラッシュ
      }
    });

    // 標準エラー出力の処理（行ベース分類付き）
    process.stderr?.on('data', (data: Buffer) => {
      session.lastActivity = Date.now();
      const rawError = data.toString();
      
      // 前回の不完全な行と結合
      const fullText = session.incompleteErrorLine + rawError;
      
      // 行単位で分割
      const lines = fullText.split('\n');
      
      // 最後の要素は不完全な行の可能性があるため、次回に回す
      session.incompleteErrorLine = lines.pop() || '';
      
      // 完全な行のみを処理
      for (const line of lines) {
        const cleanLine = this.stripAnsiCodes(line);
        
        // メッセージを分類
        const messageType = this.classifyStderrMessage(cleanLine);
        
        if (messageType === 'skip') {
          continue;
        }
        
        if (messageType === 'info') {
          // 重複メッセージチェック
          if (this.shouldSkipDuplicateInfo(session, cleanLine)) {
            continue;
          }
          
          // 情報メッセージとしてq:infoイベントを発行
          const infoEvent: QInfoEvent = {
            sessionId,
            message: cleanLine,
            type: this.getInfoMessageType(cleanLine)
          };
          
          this.emit('q:info', infoEvent);
        } else if (messageType === 'error') {
          // エラーメッセージとしてq:errorイベントを発行
          const errorEvent: QErrorEvent = {
            sessionId,
            error: cleanLine,
            code: 'STDERR'
          };
          
          this.emit('q:error', errorEvent);
        }
      }
      
      // 不完全なエラー行がある場合は短時間でタイムアウト処理
      if (session.incompleteErrorLine.trim()) {
        setTimeout(() => {
          this.flushIncompleteErrorLine(session);
        }, 200); // 200ms後にフラッシュ
      }
    });

    // プロセス終了の処理
    process.on('exit', (code: number | null, signal: string | null) => {
      // 残りの不完全な行をフラッシュ
      if (session.incompleteOutputLine.trim()) {
        this.flushIncompleteOutputLine(session);
      }
      if (session.incompleteErrorLine.trim()) {
        this.flushIncompleteErrorLine(session);
      }
      
      // 残りのバッファをフラッシュ（後方互換性のため）
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
    
    // 1. 包括的なANSIエスケープシーケンスを除去
    // ESC[ で始まる制御シーケンス（CSI）
    cleanText = cleanText.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    
    // ESC] で始まるOSCシーケンス（Operating System Command）
    cleanText = cleanText.replace(/\x1b\][^\x07]*\x07/g, '');
    cleanText = cleanText.replace(/\x1b\][^\x1b]*\x1b\\/g, '');
    
    // ESC( で始まる文字集合選択シーケンス
    cleanText = cleanText.replace(/\x1b\([AB0]/g, '');
    
    // プライベートモード設定/リセット（DEC Private Mode）
    cleanText = cleanText.replace(/\x1b\[\?[0-9]+[hl]/g, '');
    
    // 8ビット制御文字（C1 control characters）
    cleanText = cleanText.replace(/[\x80-\x9F]/g, '');
    
    // その他のエスケープシーケンス
    cleanText = cleanText.replace(/\x1b[NOPVWXYZ\\^_]/g, '');
    cleanText = cleanText.replace(/\x1b[#()*/+-]/g, '');
    
    // 2. スピナー文字を除去（より包括的）
    const spinnerRegex = /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠿⠾⠽⠻⠺⠯⠟⠞⠜⠛⠚⠉⠈⠁]/g;
    cleanText = cleanText.replace(spinnerRegex, '');
    
    // 3. プログレスバー文字を除去
    cleanText = cleanText.replace(/[▁▂▃▄▅▆▇█░▒▓■□▪▫▬▭▮▯―]/g, '');
    
    // 4. その他の特殊文字
    cleanText = cleanText.replace(/[♠♣♥♦♪♫]/g, '');
    
    // 5. 制御文字を除去（改行文字は除く）
    cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // 6. 文字列の始まりや終わりにある不完全なエスケープシーケンス
    cleanText = cleanText.replace(/^\x1b.*?(?=[a-zA-Z0-9]|$)/g, '');
    cleanText = cleanText.replace(/\x1b[^a-zA-Z]*$/g, '');
    
    // 7. 数字のみの断片（"7 8"のような）を除去
    cleanText = cleanText.replace(/^\s*\d+\s*\d*\s*$/g, '');
    
    // 8. 開いた括弧のみ（"[[[" のような）を除去
    cleanText = cleanText.replace(/^\s*[\[\{]+\s*$/g, '');
    
    // 9. バックスペースとカリッジリターンを正規化
    cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 10. 余分な空白を正規化（ただし、意味のある構造は保持）
    cleanText = cleanText.replace(/[ \t]+/g, ' ');
    cleanText = cleanText.replace(/\n\s+\n/g, '\n\n');
    cleanText = cleanText.replace(/^\s+|\s+$/g, '');
    
    return cleanText;
  }

  /**
   * 不完全な出力行をフラッシュ
   */
  private flushIncompleteOutputLine(session: QProcessSession): void {
    if (!session.incompleteOutputLine.trim()) {
      return;
    }
    
    const cleanLine = this.stripAnsiCodes(session.incompleteOutputLine);
    
    // 無意味な行はスキップ
    if (!this.shouldSkipOutput(cleanLine)) {
      const responseEvent: QResponseEvent = {
        sessionId: session.sessionId,
        data: cleanLine,
        type: 'stream'
      };
      
      this.emit('q:response', responseEvent);
    }
    
    // 不完全な行をクリア
    session.incompleteOutputLine = '';
  }

  /**
   * 不完全なエラー行をフラッシュ
   */
  private flushIncompleteErrorLine(session: QProcessSession): void {
    if (!session.incompleteErrorLine.trim()) {
      return;
    }
    
    const cleanLine = this.stripAnsiCodes(session.incompleteErrorLine);
    const messageType = this.classifyStderrMessage(cleanLine);
    
    if (messageType === 'info') {
      // 重複メッセージチェック
      if (!this.shouldSkipDuplicateInfo(session, cleanLine)) {
        const infoEvent: QInfoEvent = {
          sessionId: session.sessionId,
          message: cleanLine,
          type: this.getInfoMessageType(cleanLine)
        };
        
        this.emit('q:info', infoEvent);
      }
    } else if (messageType === 'error') {
      const errorEvent: QErrorEvent = {
        sessionId: session.sessionId,
        error: cleanLine,
        code: 'STDERR'
      };
      
      this.emit('q:error', errorEvent);
    }
    
    // 不完全な行をクリア
    session.incompleteErrorLine = '';
  }

  /**
   * バッファされた出力をフラッシュ（後方互換性のため）
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
   * メッセージが情報メッセージかエラーメッセージかを分類
   */
  private classifyStderrMessage(message: string): 'info' | 'error' | 'skip' {
    const trimmed = message.trim();
    
    // 空のメッセージ
    if (!trimmed) {
      return 'skip';
    }
    
    // 完全にスキップすべきパターン
    const skipPatterns = [
      /^\s*$/,                                           // 空白のみ
      /^\s*[\x00-\x1f]\s*$/,                            // 制御文字のみ
      /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠿⠾⠽⠻⠺⠯⠟⠞⠜⠛⠚⠉⠈⠁]\s*$/, // スピナー文字のみ
      /^\s*\d+\s*\d*\s*$/,                              // 数字のみの断片
      /^\s*[\[\{]+\s*$/,                                // 開いた括弧のみ
      /^\s*[m\x1b]*\s*$/,                               // エスケープ文字の残骸
    ];
    
    if (skipPatterns.some(pattern => pattern.test(trimmed))) {
      return 'skip';
    }
    
    // 情報メッセージのパターン
    const infoPatterns = [
      /welcome to amazon q/i,                            // Amazon Qへようこそ
      /✓.*loaded/i,                                      // ローディング完了メッセージ
      /github loaded/i,                                  // GitHubローディング
      /mcp servers? initialized/i,                       // MCPサーバー初期化
      /ctrl[\s-]?[cj]/i,                                // キーボードショートカット案内
      /press.*enter/i,                                   // Enterキー指示
      /loading|initializing/i,                           // ローディング/初期化
      /starting|started/i,                               // 開始メッセージ
      /ready|connected/i,                                // 準備完了メッセージ
      /you are chatting with/i,                          // チャットモード案内
      /if you want to file an issue/i,                   // フィードバック案内
      /.*help.*commands?/i,                              // ヘルプ案内
      /ctrl.*new.*lines?/i,                              // ショートカット案内
      /fuzzy search/i,                                   // 検索機能案内
      /^\/\w+/,                                          // コマンド案内（/helpなど）
      /of \d+/,                                          // プログレス表示（"1 of 2"など）
      /\d+\.\d+\s*s$/,                                   // 時間表示（"0.26 s"など）
      /^thinking\.?\.?\.?$/i,                            // Thinkingメッセージ
    ];
    
    if (infoPatterns.some(pattern => pattern.test(trimmed))) {
      return 'info';
    }
    
    // 明確なエラーパターン
    const errorPatterns = [
      /error(?!.*loaded)/i,                              // Error（ただしloadedは除く）
      /failed/i,                                         // Failed
      /exception/i,                                      // Exception
      /cannot|can't/i,                                   // Cannot/Can't
      /unable to/i,                                      // Unable to
      /permission denied/i,                              // Permission denied
      /access denied/i,                                  // Access denied
      /not found/i,                                      // Not found
      /invalid/i,                                        // Invalid
      /timeout/i,                                        // Timeout
      /connection.*(?:refused|reset|lost)/i,             // Connection issues
    ];
    
    if (errorPatterns.some(pattern => pattern.test(trimmed))) {
      return 'error';
    }
    
    // デフォルトでは情報メッセージとして扱う
    // Amazon Q CLIは多くの情報をstderrに出力するため
    return 'info';
  }

  /**
   * 情報メッセージのタイプを決定
   */
  private getInfoMessageType(message: string): 'initialization' | 'status' | 'progress' | 'general' {
    const trimmed = message.trim().toLowerCase();
    
    if (trimmed.includes('welcome') || trimmed.includes('initialized') || trimmed.includes('starting')) {
      return 'initialization';
    }
    
    if (trimmed.includes('loaded') || trimmed.includes('ready') || trimmed.includes('connected')) {
      return 'status';
    }
    
    if (/\d+\s*of\s*\d+/.test(trimmed) || /\d+\.\d+\s*s/.test(trimmed) || trimmed.includes('progress')) {
      return 'progress';
    }
    
    if (trimmed === 'thinking' || trimmed === 'thinking...') {
      return 'progress';
    }
    
    return 'general';
  }

  /**
   * 重複する情報メッセージをチェック
   */
  private shouldSkipDuplicateInfo(session: QProcessSession, message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    const now = Date.now();
    
    // "thinking"メッセージの特別処理
    if (trimmed === 'thinking' || trimmed === 'thinking...') {
      // 5秒以内の同じメッセージは重複とみなす
      if (session.lastInfoMessage === trimmed && (now - session.lastInfoMessageTime) < 5000) {
        return true;
      }
      // 初回または5秒以上経過していれば表示
      session.lastInfoMessage = trimmed;
      session.lastInfoMessageTime = now;
      return false;
    }
    
    // その他の繰り返しやすいメッセージの処理
    const duplicatePatterns = [
      /^loading/,
      /^initializing/,
      /^connecting/,
      /^processing/,
      /^please wait/
    ];
    
    if (duplicatePatterns.some(pattern => pattern.test(trimmed))) {
      // 3秒以内の同じメッセージは重複とみなす
      if (session.lastInfoMessage === trimmed && (now - session.lastInfoMessageTime) < 3000) {
        return true;
      }
      session.lastInfoMessage = trimmed;
      session.lastInfoMessageTime = now;
      return false;
    }
    
    // 通常のメッセージは重複チェックしない
    return false;
  }


}
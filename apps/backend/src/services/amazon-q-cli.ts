import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { 
  QCommandEvent, 
  QResponseEvent, 
  QErrorEvent, 
  QInfoEvent,
  QCompleteEvent 
} from '@quincy/shared';
import type {
  QProcessSession,
  QProcessOptions,
  CLICheckResult,
  PathValidationResult,
  SessionStats,
  MessageType,
  InfoMessageType
} from './amazon-q-cli/types';
import { stripAnsiCodes } from './amazon-q-cli/ansi-stripper';
import { validateProjectPath } from './amazon-q-cli/path-validator';
import { CLIDetector } from './amazon-q-cli/cli-detector';
import { SessionManager } from './amazon-q-cli/session-manager';
import { OutputProcessor } from './amazon-q-cli/output-processor';
import { MessageClassifier } from './amazon-q-cli/message-classifier';
import { ProcessManager } from './amazon-q-cli/process-manager';

// Re-export types for backward compatibility
export type {
  QProcessSession,
  QProcessOptions,
  CLICheckResult,
  PathValidationResult,
  SessionStats,
  MessageType,
  InfoMessageType
} from './amazon-q-cli/types';

export class AmazonQCLIService extends EventEmitter {
  private readonly sessionManager = new SessionManager();
  private readonly DEFAULT_TIMEOUT = 0; // タイムアウト無効化（0 = 無期限）
  private readonly MAX_BUFFER_SIZE = 10 * 1024; // 10KB制限
  private readonly cliDetector = new CLIDetector();
  private readonly outputProcessor = new OutputProcessor();
  private readonly messageClassifier = new MessageClassifier();
  private readonly processManager = new ProcessManager();
  
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
   * Amazon Q CLIの存在と可用性をチェック
   */
  async checkCLIAvailability(): Promise<CLICheckResult> {
    return this.cliDetector.checkCLIAvailability();
  }

  /**
   * Amazon Q CLIプロセスを起動
   */
  async startSession(command: string, options: QProcessOptions): Promise<string> {
    const sessionId = this.sessionManager.generateSessionId();
    
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

      const cliCommand = cliCheck.path || this.cliDetector.getCLICommand();
      console.log(`🚀 Starting Amazon Q CLI session with command: ${cliCommand}`);
      console.log(`📂 Working directory: ${validatedWorkingDir}`);
      if (options.resume) {
        console.log('🔄 Resume mode: Restoring previous conversation');
      }

      // コマンドライン引数を構築
      const args = this.processManager.buildCommandArgs(command, options);
      
      // プロセスを起動
      const childProcess = this.processManager.spawnProcess(cliCommand, args, validatedWorkingDir);

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
        lastInfoMessageTime: 0,
        isThinkingActive: false,
        lastThinkingTime: 0,
        initializationBuffer: [],
        initializationPhase: true,
        initializationTimeout: undefined
      };

      this.sessionManager.addSession(session);
      this.setupProcessHandlers(session);
      
      // タイムアウト設定
      if (options.timeout !== undefined || this.DEFAULT_TIMEOUT > 0) {
        const timeout = options.timeout || this.DEFAULT_TIMEOUT;
        setTimeout(() => {
          if (this.sessionManager.hasSession(sessionId)) {
            this.abortSession(sessionId, 'timeout');
          }
        }, timeout);
      }

      // プロセス起動の確認
      await this.processManager.waitForProcessStart(childProcess);
      session.status = 'running';

      return sessionId;
    } catch (error) {
      this.sessionManager.deleteSession(sessionId);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to start Amazon Q CLI: ${errorMessage}`);
    }
  }

  /**
   * セッションを強制終了
   */
  async abortSession(sessionId: string, reason: string = 'user_request'): Promise<boolean> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      return false;
    }

    try {
      session.status = 'aborted';
      
      // プロセスを強制終了
      this.processManager.killProcess(session.process);

      // Thinking状態をリセット
      session.isThinkingActive = false;
      
      // 終了イベントを発行
      this.emit('session:aborted', {
        sessionId,
        reason,
        exitCode: 0 // 正常な中止として扱う
      });

      // セッションを遅延削除（プロセス完全終了を待つ）
      setTimeout(() => {
        this.sessionManager.deleteSession(sessionId);
      }, 3000);

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
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return false;
    }

    if (!['starting', 'running'].includes(session.status)) {
      console.error(`Session ${sessionId} is not active. Status: ${session.status}`);
      return false;
    }

    try {
      const success = this.processManager.sendInput(session.process, input);
      if (success) {
        session.lastActivity = Date.now();
      }
      return success;
    } catch (error) {
      console.error(`Failed to send input to session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * アクティブなセッション一覧を取得
   */
  getActiveSessions(): QProcessSession[] {
    return this.sessionManager.getActiveSessions();
  }

  /**
   * 指定セッションの情報を取得
   */
  getSession(sessionId: string): QProcessSession | undefined {
    return this.sessionManager.getSession(sessionId);
  }

  /**
   * 全セッションを終了
   */
  async terminateAllSessions(): Promise<void> {
    const allSessions = this.sessionManager.getAllSessions();
    const terminations = allSessions.map(session => 
      this.abortSession(session.sessionId, 'shutdown')
    );
    
    await Promise.allSettled(terminations);
  }

  /**
   * セッションのリソース使用量を更新
   */
  async updateSessionResources(sessionId: string): Promise<void> {
    return this.sessionManager.updateSessionResources(sessionId);
  }

  /**
   * セッションの実行時間を取得
   */
  getSessionRuntime(sessionId: string): number {
    return this.sessionManager.getSessionRuntime(sessionId);
  }

  /**
   * セッションの詳細統計を取得
   */
  getSessionStats(sessionId: string): SessionStats | null {
    const session = this.sessionManager.getSession(sessionId);
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
        const cleanLine = stripAnsiCodes(line);
        
        // 空の行や無意味な行をスキップ
        if (this.shouldSkipOutput(cleanLine)) {
          continue;
        }
        
        // 初期化フェーズで初期化メッセージはスキップ（stderrで処理）
        if (session.initializationPhase && this.isInitializationMessage(cleanLine)) {
          continue;
        }
        
        // 「Thinking」メッセージの特別処理
        if (this.isThinkingMessage(cleanLine)) {
          if (this.shouldSkipThinking(session)) {
            continue;
          }
          // Thinking状態を更新
          this.updateThinkingState(session);
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
        const cleanLine = stripAnsiCodes(line);
        
        // メッセージを分類
        const messageType = this.classifyStderrMessage(cleanLine);
        
        if (messageType === 'skip') {
          continue;
        }
        
        if (messageType === 'info') {
          // 初期化フェーズの処理
          if (session.initializationPhase && this.isInitializationMessage(cleanLine)) {
            this.addToInitializationBuffer(session, cleanLine);
            continue;
          }
          
          // Thinkingメッセージの特別処理
          if (this.isThinkingMessage(cleanLine)) {
            if (this.shouldSkipThinking(session)) {
              continue;
            }
            this.updateThinkingState(session);
          } else {
            // 通常の重複メッセージチェック
            if (this.shouldSkipDuplicateInfo(session, cleanLine)) {
              continue;
            }
          }
          
          // 情報メッセージとしてq:infoイベントを発行
          const infoEvent: QInfoEvent = {
            sessionId,
            message: cleanLine,
            type: this.outputProcessor.getInfoMessageType(cleanLine)
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
      // 残りの初期化バッファをフラッシュ
      if (session.initializationPhase && session.initializationBuffer.length > 0) {
        this.flushInitializationBuffer(session);
      }
      
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
      
      // 初期化タイムアウトをクリア
      if (session.initializationTimeout) {
        clearTimeout(session.initializationTimeout);
        session.initializationTimeout = undefined;
      }
      
      session.status = code === 0 ? 'completed' : 'error';
      
      const completeEvent: QCompleteEvent = {
        sessionId,
        exitCode: code || -1
      };
      
      this.emit('q:complete', completeEvent);
      
      // セッションを即座に無効化してID衝突を防ぐ
      this.sessionManager.invalidateSession(sessionId);
      
      // Thinking状態をリセット
      session.isThinkingActive = false;
      
      console.log(`Exit code: ${code}, Signal: ${signal}`);
      
      // セッションをクリーンアップ（遅延実行）
      setTimeout(() => {
        this.sessionManager.deleteSession(sessionId);
      }, 10000); // 10秒に延長
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
    // 時間ベースのセッション終了を無効化（ユーザー要求により）
    // セッションは手動での終了またはプロセス終了時のみクリーンアップされます
    console.log('⏰ Session timeout disabled - sessions will persist until manually closed');
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
    this.sessionManager.clear();

    console.log('AmazonQCLIService destroyed and resources cleaned up');
  }


  /**
   * 不完全な出力行をフラッシュ
   */
  private flushIncompleteOutputLine(session: QProcessSession): void {
    if (!session.incompleteOutputLine.trim()) {
      return;
    }
    
    const cleanLine = stripAnsiCodes(session.incompleteOutputLine);
    
    // 無意味な行はスキップ
    if (!this.shouldSkipOutput(cleanLine)) {
      // 初期化フェーズで初期化メッセージはスキップ
      if (session.initializationPhase && this.isInitializationMessage(cleanLine)) {
        session.incompleteOutputLine = '';
        return;
      }
      
      // Thinkingメッセージの重複チェック
      if (this.isThinkingMessage(cleanLine) && this.shouldSkipThinking(session)) {
        // 不完全な行をクリア
        session.incompleteOutputLine = '';
        return;
      }
      
      if (this.isThinkingMessage(cleanLine)) {
        this.updateThinkingState(session);
      }
      
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
    
    const cleanLine = stripAnsiCodes(session.incompleteErrorLine);
    const messageType = this.classifyStderrMessage(cleanLine);
    
    if (messageType === 'info') {
      // 初期化フェーズの処理
      if (session.initializationPhase && this.isInitializationMessage(cleanLine)) {
        this.addToInitializationBuffer(session, cleanLine);
        // 不完全な行をクリア
        session.incompleteErrorLine = '';
        return;
      }
      
      // Thinkingメッセージの特別処理
      if (this.isThinkingMessage(cleanLine)) {
        if (!this.shouldSkipThinking(session)) {
          this.updateThinkingState(session);
          
          const infoEvent: QInfoEvent = {
            sessionId: session.sessionId,
            message: cleanLine,
            type: this.getInfoMessageType(cleanLine)
          };
          
          this.emit('q:info', infoEvent);
        }
      } else {
        // 通常の重複メッセージチェック
        if (!this.shouldSkipDuplicateInfo(session, cleanLine)) {
          const infoEvent: QInfoEvent = {
            sessionId: session.sessionId,
            message: cleanLine,
            type: this.getInfoMessageType(cleanLine)
          };
          
          this.emit('q:info', infoEvent);
        }
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
  private classifyStderrMessage(message: string): MessageType {
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
  private getInfoMessageType(message: string): InfoMessageType {
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
   * メッセージがThinkingかどうかを判定
   */
  private isThinkingMessage(message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    return trimmed === 'thinking' || trimmed === 'thinking...' || 
           trimmed === 'thinking....' || /^thinking\.{0,4}$/i.test(trimmed);
  }

  /**
   * 初期化メッセージかどうかを判定
   */
  private isInitializationMessage(message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    
    const initPatterns = [
      /mcp servers? initialized/i,
      /ctrl-c to start chatting/i,
      /✓.*loaded in.*s$/i,
      /welcome to amazon q/i,
      /you can resume.*conversation/i,
      /q chat --resume/i,
      /\/help.*commands/i,
      /ctrl.*new.*lines/i,
      /ctrl.*fuzzy.*search/i,
      /you are chatting with/i,
      /to exit.*cli.*press/i
    ];
    
    return initPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * 初期化フェーズが完了したかチェック
   */
  private isInitializationComplete(message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    
    // "You are chatting with" メッセージが最後の初期化メッセージ
    return /you are chatting with/i.test(trimmed) || 
           /to exit.*cli.*press/i.test(trimmed);
  }

  /**
   * Thinkingメッセージをスキップすべきかチェック
   */
  private shouldSkipThinking(session: QProcessSession): boolean {
    // 既にThinking状態がアクティブの場合は常にスキップ（1回のみ表示）
    return session.isThinkingActive;
  }

  /**
   * Thinking状態を更新
   */
  private updateThinkingState(session: QProcessSession): void {
    session.isThinkingActive = true;
    session.lastThinkingTime = Date.now();
    
    // Thinking状態はセッション終了まで維持（1回のみ表示のため）
  }

  /**
   * 初期化メッセージをバッファに追加
   */
  private addToInitializationBuffer(session: QProcessSession, message: string): void {
    if (!session.initializationPhase) {
      return; // 初期化フェーズでない場合はスキップ
    }
    
    // 初期化中もアクティビティを更新
    session.lastActivity = Date.now();
    session.initializationBuffer.push(message);
    
    // 初期化完了をチェック
    if (this.isInitializationComplete(message)) {
      // 1秒後に初期化バッファをフラッシュ（遅延メッセージを待つため）
      if (session.initializationTimeout) {
        clearTimeout(session.initializationTimeout);
      }
      
      session.initializationTimeout = setTimeout(() => {
        this.flushInitializationBuffer(session);
      }, 1000);
    } else {
      // 通常のタイムアウト（15秒に延長）
      if (session.initializationTimeout) {
        clearTimeout(session.initializationTimeout);
      }
      
      session.initializationTimeout = setTimeout(() => {
        this.flushInitializationBuffer(session);
      }, 15000); // 15秒に延長
    }
  }

  /**
   * 初期化バッファをフラッシュして統合メッセージを送信
   */
  private flushInitializationBuffer(session: QProcessSession): void {
    if (session.initializationBuffer.length === 0 || !session.initializationPhase) {
      return;
    }
    
    // 初期化フェーズを終了（重複防止）
    session.initializationPhase = false;
    
    // メッセージを整理・統合
    const combinedMessage = this.combineInitializationMessages(session.initializationBuffer);
    
    // 統合メッセージを送信
    const infoEvent: QInfoEvent = {
      sessionId: session.sessionId,
      message: combinedMessage,
      type: 'initialization'
    };
    
    this.emit('q:info', infoEvent);
    
    // バッファをクリア
    session.initializationBuffer = [];
    
    // タイムアウトをクリア
    if (session.initializationTimeout) {
      clearTimeout(session.initializationTimeout);
      session.initializationTimeout = undefined;
    }
  }

  /**
   * 初期化メッセージを統合
   */
  private combineInitializationMessages(messages: string[]): string {
    const lines: string[] = [];
    const loadedServices: string[] = [];
    let mcpStatus = '';
    let welcomeMessage = '';
    let helpInfo: string[] = [];
    
    for (const message of messages) {
      const trimmed = message.trim();
      
      if (/✓.*loaded in.*s$/i.test(trimmed)) {
        // ロードされたサービスを抽出
        const match = trimmed.match(/✓\s*(.+?)\s+loaded/i);
        if (match) {
          loadedServices.push(match[1]);
        }
      } else if (/mcp servers? initialized/i.test(trimmed)) {
        // 最後のMCPステータスを保持
        if (trimmed.includes('✓ 2 of 2') || trimmed.includes('initialized.')) {
          mcpStatus = 'MCP servers initialized successfully';
        }
      } else if (/welcome to amazon q/i.test(trimmed)) {
        welcomeMessage = trimmed;
      } else if (/\/help|ctrl|you are chatting with|resume.*conversation/i.test(trimmed)) {
        helpInfo.push(trimmed);
      }
    }
    
    // 統合メッセージを構築
    if (welcomeMessage) {
      lines.push(welcomeMessage);
    }
    
    if (mcpStatus) {
      lines.push(mcpStatus);
    }
    
    if (loadedServices.length > 0) {
      lines.push(`Loaded services: ${loadedServices.join(', ')}`);
    }
    
    if (helpInfo.length > 0) {
      lines.push(''); // 空行
      lines.push('Available commands:');
      helpInfo.forEach(info => {
        if (!info.includes('You are chatting with')) {
          lines.push(`• ${info}`);
        }
      });
      
      // "You are chatting with" メッセージは最後に
      const modelInfo = helpInfo.find(info => info.includes('You are chatting with'));
      if (modelInfo) {
        lines.push('');
        lines.push(modelInfo);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * 重複する情報メッセージをチェック（Thinking以外用）
   */
  private shouldSkipDuplicateInfo(session: QProcessSession, message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    const now = Date.now();
    
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
import type { QProcessSession, InfoMessageType } from './types';
import { stripAnsiCodes } from './ansi-stripper';

export class OutputProcessor {
  /**
   * 出力をスキップすべきか判定
   */
  shouldSkipOutput(output: string): boolean {
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
   * メッセージがThinkingかどうかを判定
   */
  isThinkingMessage(message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    return trimmed === 'thinking' || trimmed === 'thinking...' || 
           trimmed === 'thinking....' || /^thinking\.{0,4}$/i.test(trimmed);
  }

  /**
   * Thinkingメッセージをスキップすべきかチェック
   */
  shouldSkipThinking(session: QProcessSession): boolean {
    // 既にThinking状態がアクティブの場合は常にスキップ（1回のみ表示）
    return session.isThinkingActive;
  }

  /**
   * Thinking状態を更新
   */
  updateThinkingState(session: QProcessSession): void {
    session.isThinkingActive = true;
    session.lastThinkingTime = Date.now();
    
    // Thinking状態はセッション終了まで維持（1回のみ表示のため）
  }

  /**
   * 初期化メッセージかどうかを判定
   */
  isInitializationMessage(message: string): boolean {
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
  isInitializationComplete(message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    
    // "You are chatting with" メッセージが最後の初期化メッセージ
    return /you are chatting with/i.test(trimmed) || 
           /to exit.*cli.*press/i.test(trimmed);
  }

  /**
   * 初期化メッセージをバッファに追加
   */
  addToInitializationBuffer(session: QProcessSession, message: string): void {
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
  flushInitializationBuffer(session: QProcessSession, emitCallback?: (message: string) => void): void {
    if (session.initializationBuffer.length === 0 || !session.initializationPhase) {
      return;
    }
    
    // 初期化フェーズを終了（重複防止）
    session.initializationPhase = false;
    
    // メッセージを整理・統合
    const combinedMessage = this.combineInitializationMessages(session.initializationBuffer);
    
    // 統合メッセージを送信
    if (emitCallback) {
      emitCallback(combinedMessage);
    }
    
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
  combineInitializationMessages(messages: string[]): string {
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
  shouldSkipDuplicateInfo(session: QProcessSession, message: string): boolean {
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

  /**
   * 情報メッセージのタイプを決定
   */
  getInfoMessageType(message: string): InfoMessageType {
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
}
import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, viewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';
import { MessageListComponent } from '../../shared/components/message-list/message-list.component';
import { MessageInputComponent } from '../../shared/components/message-input/message-input.component';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, MessageListComponent, MessageInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Chat Header -->
      <div class="border-b border-gray-200 p-4 bg-white">
        <div class="flex items-center justify-between">
          <div>
            @if (appStore.currentQSession()) {
              <h1 class="text-xl font-semibold text-gray-900">{{ getProjectName(appStore.currentQSession()!.projectPath) }}</h1>
              <p class="text-sm text-gray-500 mt-1">Amazon Q Session • {{ appStore.currentQSession()?.model || 'Default Model' }}</p>
            } @else if (appStore.currentQConversation()) {
              <h1 class="text-xl font-semibold text-gray-900">{{ getProjectName(getProjectPathFromConversation()) }}</h1>
              <p class="text-sm text-gray-500 mt-1">Amazon Q Conversation • {{ appStore.currentQConversation()?.model }}</p>
            } @else if (appStore.sessionStarting()) {
              <h1 class="text-xl font-semibold text-gray-900">Starting Amazon Q Session...</h1>
              <p class="text-sm text-gray-500 mt-1">Please wait while we start your session</p>
            } @else if (appStore.sessionError()) {
              <h1 class="text-xl font-semibold text-red-600">Session Start Failed</h1>
              <p class="text-sm text-red-500 mt-1">Failed to start Amazon Q session</p>
            } @else {
              <h1 class="text-xl font-semibold text-gray-900">Welcome to Quincy</h1>
              <p class="text-sm text-gray-500 mt-1">Select an Amazon Q project from the sidebar to view history or create a new project</p>
            }
          </div>
          
          <!-- Connection Status -->
          <div class="flex items-center gap-2 text-sm">
            <span 
              class="w-2 h-2 rounded-full transition-colors duration-200"
              [class.bg-green-500]="websocket.connected()"
              [class.bg-orange-500]="websocket.connecting()"
              [class.animate-pulse]="websocket.connecting()"
              [class.bg-red-500]="!websocket.connected() && !websocket.connecting()"
            ></span>
            <span class="text-gray-600 font-medium">
              {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 flex flex-col">
        @if (appStore.currentQSession() || isActiveChat()) {
          <!-- Active Chat Session -->
          <div class="flex-1 overflow-y-auto">
            <app-message-list></app-message-list>
          </div>
          
          <!-- Message Input -->
          @if (!isSessionDisabled()) {
            <div class="border-t border-gray-200">
              <app-message-input (messageSent)="onMessageSent($event)"></app-message-input>
            </div>
          } @else {
            <div class="border-t border-gray-200 bg-gray-50 p-4 text-center">
              <div class="max-w-md mx-auto">
                <p class="text-gray-600 text-sm mb-3">{{ getDisabledReason() }}</p>
                @if (appStore.sessionError()) {
                  <button 
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    (click)="clearSessionError()"
                  >
                    Start New Session
                  </button>
                }
              </div>
            </div>
          }
        } @else if (appStore.sessionStarting()) {
          <!-- Session Starting -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-blue-500 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Starting Amazon Q Session</h2>
              <p class="text-gray-500 mb-6 leading-relaxed">
                Please wait while we initialize your Amazon Q session...
              </p>
              <div class="text-sm text-gray-400">
                <p>🚀 Launching Amazon Q CLI</p>
                <p>🔗 Establishing connection</p>
                <p>📂 Setting up project workspace</p>
              </div>
            </div>
          </div>
        } @else if (appStore.sessionError()) {
          <!-- Session Error -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-red-600 mb-4">Session Start Failed</h2>
              <p class="text-gray-700 mb-6 leading-relaxed bg-red-50 border border-red-200 rounded-lg p-4">
                {{ appStore.sessionError() }}
              </p>
              <div class="space-y-2 text-sm text-gray-600">
                <p class="font-medium">💡 Troubleshooting Tips:</p>
                <div class="text-left bg-gray-50 rounded-lg p-4">
                  <p>1. Install Amazon Q CLI if not installed</p>
                  <p>2. Ensure 'q' command is in your PATH</p>
                  <p>3. Run 'q --version' in terminal to verify</p>
                  <p>4. Restart the application after installation</p>
                </div>
              </div>
              <button 
                class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                (click)="clearSessionError()"
              >
                Try Again
              </button>
            </div>
          </div>
        } @else if (appStore.currentQConversation()) {
          <!-- Amazon Q Conversation History (Read-Only) -->
          <div class="flex-1 overflow-y-auto">
            <div class="p-4 space-y-4">
              @if (appStore.qHistoryLoading()) {
                <div class="text-center py-8">
                  <div class="text-lg text-gray-600">Loading conversation history...</div>
                </div>
              } @else if (appStore.currentQConversation()?.transcript) {
                @for (message of appStore.currentQConversation()!.transcript; track $index; let isEven = $even) {
                  <div class="mb-4">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0">
                        @if (isEven) {
                          <!-- User Message -->
                          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                          </div>
                        } @else {
                          <!-- Amazon Q Message -->
                          <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 mb-1">
                          {{ isEven ? 'You' : 'Amazon Q' }}
                        </div>
                        <div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{{ message }}</div>
                      </div>
                    </div>
                  </div>
                }
              } @else {
                <div class="text-center text-gray-500 py-8">
                  <div class="text-lg mb-2">📭 No conversation transcript available</div>
                  <div class="text-sm">This project may not have any Amazon Q conversation history.</div>
                </div>
              }
            </div>
          </div>
          
          <!-- Resume Session Button -->
          <div class="border-t border-gray-200 bg-gray-50 p-4 text-center">
            <button 
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              (click)="resumeSession()"
            >
              Resume Session to Continue Chat
            </button>
          </div>
        } @else {
          <!-- Welcome/Empty State -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">View Amazon Q History</h2>
              <p class="text-gray-500 mb-6 leading-relaxed">
                Select an Amazon Q project from the sidebar to view conversation history and see your past interactions with Amazon Q.
              </p>
              <div class="space-y-2 text-sm text-gray-400">
                <p>🤖 View Amazon Q conversation transcripts</p>
                <p>📁 Browse your project history</p>
                <p>💬 See message counts and models used</p>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);
  
  // Child component references
  messageList = viewChild(MessageListComponent);
  messageInput = viewChild(MessageInputComponent);
  
  // Local state
  isActiveChat = signal(false);
  streamingMessageId = signal<string | null>(null);
  messageIndexMap = new Map<string, number>(); // メッセージID → インデックスマップ
  
  constructor() {
    // Monitor session changes to update chat state
    effect(() => {
      const currentSession = this.appStore.currentQSession();
      const sessionError = this.appStore.sessionError();
      
      // Update active chat state
      this.isActiveChat.set(!!currentSession && !sessionError);
      
      // Setup WebSocket listeners when session starts
      if (currentSession) {
        this.setupWebSocketListeners();
      }
    });
  }
  
  ngOnDestroy(): void {
    // Cleanup WebSocket listeners
    this.websocket.removeChatListeners();
  }

  ngOnInit(): void {
    // Connect to websocket if not already connected
    if (!this.websocket.connected()) {
      this.websocket.connect();
    }
  }

  getProjectPathFromConversation(): string {
    // Amazon Q履歴からプロジェクトパスを取得
    // 現在の実装では、currentQConversationにプロジェクトパス情報が含まれていないため、
    // amazonQHistoryから該当するプロジェクトを検索
    const currentConversation = this.appStore.currentQConversation();
    if (!currentConversation) return '';
    
    const historyItem = this.appStore.amazonQHistory().find(
      h => h.conversation_id === currentConversation.conversation_id
    );
    return historyItem?.projectPath || '';
  }

  getProjectName(projectPath: string): string {
    if (!projectPath) return 'Unknown Project';
    const parts = projectPath.split('/');
    return parts[parts.length - 1] || projectPath;
  }

  getToolsDisplay(tools: string[] | undefined | null): string {
    if (!tools) {
      return 'None';
    }
    if (Array.isArray(tools)) {
      return tools.length > 0 ? tools.join(', ') : 'None';
    }
    // toolsが配列でない場合（念のため）
    return String(tools);
  }

  clearSessionError(): void {
    this.appStore.setSessionError(null);
  }
  
  isSessionDisabled(): boolean {
    return !!this.appStore.sessionError() || !this.appStore.currentQSession();
  }
  
  canChat(): boolean {
    return this.isActiveChat() && !this.isSessionDisabled();
  }
  
  getDisabledReason(): string {
    if (this.appStore.sessionError()) {
      return this.appStore.sessionError()!;
    }
    if (!this.appStore.currentQSession()) {
      return 'No active Amazon Q session. Please start a new project session.';
    }
    return 'Chat is temporarily unavailable.';
  }
  
  resumeSession(): void {
    const conversation = this.appStore.currentQConversation();
    if (conversation) {
      const projectPath = this.getProjectPathFromConversation();
      if (projectPath) {
        this.websocket.resumeSession(projectPath, conversation.conversation_id);
      }
    }
  }
  
  onMessageSent(event: {content: string; files: File[]}): void {
    if (!this.canChat()) {
      console.warn('Cannot send message: chat is disabled');
      return;
    }
    
    // Add user message to chat immediately
    this.messageList()?.addMessage(event.content, 'user');
    
    // Add typing indicator for Amazon Q response
    this.messageList()?.addTypingIndicator();
    
    // Clear any previous streaming message ID
    this.streamingMessageId.set(null);
  }
  
  private setupWebSocketListeners(): void {
    // Setup chat listeners for real-time message handling
    this.websocket.setupChatListeners(
      // On Q response (streaming)
      (data) => {
        console.log('Received Q response:', data);
        this.handleStreamingResponse(data.data);
      },
      // On Q error
      (data) => {
        // 意味のあるエラーのみ表示とログ出力
        if (this.shouldDisplayError(data.error)) {
          console.error('Received Q error:', data);
          
          // Remove typing indicator
          this.messageList()?.removeTypingIndicator();
          // Clear any streaming message
          this.streamingMessageId.set(null);
          // ANSIコードを除去してクリーンなエラーメッセージを表示
          const cleanError = this.stripAnsiCodes(data.error);
          this.messageList()?.addMessage(`Error: ${cleanError}`, 'assistant');
        } else {
          // 情報メッセージは詳細ログとして出力（任意）
          console.log('Q info message (filtered):', data);
        }
      },
      // On Q completion
      (data) => {
        console.log('Q session completed:', data);
        // Remove typing indicator if present
        this.messageList()?.removeTypingIndicator();
        // Clear streaming message ID
        this.streamingMessageId.set(null);
      }
    );
  }
  
  private handleStreamingResponse(content: string): void {
    // ANSIエスケープシーケンスを除去
    let cleanContent = this.stripAnsiCodes(content);
    
    // 単語境界を改善
    cleanContent = this.improveWordBoundaries(cleanContent);
    
    // 空のコンテンツは無視
    if (!cleanContent.trim()) {
      return;
    }
    
    const currentStreamingId = this.streamingMessageId();
    
    if (!currentStreamingId) {
      // 新しいストリーミングメッセージを開始
      this.messageList()?.removeTypingIndicator();
      const messageId = this.messageList()?.addMessage(cleanContent, 'assistant') || '';
      this.streamingMessageId.set(messageId);
      
      // インデックスマップを更新
      this.updateMessageIndexMap();
    } else {
      // 最適化された検索でメッセージを更新
      const messageIndex = this.messageIndexMap.get(currentStreamingId);
      const currentMessages = this.appStore.chatMessages();
      
      if (messageIndex !== undefined && messageIndex < currentMessages.length && 
          currentMessages[messageIndex].id === currentStreamingId) {
        const updatedContent = currentMessages[messageIndex].content + cleanContent;
        this.appStore.updateChatMessage(currentStreamingId, { content: updatedContent });
        
        // ストリーミング更新時にスクロール更新をトリガー
        this.messageList()?.markForScrollUpdate();
      } else {
        // インデックスマップが古い場合は再構築
        this.updateMessageIndexMap();
        const newMessageIndex = this.messageIndexMap.get(currentStreamingId);
        if (newMessageIndex !== undefined && newMessageIndex < currentMessages.length) {
          const updatedContent = currentMessages[newMessageIndex].content + cleanContent;
          this.appStore.updateChatMessage(currentStreamingId, { content: updatedContent });
          this.messageList()?.markForScrollUpdate();
        }
      }
    }
  }
  
  private shouldDisplayError(error: string): boolean {
    // ANSIエスケープシーケンスを除去
    const cleanedError = this.stripAnsiCodes(error);
    const trimmed = cleanedError.trim();
    
    // 空のエラーは表示しない
    if (!trimmed) {
      return false;
    }
    
    // 初期化メッセージや情報メッセージは表示しない
    const skipPatterns = [
      /^\s*[\x00-\x1f]\s*$/,                            // 制御文字のみ
      /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*$/, // スピナー文字のみ
      /mcp servers? initialized/i,                       // MCPサーバー初期化メッセージ
      /ctrl-c to start chatting/i,                       // チャット開始指示
      /press.*enter.*continue/i,                         // Enterキー指示
      /loading|initializing/i,                           // ローディングメッセージ
      /thinking\.\.\.?/i,                                // Thinking メッセージ
      /analyzing|processing/i,                           // 分析・処理メッセージ
      /^\s*\d+\s+of\s+\d+\s*$/,                        // 進捗表示 (例: "1 of 2")
      /✓\s*\w+\s+loaded\s+in\s+[\d.]+\s*s/i,           // ロード完了メッセージ
      /^\s*>.*$/,                                        // ">" で始まる出力
      /^\s*\[.*\]\s*$/,                                 // [bracket] 形式
      /mcp.*server.*started/i,                           // MCP サーバー開始
      /session.*started/i,                               // セッション開始
      /connected.*to/i,                                  // 接続メッセージ
      /ready.*to.*chat/i,                               // チャット準備完了
      /starting.*session/i,                              // セッション開始中
      /waiting.*for.*response/i,                         // レスポンス待機
      /^\s*m\s*$/,                                       // 単一の'm'文字
    ];
    
    return !skipPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Amazon Q CLI特有のフォーマット出力かどうかを判定
   */
  private isAmazonQFormattedOutput(text: string): boolean {
    const trimmed = text.trim();
    
    return /^>/.test(trimmed) ||                           // プロンプト出力
           /\w{15,}\n\w{15,}/.test(text) ||               // 長い単語が改行で分割されている
           /\w+\.\w+\b/.test(trimmed) ||                   // 単語が途中で区切られている
           /[a-z][A-Z]/.test(trimmed.replace(/\s/g, ''));  // camelCaseが空白なしで連結
  }

  /**
   * 単語境界を考慮したコンテンツの改善
   */
  private improveWordBoundaries(content: string): string {
    // Amazon Q CLI特有のフォーマット問題を修正
    if (this.isAmazonQFormattedOutput(content)) {
      // camelCaseや連結された単語の間にスペースを挿入
      content = content.replace(/([a-z])([A-Z])/g, '$1 $2');
      // 不自然な単語分割を修正
      content = content.replace(/(\w+)\n(\w+)/g, '$1 $2');
    }
    return content;
  }

  /**
   * ANSIエスケープシーケンスを除去
   */
  private stripAnsiCodes(text: string): string {
    let cleanText = text;
    
    // 1. ANSIエスケープシーケンスを除去
    const ansiRegex = /\x1b\[[0-9;]*[a-zA-Z]/g;
    cleanText = cleanText.replace(ansiRegex, '');
    
    // 2. カーソル保存・復元シーケンスを除去 (\x1B7, \x1B8)
    const cursorSaveRestoreRegex = /\x1b[78]/g;
    cleanText = cleanText.replace(cursorSaveRestoreRegex, '');
    
    // 3. その他の単文字ANSIエスケープシーケンス
    const singleCharAnsiRegex = /\x1b[DMH]/g;
    cleanText = cleanText.replace(singleCharAnsiRegex, '');
    
    // 4. スピナー文字を除去
    const spinnerRegex = /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g;
    cleanText = cleanText.replace(spinnerRegex, '');
    
    // 5. カーソル制御文字を除去
    const cursorRegex = /\x1b\[\?25[lh]/g;
    cleanText = cleanText.replace(cursorRegex, '');
    
    // 6. バックスペースとカリッジリターンを正規化
    cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 7. 余分な空白を正規化（改行文字は保持、より保守的に）
    cleanText = cleanText.replace(/[ \t]+/g, ' ');
    
    return cleanText;
  }
  
  /**
   * メッセージIDインデックスマップを更新
   */
  private updateMessageIndexMap(): void {
    this.messageIndexMap.clear();
    const messages = this.appStore.chatMessages();
    messages.forEach((message, index) => {
      this.messageIndexMap.set(message.id, index);
    });
  }
}
import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, viewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';
import { MessageListComponent } from '../../shared/components/message-list/message-list.component';
import { MessageInputComponent } from '../../shared/components/message-input/message-input.component';
import { PathSelectorComponent } from '../../shared/components/path-selector/path-selector.component';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, MessageListComponent, MessageInputComponent, PathSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-black">
      <!-- Chat Header -->
      <div class="border-b border-[#2f2f2f] p-4 bg-[#0d0d0d] sticky top-0 z-90">
        <div class="flex items-center justify-between">
          <div>
            @if (appStore.currentQSession()) {
              <h1 class="text-xl font-semibold text-white">{{ getProjectName(appStore.currentQSession()!.projectPath) }}</h1>
              } @else if (appStore.currentQConversation()) {
              <h1 class="text-xl font-semibold text-white">{{ getProjectName(getProjectPathFromConversation()) }}</h1>
              } @else if (appStore.sessionStarting()) {
              <h1 class="text-xl font-semibold text-white">Starting Amazon Q Session...</h1>
              <p class="text-sm text-[#d9d9d9] mt-1">Please wait while we start your session</p>
            } @else if (appStore.sessionError()) {
              <h1 class="text-xl font-semibold text-[#f91880]">Session Start Failed</h1>
              <p class="text-sm text-[#f91880] mt-1">Failed to start Amazon Q session</p>
            } @else {
              <h1 class="text-xl font-semibold text-white">Welcome to Quincy</h1>
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
            <span class="text-[#d9d9d9] font-medium">
              {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 flex flex-col relative">
        @if (appStore.currentQSession() || isActiveChat()) {
          <!-- Active Chat Session -->
          <div class="flex-1 overflow-y-auto">
            <app-message-list></app-message-list>
          </div>
          
          <!-- Message Input - Sticky to bottom -->
          @if (!isSessionDisabled()) {
            <div class="sticky bottom-0 left-0 right-0 z-10">
              <app-message-input (messageSent)="onMessageSent($event)"></app-message-input>
            </div>
          } @else {
            <div class="sticky bottom-0 left-0 right-0 z-10">
              <div class="bg-[#0d0d0d] border-t border-[#2f2f2f] p-4 text-center">
                <div class="max-w-md mx-auto">
                  <p class="text-[#d9d9d9] text-sm mb-3">{{ getDisabledReason() }}</p>
                  @if (appStore.sessionError()) {
                    <button 
                      class="px-4 py-2 bg-[#1d9bf0] text-white rounded-md hover:bg-[#1a8cd8] transition-colors text-sm font-medium"
                      (click)="clearSessionError()"
                    >
                      Start New Session
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        } @else if (appStore.sessionStarting()) {
          <!-- Session Starting -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-white mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-white mb-4">Starting Amazon Q Session</h2>
              <p class="text-[#d9d9d9] mb-6 leading-relaxed">
                Please wait while we initialize your Amazon Q session...
              </p>
              <div class="space-y-3">
                <div class="flex items-center justify-center text-sm" [class.text-[#8a8a8a]]="!sessionStatus.cliLaunched" [class.text-[#00ba7c]]="sessionStatus.cliLaunched">
                  <span class="mr-2">🚀</span>
                  <span>Launching Amazon Q CLI</span>
                  @if (sessionStatus.cliLaunched) {
                    <svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  }
                </div>
                <div class="flex items-center justify-center text-sm" [class.text-[#8a8a8a]]="!sessionStatus.connectionEstablished" [class.text-[#00ba7c]]="sessionStatus.connectionEstablished">
                  <span class="mr-2">🔗</span>
                  <span>Establishing connection</span>
                  @if (sessionStatus.connectionEstablished) {
                    <svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  }
                </div>
                <div class="flex items-center justify-center text-sm" [class.text-[#8a8a8a]]="!sessionStatus.workspaceReady" [class.text-[#00ba7c]]="sessionStatus.workspaceReady">
                  <span class="mr-2">📂</span>
                  <span>Setting up project workspace</span>
                  @if (sessionStatus.workspaceReady) {
                    <svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                  }
                </div>
              </div>
              <p class="text-xs text-[#8a8a8a] mt-4">This may take up to 30 seconds...</p>
            </div>
          </div>
        } @else if (appStore.sessionError()) {
          <!-- Session Error -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-[#f91880] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-[#f91880] mb-4">Session Start Failed</h2>
              <p class="text-white mb-6 leading-relaxed bg-[#2d1b24] border border-[#4d2a36] rounded-lg p-4">
                {{ appStore.sessionError() }}
              </p>
              <div class="space-y-2 text-sm text-[#d9d9d9]">
                <p class="font-medium">💡 Troubleshooting Tips:</p>
                <div class="text-left bg-[#1a1a1a] rounded-lg p-4">
                  <p>1. Install Amazon Q CLI if not installed</p>
                  <p>2. Ensure 'q' command is in your PATH</p>
                  <p>3. Run 'q --version' in terminal to verify</p>
                  <p>4. Restart the application after installation</p>
                </div>
              </div>
              <button 
                class="mt-6 px-4 py-2 bg-[#1d9bf0] text-white rounded-md hover:bg-[#1a8cd8] transition-colors font-medium"
                (click)="clearSessionError()"
              >
                Try Again
              </button>
            </div>
          </div>
        } @else if (appStore.currentQConversation()) {
          <!-- Amazon Q Conversation History (Read-Only) -->
          <div class="flex-1 overflow-y-auto">
            @if (appStore.qHistoryLoading()) {
              <div class="text-center py-8">
                <div class="text-lg text-[#d9d9d9]">Loading conversation history...</div>
              </div>
            } @else if (appStore.currentQConversation()?.transcript) {
              <app-message-list></app-message-list>
            } @else {
              <div class="text-center text-[#d9d9d9] py-8">
                <div class="text-lg mb-2">📭 No conversation transcript available</div>
                <div class="text-sm">This project may not have any Amazon Q conversation history.</div>
              </div>
            }
          </div>
          
          <!-- Resume Session Button - Sticky to bottom -->
          <div class="sticky bottom-0 left-0 right-0 z-10">
            <div class="p-4 text-center">
              <button 
                class="px-4 py-2 bg-[#1d9bf0] text-white rounded-md hover:bg-[#1a8cd8] transition-colors font-medium"
                (click)="resumeSession()"
              >
                Resume Session to Continue Chat
              </button>
            </div>
          </div>
        } @else {
          <div class="flex items-center justify-center min-h-full min-w-full">
            <app-path-selector></app-path-selector>
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

  // Session status tracking
  sessionStatus = {
    cliLaunched: false,
    connectionEstablished: false,
    workspaceReady: false
  };

  constructor() {
    // Monitor session changes to update chat state
    effect(() => {
      const currentSession = this.appStore.currentQSession();
      const sessionError = this.appStore.sessionError();

      // Update active chat state
      this.isActiveChat.set(!!currentSession && !sessionError);

      // Always cleanup listeners before setting up new ones
      this.websocket.removeChatListeners();

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
        // セッション開始状態に切り替え
        this.appStore.clearCurrentView();
        this.appStore.setSessionStarting(true);

        // セッションステータスをリセット
        this.sessionStatus = {
          cliLaunched: false,
          connectionEstablished: false,
          workspaceReady: false
        };

        // ステータス更新を模擬（実際のイベントに基づいて更新）
        setTimeout(() => { this.sessionStatus.cliLaunched = true; }, 1000);
        setTimeout(() => { this.sessionStatus.connectionEstablished = true; }, 2000);
        setTimeout(() => { this.sessionStatus.workspaceReady = true; }, 3000);

        // タイムアウトを設定（30秒）
        const timeoutId = setTimeout(() => {
          console.error('Session resume timeout after 30 seconds');
          this.appStore.setSessionStarting(false);
          this.appStore.setSessionError('Session resume timed out. Please try again.');
        }, 30000);

        // セッション失敗リスナーを設定
        const failedSubscription = this.websocket.onSessionFailed().subscribe((data) => {
          console.error('Session resume failed:', data.error);
          clearTimeout(timeoutId);
          this.appStore.setSessionStarting(false);
          this.appStore.setSessionError(`Failed to resume session: ${data.error}`);
          failedSubscription.unsubscribe();
        });

        // Resume sessionリクエストを送信
        this.websocket.resumeSession(projectPath, conversation.conversation_id);

        // セッション開始リスナーを設定（LayoutComponentと同様）
        this.websocket.setupProjectSessionListeners((data) => {
          console.log('Amazon Q session resumed:', data);
          clearTimeout(timeoutId);
          failedSubscription.unsubscribe();
          this.appStore.switchToActiveSession(data);
        });
      }
    }
  }

  onMessageSent(event: { content: string }): void {
    if (!this.canChat()) {
      console.warn('Cannot send message: chat is disabled');
      return;
    }

    // Add user message to chat immediately
    this.messageList()?.addMessage(event.content, 'user');

    // Clear any previous streaming message ID
    this.streamingMessageId.set(null);
  }

  private setupWebSocketListeners(): void {
    const currentSession = this.appStore.currentQSession();
    if (!currentSession) {
      return;
    }

    // Setup chat listeners for real-time message handling
    this.websocket.setupChatListeners(
      // On Q response (streaming)
      (data) => {
        // Filter by session ID to prevent duplicate messages
        if (data.sessionId === currentSession.sessionId) {
          console.log('Received Q response for current session:', data);
          this.handleStreamingResponse(data.data);
        }
      },
      // On Q error
      (data) => {
        // Filter by session ID
        if (data.sessionId === currentSession.sessionId) {
          console.error('Received Q error for current session:', data);

          // 意味のあるエラーのみ表示
          if (this.shouldDisplayError(data.error)) {
            // Clear any streaming message
            this.streamingMessageId.set(null);
            // Add error message to chat
            this.messageList()?.addMessage(`Error: ${data.error}`, 'assistant');
          }
        }
      },
      // On Q info (information messages)
      (data) => {
        // Filter by session ID
        if (data.sessionId === currentSession.sessionId) {
          console.log('Received Q info for current session:', data);
          this.handleInfoMessage(data);
        }
      },
      // On Q completion
      (data) => {
        // Filter by session ID
        if (data.sessionId === currentSession.sessionId) {
          console.log('Q session completed for current session:', data);
          // Clear streaming message ID
          this.streamingMessageId.set(null);
        }
      }
    );
  }

  private handleStreamingResponse(content: string): void {
    const currentStreamingId = this.streamingMessageId();

    if (!currentStreamingId) {
      // 新しいストリーミングメッセージを開始
      const messageId = this.messageList()?.addMessage(content, 'assistant') || '';
      this.streamingMessageId.set(messageId);

      // インデックスマップを更新
      this.updateMessageIndexMap();
    } else {
      // 最適化された検索でメッセージを更新
      const messageIndex = this.messageIndexMap.get(currentStreamingId);
      const currentMessages = this.appStore.chatMessages();

      if (messageIndex !== undefined && messageIndex < currentMessages.length &&
        currentMessages[messageIndex].id === currentStreamingId) {
        const updatedContent = currentMessages[messageIndex].content + content;
        this.appStore.updateChatMessage(currentStreamingId, { content: updatedContent });

        // ストリーミング更新時にスクロール更新をトリガー
        this.messageList()?.markForScrollUpdate();
      } else {
        // インデックスマップが古い場合は再構築
        this.updateMessageIndexMap();
        const newMessageIndex = this.messageIndexMap.get(currentStreamingId);
        if (newMessageIndex !== undefined && newMessageIndex < currentMessages.length) {
          const updatedContent = currentMessages[newMessageIndex].content + content;
          this.appStore.updateChatMessage(currentStreamingId, { content: updatedContent });
          this.messageList()?.markForScrollUpdate();
        }
      }
    }
  }

  private handleInfoMessage(data: { sessionId: string; message: string; type?: string }): void {
    // 情報メッセージを適切に表示
    const messageContent = this.formatInfoMessage(data);

    if (messageContent) {
      // メッセージリストに情報メッセージを追加（assistantタイプで情報として表示）
      this.messageList()?.addMessage(messageContent, 'assistant');
    }
  }

  private formatInfoMessage(data: { sessionId: string; message: string; type?: string }): string | null {
    const trimmed = data.message.trim();

    // 空のメッセージはスキップ
    if (!trimmed) {
      return null;
    }

    // 特別なメッセージの処理
    const lowerTrimmed = trimmed.toLowerCase();
    if (lowerTrimmed === 'thinking' || lowerTrimmed === 'thinking...') {
      return `🤔 Thinking...`;
    }

    // メッセージタイプに基づいてフォーマット
    switch (data.type) {
      case 'initialization':
        return `ℹ️ ${trimmed}`;
      case 'status':
        return `✅ ${trimmed}`;
      case 'progress':
        return `⏳ ${trimmed}`;
      case 'general':
      default:
        return `💬 ${trimmed}`;
    }
  }

  private shouldDisplayError(error: string): boolean {
    const trimmed = error.trim();

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
      /^\s*m\s*$/,                                       // 単一の'm'文字
    ];

    return !skipPatterns.some(pattern => pattern.test(trimmed));
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
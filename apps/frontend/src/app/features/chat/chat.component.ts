import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  viewChild,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';
import { MessageListComponent } from '../../shared/components/message-list/message-list.component';
import { MessageInputComponent } from '../../shared/components/message-input/message-input.component';

import { ChatHeaderComponent } from './components/chat-header/chat-header.component';
import {
  SessionStartComponent,
  SessionStatus,
} from './components/session-start/session-start.component';
import { ChatErrorComponent } from './components/chat-error/chat-error.component';
import { ChatMessagesComponent } from './components/chat-messages/chat-messages.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import {
  setupChatWebSocketListeners,
  cleanupChatWebSocketListeners,
  handleStreamingResponseWithTools,
  handleErrorResponse,
  handleInfoResponse,
  handleCompletionResponse,
  ChatWebSocketHandlers,
} from './services/chat-websocket';
import {
  handleStreamingStart,
  handleStreamingUpdateWithTools,
  formatInfoMessage,
  shouldDisplayError,
} from './services/message-streaming';
import { resumeSession } from './services/session-manager';
import {
  updateMessageIndexMap,
  isSessionDisabled,
  canChat,
  getDisabledReason,
  getProjectName,
  getProjectPathFromConversation,
} from './utils';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    MessageListComponent,
    ChatHeaderComponent,
    SessionStartComponent,
    ChatErrorComponent,
    ChatMessagesComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-[var(--primary-bg)]">
      <!-- Chat Header -->
      <app-chat-header></app-chat-header>

      <!-- Chat Messages Area -->
      <div class="flex-1 flex flex-col relative">
        @if (appStore.currentQSession() || isActiveChat()) {
          <!-- Active Chat Session -->
          <app-chat-messages
            class="h-full"
            [isSessionDisabled]="
              isSessionDisabled(appStore.sessionError(), appStore.currentQSession())
            "
            [disabledReason]="
              getDisabledReason(appStore.sessionError(), appStore.currentQSession())
            "
            [hasSessionError]="!!appStore.sessionError()"
            (messageSent)="onMessageSent($event)"
            (clearError)="clearSessionError()"
          ></app-chat-messages>
        } @else if (appStore.sessionStarting()) {
          <!-- Session Starting -->
          <app-session-start [sessionStatus]="sessionStatus()"></app-session-start>
        } @else if (appStore.sessionError()) {
          <!-- Session Error -->
          <app-chat-error
            [errorMessage]="appStore.sessionError()!"
            (tryAgain)="clearSessionError()"
          ></app-chat-error>
        } @else if (appStore.currentQConversation()) {
          <!-- Amazon Q Conversation History (Read-Only) -->
          <div class="flex-1 overflow-y-auto">
            @if (appStore.qHistoryLoading()) {
              <div class="text-center py-8">
                <div class="text-lg text-[var(--text-secondary)]">
                  Loading conversation history...
                </div>
              </div>
            } @else if (appStore.detailedHistoryMessages().length > 0) {
              <app-message-list></app-message-list>
            } @else {
              <div class="text-center text-[var(--text-secondary)] py-8">
                <div class="text-lg mb-2">📭 No conversation history available</div>
                <div class="text-sm">
                  This project may not have any Amazon Q conversation history with detailed data.
                </div>
              </div>
            }
          </div>

          <!-- Resume Session Button - Sticky to bottom -->
          <div class="sticky bottom-0 left-0 right-0 z-10">
            <div class="p-4 text-center">
              <button
                class="px-4 py-2 bg-[var(--tertiary-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--hover-bg)] transition-colors font-medium"
                (click)="resumeSession()"
              >
                Resume Session to Continue Chat
              </button>
            </div>
          </div>
        } @else {
          <!-- Empty State -->
          <app-empty-state class="h-full"></app-empty-state>
        }
      </div>
    </div>
  `,
})
export class ChatComponent implements OnInit, OnDestroy {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);

  // Child component references
  chatMessages = viewChild(ChatMessagesComponent);
  messageInput = viewChild(MessageInputComponent);

  // Local state
  isActiveChat = signal(false);
  streamingMessageId = signal<string | null>(null);
  messageIndexMap = new Map<string, number>();

  // Session status tracking
  sessionStatus = signal<SessionStatus>({
    cliLaunched: false,
    connectionEstablished: false,
    workspaceReady: false,
  });

  // 分離されたユーティリティ関数をコンポーネントメソッドとして公開
  isSessionDisabled = isSessionDisabled;
  canChat = canChat;
  getDisabledReason = getDisabledReason;
  getProjectName = getProjectName;
  getProjectPathFromConversation = getProjectPathFromConversation;

  constructor() {
    // Monitor session changes to update chat state
    effect(() => {
      const currentSession = this.appStore.currentQSession();
      const sessionError = this.appStore.sessionError();

      // Update active chat state
      this.isActiveChat.set(!!currentSession && !sessionError);

      // Always cleanup listeners before setting up new ones
      cleanupChatWebSocketListeners(this.websocket);

      // Setup WebSocket listeners when session starts
      if (currentSession) {
        this.setupWebSocketListeners();
      }
    });

    // Monitor conversation changes to trigger detailed history loading
    effect(() => {
      const currentConversation = this.appStore.currentQConversation();

      // Load detailed history when conversation is selected
      if (currentConversation) {
        const projectPath = getProjectPathFromConversation(
          currentConversation,
          this.appStore.amazonQHistory()
        );
        if (projectPath) {
          console.log('Loading detailed history for:', projectPath);
          this.websocket.getProjectHistoryDetailed(projectPath);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup WebSocket listeners
    cleanupChatWebSocketListeners(this.websocket);
  }

  ngOnInit(): void {
    // Connect to websocket if not already connected
    if (!this.websocket.connected()) {
      this.websocket.connect();
    }
  }

  clearSessionError(): void {
    this.appStore.setSessionError(null);
  }

  resumeSession(): void {
    const conversation = this.appStore.currentQConversation();
    if (conversation) {
      const projectPath = getProjectPathFromConversation(
        conversation,
        this.appStore.amazonQHistory()
      );
      if (projectPath) {
        resumeSession(
          projectPath,
          conversation.conversation_id,
          this.websocket,
          this.appStore,
          this.sessionStatus(),
          status => this.sessionStatus.set(status)
        );
      }
    }
  }

  onMessageSent(event: { content: string }): void {
    if (
      !canChat(this.isActiveChat(), this.appStore.sessionError(), this.appStore.currentQSession())
    ) {
      console.warn('Cannot send message: chat is disabled');
      return;
    }

    // Add user message to chat immediately
    const messageList = this.chatMessages()?.messageList();
    if (messageList) {
      messageList.addMessage(event.content, 'user');
    }

    // Clear any previous streaming message ID
    this.streamingMessageId.set(null);
  }

  private setupWebSocketListeners(): void {
    const currentSession = this.appStore.currentQSession();
    if (!currentSession) {
      return;
    }

    const handlers: ChatWebSocketHandlers = {
      onQResponse: data => {
        handleStreamingResponseWithTools(
          data,
          currentSession.sessionId,
          (content, tools, hasToolContent) =>
            this.handleStreamingResponse(content, tools, hasToolContent)
        );
      },
      onQError: data => {
        handleErrorResponse(data, currentSession.sessionId, shouldDisplayError, error =>
          this.handleErrorMessage(error)
        );
      },
      onQInfo: data => {
        handleInfoResponse(data, currentSession.sessionId, infoData =>
          this.handleInfoMessage(infoData)
        );
      },
      onQCompletion: data => {
        handleCompletionResponse(data, currentSession.sessionId, () =>
          this.handleCompletionMessage()
        );
      },
    };

    setupChatWebSocketListeners(this.websocket, handlers);
  }

  private handleStreamingResponse(
    content: string,
    tools?: string[],
    hasToolContent?: boolean
  ): void {
    const currentStreamingId = this.streamingMessageId();

    if (!currentStreamingId) {
      // 新しいストリーミングメッセージを開始
      handleStreamingStart(
        content,
        (content, type) => {
          const messageList = this.chatMessages()?.messageList();
          return messageList ? messageList.addMessage(content, type) : '';
        },
        this.streamingMessageId,
        () => this.updateMessageIndexMap()
      );
    } else {
      // 既存のストリーミングメッセージを更新（ツール対応版）
      handleStreamingUpdateWithTools(
        content,
        tools,
        hasToolContent ?? false,
        currentStreamingId,
        this.messageIndexMap,
        () => this.appStore.chatMessages(),
        (messageId, updates) => this.appStore.updateChatMessage(messageId, updates),
        () => this.chatMessages()?.messageList()?.markForScrollUpdate(),
        () => this.updateMessageIndexMap()
      );
    }
  }

  private handleErrorMessage(error: string): void {
    // Clear any streaming message
    this.streamingMessageId.set(null);
    // Add error message to chat
    const messageList = this.chatMessages()?.messageList();
    if (messageList) {
      messageList.addMessage(`Error: ${error}`, 'assistant');
    }
  }

  private handleInfoMessage(data: { sessionId: string; message: string; type?: string }): void {
    const messageContent = formatInfoMessage(data);

    if (messageContent) {
      // メッセージリストに情報メッセージを追加
      const messageList = this.chatMessages()?.messageList();
      if (messageList) {
        const messageId = messageList.addMessage(messageContent, 'assistant');
        console.log('Added info message:', {
          messageId,
          messageContent,
          sessionId: this.appStore.currentQSession()?.sessionId,
          totalMessages: this.appStore.chatMessages().length,
          currentSessionMessages: this.appStore.currentSessionMessages().length,
        });
      } else {
        console.warn('MessageList component not found');
      }
    }
  }

  private handleCompletionMessage(): void {
    // Clear streaming message ID
    this.streamingMessageId.set(null);
  }

  private updateMessageIndexMap(): void {
    updateMessageIndexMap(this.messageIndexMap, this.appStore.chatMessages());
  }
}

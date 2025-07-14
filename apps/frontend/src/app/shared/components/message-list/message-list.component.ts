import { Component, inject, signal, ChangeDetectionStrategy, computed, ViewChild, ElementRef, AfterViewChecked, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore, ChatMessage } from '../../../core/store/app.state';
import { UserMessageComponent } from '../user-message/user-message.component';
import { AmazonQMessageComponent } from '../amazon-q-message/amazon-q-message.component';
import { ScrollPanel } from 'primeng/scrollpanel';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, UserMessageComponent, AmazonQMessageComponent, ScrollPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-scrollPanel [style]="{ height: '100%' }" class="p-4">
      <div class="space-y-6" #messageContainer>
        @if (messages().length === 0) {
          <!-- Empty conversation state -->
          <div class="text-center py-12">
            <div class="mb-4">
              <i class="pi pi-comments text-surface-300 text-5xl"></i>
            </div>
            <h3 class="text-lg font-medium text-surface-900 mb-2">Start the conversation</h3>
            <p class="text-surface-500 text-sm">Send a message to begin chatting with your AI assistant.</p>
          </div>
        } @else {
          @for (message of messages(); track message.id) {
            <div class="message-block">
              @if (message.sender === 'user') {
                <app-user-message 
                  [content]="message.content"
                  [timestamp]="message.timestamp"
                  [showTimestamp]="!historyMode()"
                  [showAvatar]="!historyMode()"
                />
              } @else {
                <app-amazon-q-message 
                  [content]="message.content"
                  [timestamp]="message.timestamp"
                  [isTyping]="message.isTyping || false"
                  [showHeader]="!historyMode()"
                  [withBackground]="!historyMode()"
                />
              }
            </div>
          }
        }
      </div>
    </p-scrollPanel>
  `
})
export class MessageListComponent implements AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef<HTMLDivElement>;
  
  // Input properties for history mode
  historyMode = input<boolean>(false);
  historyMessages = input<string[]>([]);
  
  private scrollToBottomRequest = signal(false);
  protected appStore = inject(AppStore);
  private messageService = inject(MessageService);
  
  private getWelcomeMessage(): ChatMessage[] {
    return [{
      id: 'welcome',
      content: 'Hello! I\'m Amazon Q, your AI coding assistant. How can I help you with your project today?',
      sender: 'assistant',
      timestamp: new Date()
    }];
  }
  
  // Chat messages from the store or history
  messages = computed(() => {
    // History mode - convert history messages to ChatMessage format
    if (this.historyMode()) {
      return this.convertHistoryToChatMessages(this.historyMessages());
    }
    
    // Real-time mode - use session messages from store
    const currentSession = this.appStore.currentQSession();
    if (!currentSession) return this.getWelcomeMessage();
    
    const sessionMessages = this.appStore.currentSessionMessages();
    return sessionMessages.length === 0 ? this.getWelcomeMessage() : sessionMessages;
  });

  /**
   * Convert history messages (string array) to ChatMessage format
   * Even indices = user messages, Odd indices = assistant messages
   */
  private convertHistoryToChatMessages(historyMessages: string[]): ChatMessage[] {
    if (!historyMessages || historyMessages.length === 0) {
      return [];
    }
    
    return historyMessages.map((message, index) => ({
      id: `history-${index}`,
      content: message,
      sender: (index % 2 === 0) ? 'user' : 'assistant',
      timestamp: new Date(), // History messages don't have timestamps
      isTyping: false
    })) as ChatMessage[];
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }


  addMessage(content: string, sender: 'user' | 'assistant'): string {
    const currentSession = this.appStore.currentQSession();
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: ChatMessage = {
      id: messageId,
      content,
      sender,
      timestamp: new Date(),
      sessionId: currentSession?.sessionId
    };
    
    this.appStore.addChatMessage(newMessage);
    this.scrollToBottomRequest.set(true);
    
    return messageId;
  }

  addTypingIndicator(): void {
    const currentSession = this.appStore.currentQSession();
    const typingMessage: ChatMessage = {
      id: 'typing',
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isTyping: true,
      sessionId: currentSession?.sessionId
    };
    
    this.appStore.addChatMessage(typingMessage);
    this.scrollToBottomRequest.set(true);
  }

  removeTypingIndicator(): void {
    this.appStore.removeChatMessage('typing');
  }
  
  ngAfterViewChecked(): void {
    if (this.scrollToBottomRequest()) {
      this.scrollToBottom();
      this.scrollToBottomRequest.set(false);
    }
  }
  
  clearMessages(): void {
    this.appStore.clearChatMessages();
  }
  
  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        const element = this.messageContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      // スクロールエラーを無視
    }
  }
  
  // メッセージが更新されたときに呼び出される
  markForScrollUpdate(): void {
    this.scrollToBottomRequest.set(true);
  }
  
  getMessageCount(): number {
    return this.messages().filter(m => !m.isTyping).length;
  }
}
import { Component, inject, signal, ChangeDetectionStrategy, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore, ChatMessage } from '../../../core/store/app.state';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, TypingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 space-y-4" #messageContainer>
      @if (messages().length === 0) {
        <!-- Empty conversation state -->
        <div class="text-center py-12">
          <div class="mb-4">
            <svg class="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.5l-4 4z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
          <p class="text-gray-500 text-sm">Send a message to begin chatting with your AI assistant.</p>
        </div>
      } @else {
        @for (message of messages(); track message.id) {
          <div 
            class="flex gap-3"
            [class.justify-end]="message.sender === 'user'"
          >
            <!-- Avatar -->
            @if (message.sender === 'assistant') {
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            }

            <!-- Message Content -->
            <div class="flex-1 max-w-3xl">
              <div 
                class="rounded-lg px-4 py-3"
                [class.bg-blue-500]="message.sender === 'user'"
                [class.text-white]="message.sender === 'user'"
                [class.bg-gray-100]="message.sender === 'assistant'"
                [class.text-gray-900]="message.sender === 'assistant'"
              >
                @if (message.isTyping) {
                  <app-typing-indicator></app-typing-indicator>
                } @else {
                  <div class="whitespace-pre-wrap break-words">{{ message.content }}</div>
                }
              </div>
              
              <!-- Message Meta -->
              <div class="flex items-center justify-between mt-1 px-1">
                <span class="text-xs text-gray-500">
                  {{ formatTime(message.timestamp) }}
                </span>
                
                @if (message.sender === 'assistant' && !message.isTyping) {
                  <button 
                    class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    (click)="copyMessage(message.content)"
                    title="Copy message"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                }
              </div>
            </div>

            <!-- User Avatar -->
            @if (message.sender === 'user') {
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class MessageListComponent implements AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef<HTMLDivElement>;
  
  private scrollToBottomRequest = signal(false);
  protected appStore = inject(AppStore);
  
  private getWelcomeMessage(): ChatMessage[] {
    return [{
      id: 'welcome',
      content: 'Hello! I\'m Amazon Q, your AI coding assistant. How can I help you with your project today?',
      sender: 'assistant',
      timestamp: new Date()
    }];
  }
  
  // Chat messages from the store
  messages = computed(() => {
    const currentSession = this.appStore.currentQSession();
    if (!currentSession) return this.getWelcomeMessage();
    
    const sessionMessages = this.appStore.currentSessionMessages();
    return sessionMessages.length === 0 ? this.getWelcomeMessage() : sessionMessages;
  });

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  copyMessage(content: string): void {
    navigator.clipboard.writeText(content).then(() => {
      // TODO: Show toast notification
      console.log('Message copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy message:', err);
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
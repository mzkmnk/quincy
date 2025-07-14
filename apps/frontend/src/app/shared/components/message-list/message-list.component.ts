import { Component, inject, signal, ChangeDetectionStrategy, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore, ChatMessage } from '../../../core/store/app.state';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { ScrollPanel } from 'primeng/scrollpanel';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, TypingIndicatorComponent, ScrollPanel, Button],
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
                <!-- User Question - Emphasized -->
                <div class="mb-4">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      <i class="pi pi-user"></i>
                    </div>
                    <span class="font-semibold text-gray-800">You</span>
                    <span class="text-xs text-gray-500">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div class="font-medium text-gray-900 whitespace-pre-wrap break-words">{{ message.content }}</div>
                  </div>
                </div>
              } @else {
                <!-- Assistant Answer - Document-like -->
                <div class="mb-6">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">
                      <i class="pi pi-android"></i>
                    </div>
                    <span class="font-semibold text-gray-800">Amazon Q</span>
                    <span class="text-xs text-gray-500">{{ formatTime(message.timestamp) }}</span>
                    @if (!message.isTyping) {
                      <p-button 
                        icon="pi pi-copy"
                        [text]="true"
                        [rounded]="true"
                        size="small"
                        (onClick)="copyMessage(message.content)"
                        title="Copy message"
                        severity="secondary"
                        class="ml-auto"
                      />
                    }
                  </div>
                  <div class="prose prose-gray max-w-none">
                    @if (message.isTyping) {
                      <app-typing-indicator></app-typing-indicator>
                    } @else {
                      <div class="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{{ message.content }}</div>
                    }
                  </div>
                </div>
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
      this.messageService.add({
        severity: 'success',
        summary: 'コピー完了',
        detail: 'メッセージをクリップボードにコピーしました',
        life: 3000
      });
    }).catch(err => {
      console.error('Failed to copy message:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'エラー',
        detail: 'メッセージのコピーに失敗しました',
        life: 3000
      });
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
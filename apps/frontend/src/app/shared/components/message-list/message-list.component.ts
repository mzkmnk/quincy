import { Component, inject, signal, ChangeDetectionStrategy, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore, ChatMessage } from '../../../core/store/app.state';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { ScrollPanel } from 'primeng/scrollpanel';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, TypingIndicatorComponent, ScrollPanel, Avatar, Button, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-scrollPanel [style]="{ height: '100%' }" class="p-4">
      <div class="space-y-4" #messageContainer>
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
            <div 
              class="flex gap-3"
              [class.justify-end]="message.sender === 'user'"
            >
              <!-- Assistant Avatar -->
              @if (message.sender === 'assistant') {
                <div class="flex-shrink-0">
                  <p-avatar 
                    icon="pi pi-android"
                    size="normal"
                    [style]="{ backgroundColor: '#dbeafe', color: '#2563eb' }"
                  />
                </div>
              }

              <!-- Message Content -->
              <div class="flex-1 max-w-3xl">
                <div 
                  class="rounded-lg px-4 py-3"
                  [class.bg-blue-500]="message.sender === 'user'"
                  [class.text-white]="message.sender === 'user'"
                  [class.bg-surface-100]="message.sender === 'assistant'"
                  [class.text-surface-900]="message.sender === 'assistant'"
                >
                  @if (message.isTyping) {
                    <app-typing-indicator></app-typing-indicator>
                  } @else {
                    <div class="whitespace-pre-wrap break-words">{{ message.content }}</div>
                  }
                </div>
                
                <!-- Message Meta -->
                <div class="flex items-center justify-between mt-1 px-1">
                  <span class="text-xs text-surface-500">
                    {{ formatTime(message.timestamp) }}
                  </span>
                  
                  @if (message.sender === 'assistant' && !message.isTyping) {
                    <p-button 
                      icon="pi pi-copy"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      (onClick)="copyMessage(message.content)"
                      title="Copy message"
                      severity="secondary"
                    />
                  }
                </div>
              </div>

              <!-- User Avatar -->
              @if (message.sender === 'user') {
                <div class="flex-shrink-0">
                  <p-avatar 
                    icon="pi pi-user"
                    size="normal"
                    [style]="{ backgroundColor: '#dcfce7', color: '#16a34a' }"
                  />
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
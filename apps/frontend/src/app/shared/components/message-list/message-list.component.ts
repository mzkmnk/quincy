import { Component, inject, signal, ChangeDetectionStrategy, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore, ChatMessage } from '../../../core/store/app.state';
import type { DisplayMessage } from '@quincy/shared';
import { UserMessageComponent } from '../user-message/user-message.component';
import { AmazonQMessageComponent } from '../amazon-q-message/amazon-q-message.component';
import { convertDisplayMessagesToChatMessages } from '../../utils/converters';
import { generateWelcomeMessage } from '../../utils/generators';

@Component({
  selector: 'app-message-list',
  imports: [CommonModule, UserMessageComponent, AmazonQMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-9/12 m-auto pt-5">
      <div class="space-y-4" #messageContainer>
        @if (messages().length === 0) {
          <!-- Empty conversation state -->
          <div class="text-center py-12">
            <div class="mb-4">
              <i class="pi pi-comments text-[var(--text-muted)] text-5xl"></i>
            </div>
            <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Start the conversation</h3>
            <p class="text-[var(--text-secondary)] text-sm">Send a message to begin chatting with your AI assistant.</p>
          </div>
        } @else {
          @for (message of messages(); track message.id) {
            <div class="message-block">
              @if (message.sender === 'user') {
                <app-user-message 
                  [content]="message.content"
                />
              } @else {
                <app-amazon-q-message 
                  [content]="message.content"
                  [isTyping]="message.isTyping || false"
                />
              }
            </div>
          }
        }
      </div>
    </div>
  `
})
export class MessageListComponent implements AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef<HTMLDivElement>;

  private scrollToBottomRequest = signal(false);
  protected appStore = inject(AppStore);



  // Chat messages from the store
  messages = computed(() => {
    const currentSession = this.appStore.currentQSession();
    const currentConversation = this.appStore.currentQConversation();
    const detailedMessages = this.appStore.detailedHistoryMessages();

    // 1. リアルタイムチャットモード（最優先）
    if (currentSession) {
      const sessionMessages = this.appStore.currentSessionMessages();
      return sessionMessages.length === 0 ? generateWelcomeMessage() : sessionMessages;
    }

    // 2. 詳細履歴表示モード
    if (currentConversation && detailedMessages.length > 0) {
      return convertDisplayMessagesToChatMessages(detailedMessages);
    }

    // 3. 従来の履歴表示モード
    if (currentConversation && !currentSession) {
      const allMessages = this.appStore.chatMessages();
      return allMessages.length === 0 ? [] : allMessages;
    }

    // 4. デフォルト状態
    return generateWelcomeMessage();
  });


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
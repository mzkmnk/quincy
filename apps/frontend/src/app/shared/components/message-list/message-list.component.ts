import { Component, inject, signal, ChangeDetectionStrategy, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppStore } from '../../../core/store/app.state';
import { UserMessageComponent } from '../user-message/user-message.component';
import { AmazonQMessageComponent } from '../amazon-q-message/amazon-q-message.component';

import { 
  addMessage, 
  addTypingIndicator, 
  removeTypingIndicator, 
  clearMessages, 
  getMessageCount 
} from './services/message-manager';
import { 
  scrollToBottom, 
  markForScrollUpdate 
} from './services/scroll-manager';
import { selectMessages } from './utils';

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
  messages = computed(() => selectMessages(this.appStore));

  // 分離されたサービス関数をコンポーネントメソッドとして公開
  addMessage = (content: string, sender: 'user' | 'assistant'): string => {
    return addMessage(content, sender, this.appStore, this.scrollToBottomRequest);
  };

  addTypingIndicator = (): void => {
    addTypingIndicator(this.appStore, this.scrollToBottomRequest);
  };

  removeTypingIndicator = (): void => {
    removeTypingIndicator(this.appStore);
  };

  clearMessages = (): void => {
    clearMessages(this.appStore);
  };

  getMessageCount = (): number => {
    return getMessageCount(this.messages());
  };

  markForScrollUpdate = (): void => {
    markForScrollUpdate(this.scrollToBottomRequest);
  };

  ngAfterViewChecked(): void {
    if (this.scrollToBottomRequest()) {
      scrollToBottom(this.messageContainer);
      this.scrollToBottomRequest.set(false);
    }
  }
}
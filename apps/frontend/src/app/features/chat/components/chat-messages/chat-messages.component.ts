import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageListComponent } from '../../../../shared/components/message-list/message-list.component';
import { MessageInputComponent } from '../../../../shared/components/message-input/message-input.component';

@Component({
  selector: 'app-chat-messages',
  imports: [CommonModule, MessageListComponent, MessageInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-1 overflow-y-auto">
      <app-message-list></app-message-list>
    </div>
    
    <!-- Message Input - Sticky to bottom -->
    @if (!isSessionDisabled()) {
      <div class="sticky bottom-0 left-0 right-0 z-10">
        <app-message-input (messageSent)="messageSent.emit($event)"></app-message-input>
      </div>
    } @else {
      <div class="sticky bottom-0 left-0 right-0 z-10">
        <div class="bg-[var(--secondary-bg)] border-t border-[var(--border-color)] p-4 text-center">
          <div class="max-w-md mx-auto">
            <p class="text-[var(--text-secondary)] text-sm mb-3">{{ disabledReason() }}</p>
            @if (hasSessionError()) {
              <button 
                class="px-4 py-2 bg-[var(--accent-blue)] text-[var(--text-primary)] rounded-md hover:bg-[var(--accent-hover)] transition-colors text-sm font-medium"
                (click)="clearError.emit()"
              >
                Start New Session
              </button>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ChatMessagesComponent {
  isSessionDisabled = input.required<boolean>();
  disabledReason = input.required<string>();
  hasSessionError = input.required<boolean>();
  
  messageSent = output<{ content: string }>();
  clearError = output<void>();
}
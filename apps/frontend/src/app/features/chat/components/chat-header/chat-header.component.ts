import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppStore } from '../../../../core/store/app.state';
import { WebSocketService } from '../../../../core/services/websocket.service';

@Component({
  selector: 'app-chat-header',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-b border-[var(--border-color)] p-4 bg-[var(--secondary-bg)] sticky top-0 z-90">
      <div class="flex items-center justify-between">
        <div>
          @if (appStore.currentQSession()) {
            <h1 class="text-xl font-semibold text-[var(--text-primary)]">{{ getProjectName(appStore.currentQSession()!.projectPath) }}</h1>
            } @else if (appStore.currentQConversation()) {
            <h1 class="text-xl font-semibold text-[var(--text-primary)]">{{ getProjectName(getProjectPathFromConversation()) }}</h1>
            } @else if (appStore.sessionStarting()) {
            <h1 class="text-xl font-semibold text-[var(--text-primary)]">Starting Amazon Q Session...</h1>
            <p class="text-sm text-[var(--text-secondary)] mt-1">Please wait while we start your session</p>
          } @else if (appStore.sessionError()) {
            <h1 class="text-xl font-semibold text-[var(--error)]">Session Start Failed</h1>
            <p class="text-sm text-[var(--error)] mt-1">Failed to start Amazon Q session</p>
          } @else {
            <h1 class="text-xl font-semibold text-[var(--text-primary)]">Quincy</h1>
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
          <span class="text-[var(--text-secondary)] font-medium">
            {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class ChatHeaderComponent {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);

  getProjectPathFromConversation(): string {
    // Amazon Q履歴からプロジェクトパスを取得
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
}
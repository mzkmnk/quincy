import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Chat Header -->
      <div class="border-b border-gray-200 p-4 bg-white">
        <div class="flex items-center justify-between">
          <div>
            @if (appStore.currentQSession()) {
              <h1 class="text-xl font-semibold text-gray-900">{{ getProjectName(appStore.currentQSession()!.projectPath) }}</h1>
              <p class="text-sm text-gray-500 mt-1">Amazon Q Session • {{ appStore.currentQSession()?.model || 'Default Model' }}</p>
            } @else if (appStore.currentQConversation()) {
              <h1 class="text-xl font-semibold text-gray-900">{{ getProjectName(getProjectPathFromConversation()) }}</h1>
              <p class="text-sm text-gray-500 mt-1">Amazon Q Conversation • {{ appStore.currentQConversation()?.model }}</p>
            } @else if (appStore.sessionStarting()) {
              <h1 class="text-xl font-semibold text-gray-900">Starting Amazon Q Session...</h1>
              <p class="text-sm text-gray-500 mt-1">Please wait while we start your session</p>
            } @else {
              <h1 class="text-xl font-semibold text-gray-900">Welcome to Quincy</h1>
              <p class="text-sm text-gray-500 mt-1">Select an Amazon Q project from the sidebar to view history or create a new project</p>
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
            <span class="text-gray-600 font-medium">
              {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 overflow-y-auto">
        @if (appStore.currentQSession()) {
          <!-- New Amazon Q Session -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Amazon Q Session Ready</h2>
              <p class="text-gray-500 mb-4 leading-relaxed">
                Your Amazon Q session for <strong>{{ getProjectName(appStore.currentQSession()!.projectPath) }}</strong> has been started successfully.
              </p>
              <div class="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                <p><strong>Session ID:</strong> {{ appStore.currentQSession()?.sessionId }}</p>
                <p><strong>Project Path:</strong> {{ appStore.currentQSession()?.projectPath }}</p>
                @if (appStore.currentQSession()?.model) {
                  <p><strong>Model:</strong> {{ appStore.currentQSession()?.model }}</p>
                }
              </div>
            </div>
          </div>
        } @else if (appStore.sessionStarting()) {
          <!-- Session Starting -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-blue-500 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Starting Amazon Q Session</h2>
              <p class="text-gray-500 mb-6 leading-relaxed">
                Please wait while we initialize your Amazon Q session...
              </p>
              <div class="text-sm text-gray-400">
                <p>🚀 Launching Amazon Q CLI</p>
                <p>🔗 Establishing connection</p>
                <p>📂 Setting up project workspace</p>
              </div>
            </div>
          </div>
        } @else if (appStore.currentQConversation()) {
          <!-- Amazon Q Conversation History -->
          <div class="p-4 space-y-4">
            @if (appStore.qHistoryLoading()) {
              <div class="text-center py-8">
                <div class="text-lg text-gray-600">Loading conversation history...</div>
              </div>
            } @else if (appStore.currentQConversation()?.transcript) {
              @for (message of appStore.currentQConversation()!.transcript; track $index; let isEven = $even) {
                <div class="mb-4">
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                      @if (isEven) {
                        <!-- User Message -->
                        <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        </div>
                      } @else {
                        <!-- Amazon Q Message -->
                        <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 mb-1">
                        {{ isEven ? 'You' : 'Amazon Q' }}
                      </div>
                      <div class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{{ message }}</div>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <div class="text-center text-gray-500 py-8">
                <div class="text-lg mb-2">📭 No conversation transcript available</div>
                <div class="text-sm">This project may not have any Amazon Q conversation history.</div>
              </div>
            }
          </div>
        } @else {
          <!-- Welcome/Empty State -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">View Amazon Q History</h2>
              <p class="text-gray-500 mb-6 leading-relaxed">
                Select an Amazon Q project from the sidebar to view conversation history and see your past interactions with Amazon Q.
              </p>
              <div class="space-y-2 text-sm text-gray-400">
                <p>🤖 View Amazon Q conversation transcripts</p>
                <p>📁 Browse your project history</p>
                <p>💬 See message counts and models used</p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Additional Information Panel -->
      @if (appStore.currentQConversation()) {
        <div class="border-t border-gray-200 bg-gray-50 p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-600">Conversation ID:</span>
              <p class="text-gray-800 font-mono text-xs truncate">{{ appStore.currentQConversation()?.conversation_id }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Model:</span>
              <p class="text-gray-800">{{ appStore.currentQConversation()?.model }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Messages:</span>
              <p class="text-gray-800">{{ appStore.currentQConversation()?.transcript?.length || 0 }}</p>
            </div>
            <div>
              <span class="font-medium text-gray-600">Tools:</span>
              <p class="text-gray-800">{{ getToolsDisplay(appStore.currentQConversation()?.tools) }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ChatComponent implements OnInit {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);

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
}
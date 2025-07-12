import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';
import type { ConversationMetadata, AmazonQConversation } from '@quincy/shared';

@Component({
  selector: 'app-amazon-q-history',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 max-w-screen-xl mx-auto">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 class="m-0 text-gray-800">Amazon Q History</h1>
        <div class="flex gap-2">
          <button 
            class="py-2 px-4 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600" 
            (click)="loadAllProjectsHistory()"
            [disabled]="appStore.qHistoryLoading()">
            {{ appStore.qHistoryLoading() ? 'Loading...' : 'Refresh All History' }}
          </button>
        </div>
      </header>

      @if (appStore.qHistoryLoading()) {
        <div class="text-center py-8 text-lg">Loading Amazon Q history...</div>
      }

      @if (appStore.error()) {
        <div class="text-center py-8 text-lg text-red-600 bg-red-50 border border-red-200 rounded p-4">
          {{ appStore.error() }}
        </div>
      }

      <!-- プロジェクト履歴一覧 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        @for (project of appStore.amazonQHistory(); track project.conversation_id) {
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm transition-all duration-200 hover:shadow-md"
               [class.border-purple-500]="isSelected(project)"
               [class.bg-purple-50]="isSelected(project)">
            <div class="mb-4">
              <h3 class="m-0 mb-2 text-gray-800">{{ getProjectName(project.projectPath) }}</h3>
              <div class="text-xs text-gray-500 space-y-1">
                <div>📁 {{ project.projectPath }}</div>
                <div>💬 Messages: {{ project.messageCount }}</div>
                <div>🤖 Model: {{ project.model }}</div>
                <div>🕒 {{ project.lastUpdated | date:'short' }}</div>
              </div>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button 
                class="py-1 px-3 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-xs font-medium transition-all duration-200 hover:bg-green-600" 
                (click)="viewHistory(project)">
                View History
              </button>
              <button 
                class="py-1 px-3 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-xs font-medium transition-all duration-200 hover:bg-blue-600" 
                (click)="resumeSession(project)">
                Resume
              </button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-12 text-gray-600">
            <p class="mb-4">No Amazon Q conversation history found.</p>
            <p class="text-sm text-gray-500">Start a conversation with Amazon Q in your projects to see history here.</p>
          </div>
        }
      </div>

      <!-- 選択された履歴の詳細 -->
      @if (appStore.currentQConversation()) {
        <div class="bg-white border border-gray-200 rounded-lg p-6 mt-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800">Conversation Details</h2>
            <button 
              class="py-1 px-3 border border-gray-300 rounded bg-gray-100 text-gray-700 cursor-pointer text-sm hover:bg-gray-200"
              (click)="clearSelectedConversation()">
              Close
            </button>
          </div>
          
          <div class="mb-4 p-4 bg-gray-50 rounded">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="font-medium text-gray-600">Conversation ID:</span>
                <p class="text-gray-800 font-mono text-xs">{{ appStore.currentQConversation()?.conversation_id }}</p>
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
                <p class="text-gray-800">{{ appStore.currentQConversation()?.tools?.join(', ') || 'None' }}</p>
              </div>
            </div>
          </div>

          <div class="conversation-transcript max-h-96 overflow-y-auto border border-gray-200 rounded p-4">
            @if (appStore.currentQConversation()?.transcript) {
              @for (message of appStore.currentQConversation()!.transcript; track $index; let isEven = $even) {
                <div class="mb-3 p-3 rounded" 
                     [class]="isEven ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'">
                  <div class="text-xs text-gray-500 mb-1">
                    {{ isEven ? '👤 User' : '🤖 Amazon Q' }}
                  </div>
                  <div class="text-sm text-gray-800 whitespace-pre-wrap">{{ message }}</div>
                </div>
              }
            } @else {
              <div class="text-center text-gray-500 py-4">
                No conversation transcript available.
              </div>
            }
          </div>
        </div>
      }

      <div class="flex gap-4 mt-8">
        <button 
          class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
          (click)="goBack()">
          Back to Projects
        </button>
      </div>
    </div>
  `,
})
export class AmazonQHistoryComponent implements OnInit, OnDestroy {
  protected appStore = inject(AppStore);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.setupWebSocketListeners();
    this.loadAllProjectsHistory();
    
    // URLパラメータまたはクエリパラメータで特定のプロジェクトが指定されている場合
    const projectPathParam = this.route.snapshot.paramMap.get('projectPath');
    const projectPathQuery = this.route.snapshot.queryParamMap.get('projectPath');
    const projectPath = projectPathParam || projectPathQuery;
    
    if (projectPath) {
      this.loadProjectHistory(decodeURIComponent(projectPath));
    }
  }

  ngOnDestroy(): void {
    this.webSocketService.removeQHistoryListeners();
  }

  private setupWebSocketListeners(): void {
    this.webSocketService.connect();
    
    this.webSocketService.setupQHistoryListeners(
      // q:history:data イベント
      (data) => {
        this.appStore.setCurrentQConversation(data.conversation);
        if (!data.conversation && data.message) {
          console.log('History message:', data.message);
        }
      },
      // q:history:list イベント
      (data) => {
        this.appStore.setAmazonQHistory(data.projects);
        console.log(`Loaded ${data.count} Amazon Q conversations`);
      }
    );
  }

  loadAllProjectsHistory(): void {
    this.appStore.setQHistoryLoading(true);
    this.webSocketService.getAllProjectsHistory();
  }

  loadProjectHistory(projectPath: string): void {
    this.appStore.setQHistoryLoading(true);
    this.webSocketService.getProjectHistory(projectPath);
  }

  viewHistory(project: ConversationMetadata): void {
    this.loadProjectHistory(project.projectPath);
  }

  resumeSession(project: ConversationMetadata): void {
    console.log(`Resuming session for project: ${project.projectPath}`);
    this.webSocketService.resumeSession(project.projectPath, project.conversation_id);
    
    // セッション復元後は chat ページに移動
    setTimeout(() => {
      this.router.navigate(['/chat']);
    }, 1000);
  }

  isSelected(project: ConversationMetadata): boolean {
    return this.appStore.currentQConversation()?.conversation_id === project.conversation_id;
  }

  getProjectName(projectPath: string): string {
    const parts = projectPath.split('/');
    return parts[parts.length - 1] || projectPath;
  }

  clearSelectedConversation(): void {
    this.appStore.setCurrentQConversation(null);
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}
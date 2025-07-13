import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';
import type { ConversationMetadata } from '@quincy/shared';

@Component({
  selector: 'app-projects',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 max-w-screen-xl mx-auto">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 class="m-0 text-gray-800">Amazon Q Projects</h1>
        <div class="flex gap-2">
          <button class="py-2 px-4 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600" 
                  (click)="loadQHistory()"
                  [disabled]="appStore.qHistoryLoading()">
            {{ appStore.qHistoryLoading() ? 'Loading...' : 'Refresh Q History' }}
          </button>
        </div>
      </header>

      @if (appStore.qHistoryLoading()) {
        <div class="text-center py-8 text-lg">Loading Amazon Q projects...</div>
      }

      @if (appStore.error()) {
        <div class="text-center py-8 text-lg text-red-600 bg-red-50 border border-red-200 rounded p-4">{{ appStore.error() }}</div>
      }

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
              <button class="py-2 px-4 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-green-600" 
                      (click)="selectProject(project)">
                {{ isSelected(project) ? 'Selected' : 'Select' }}
              </button>
              <button class="py-2 px-4 border border-purple-500 rounded bg-purple-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-purple-600" 
                      (click)="viewQHistory(project)">
                View History
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

      <div class="flex gap-4">
        <button class="py-2 px-4 border border-purple-400 rounded bg-purple-400 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-purple-500" 
                (click)="viewAllQHistory()">
          View All Q History
        </button>
        <button class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                (click)="goBack()">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
})
export class ProjectsComponent implements OnInit {
  protected appStore = inject(AppStore);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadQHistory();
    this.setupWebSocketListeners();
  }

  loadQHistory(): void {
    this.setupWebSocketListeners();
  }

  selectProject(project: ConversationMetadata): void {
    // Amazon Q履歴プロジェクトを選択状態に設定
    console.log('Selected Amazon Q project:', project);
  }

  isSelected(project: ConversationMetadata): boolean {
    return this.appStore.currentQConversation()?.conversation_id === project.conversation_id;
  }

  private setupWebSocketListeners(): void {
    this.webSocketService.connect();
    
    // WebSocket接続完了後に直接Amazon Q履歴を取得
    this.webSocketService.on('connect', () => {
      console.log('WebSocket connected, loading Amazon Q history...');
      this.webSocketService.getAllProjectsHistory();
    });
    
    // Amazon Q履歴リストを受信
    this.webSocketService.setupQHistoryListeners(
      // q:history:data イベント（個別履歴）
      (data) => {
        console.log('📋 Received history data:', data);
        this.appStore.setCurrentQConversation(data.conversation);
      },
      // q:history:list イベント（プロジェクト一覧）
      (data) => {
        console.log(`📋 Loaded ${data.count} Amazon Q conversations:`, data);
        this.appStore.setAmazonQHistory(data.projects);
      }
    );
  }

  viewQHistory(project: ConversationMetadata): void {
    // 特定のプロジェクトの履歴を表示
    this.router.navigate(['/amazon-q-history'], { 
      queryParams: { projectPath: encodeURIComponent(project.projectPath) } 
    });
  }

  getProjectName(projectPath: string): string {
    const parts = projectPath.split('/');
    return parts[parts.length - 1] || projectPath;
  }

  viewAllQHistory(): void {
    // 全プロジェクトの履歴を表示
    this.router.navigate(['/amazon-q-history']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
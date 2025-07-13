import { Component, input, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ConversationMetadata } from '@quincy/shared';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-123 flex flex-col overflow-y-auto">
      <!-- Fixed Header -->
      <div class="flex-shrink-0 p-4 pb-2" [class.p-2]="collapsed()">
        <div class="mb-3" [class.hidden]="collapsed()">
          <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amazon Q History</h3>
          @if (appStore.qHistoryLoading()) {
            <div class="text-xs text-gray-500 mt-1">Loading...</div>
          }
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto px-4 pb-4" [class.px-2]="collapsed()">
        @if (appStore.hasAmazonQHistory()) {
          <div class="space-y-1">
            @for (project of appStore.amazonQHistory(); track project.conversation_id) {
              <div
                class="group cursor-pointer rounded-lg transition-all duration-200 hover:bg-gray-50"
                [class.bg-blue-50]="project.conversation_id === appStore.currentQConversation()?.conversation_id"
                (click)="selectQProject(project)"
              >
                @if (!collapsed()) {
                  <div class="p-3">
                    <h4 class="text-sm font-medium text-gray-900 truncate">
                      {{ getProjectName(project.projectPath) }}
                    </h4>
                  </div>
                } @else {
                  <!-- Collapsed View -->
                  <div 
                    class="p-2 flex items-center justify-center"
                    [title]="getProjectName(project.projectPath)"
                  >
                    <div 
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                      [class.bg-purple-100]="project.conversation_id === appStore.currentQConversation()?.conversation_id"
                      [class.text-purple-600]="project.conversation_id === appStore.currentQConversation()?.conversation_id"
                      [class.bg-gray-100]="project.conversation_id !== appStore.currentQConversation()?.conversation_id"
                      [class.text-gray-600]="project.conversation_id !== appStore.currentQConversation()?.conversation_id"
                    >
                      {{ getProjectInitials(getProjectName(project.projectPath)) }}
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Empty State -->
          @if (!collapsed()) {
            <div class="text-center py-8">
              <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <p class="text-sm text-gray-500">No Amazon Q history</p>
              <p class="text-xs text-gray-400 mt-1">Start conversations with Amazon Q to see history</p>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class ProjectListComponent implements OnInit {
  collapsed = input<boolean>(false);
  protected appStore = inject(AppStore);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadAmazonQHistory();
  }

  private loadAmazonQHistory(): void {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    this.webSocketService.connect();

    // WebSocket接続完了後に認証
    this.webSocketService.on('connect', () => {
      console.log('WebSocket connected, authenticating...');
      this.webSocketService.emit('auth:request', { userId: 'amazon-q-user' });
    });

    // 認証成功後にAmazon Q履歴を取得
    this.webSocketService.on('auth:success', () => {
      console.log('Authentication successful, loading Amazon Q history...');
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

  selectQProject(project: ConversationMetadata): void {
    console.log('Selected Amazon Q project:', project);
    // プロジェクトの履歴を取得
    this.webSocketService.getProjectHistory(project.projectPath);
    // チャットページに移動
    this.router.navigate(['/chat']);
  }

  openQProjectMenu(project: ConversationMetadata): void {
    // TODO: Implement Amazon Q project menu (resume session, etc.)
    console.log('Open Amazon Q project menu for:', project.projectPath);
  }

  getProjectName(projectPath: string): string {
    const parts = projectPath.split('/');
    return parts[parts.length - 1] || projectPath;
  }

  getProjectInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
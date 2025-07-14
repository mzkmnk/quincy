import { Component, input, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ConversationMetadata } from '@quincy/shared';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Message } from 'primeng/message';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule, ProgressSpinner, Message, Button, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-1 flex-col">
      <!-- Fixed Header -->
      <div class="flex-shrink-0 p-4 pb-2" [class.p-2]="collapsed()">
        <div class="mb-3" [class.hidden]="collapsed()">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider">Amazon Q History</h3>
          @if (appStore.qHistoryLoading()) {
            <div class="flex items-center gap-2 text-xs text-surface-500 mt-1">
              <p-progressSpinner [style]="{ width: '12px', height: '12px' }" strokeWidth="6" />
              Loading...
            </div>
          } @else if (appStore.error()) {
            <p-message 
              severity="error" 
              [text]="appStore.error() || ''" 
              [closable]="false"
              class="mt-1 text-xs cursor-pointer"
              (click)="retryLoadHistory()"
              title="クリックして再試行"
            />
          }
        </div>
      </div>

      <!-- Scrollable Content -->
      <div 
        class="flex h-140 overflow-y-auto px-4 pb-4" 
        [class.px-2]="collapsed()"
        (wheel)="onWheel($event)"
      >
        @if (appStore.hasAmazonQHistory()) {
          <div class="w-full">
            @for (project of appStore.amazonQHistory(); track project.conversation_id) {
              <div
                class="group cursor-pointer rounded-lg transition-all duration-200 hover:bg-surface-50 mb-1"
                [class.bg-blue-50]="project.conversation_id === appStore.currentQConversation()?.conversation_id"
                (click)="selectQProject(project)"
              >
                @if (!collapsed()) {
                  <div class="p-3">
                    <h4 class="text-sm font-medium text-surface-900 truncate">
                      {{ getProjectName(project.projectPath) }}
                    </h4>
                  </div>
                } @else {
                  <!-- Collapsed View -->
                  <div 
                    class="p-2 flex items-center justify-center"
                    [title]="getProjectName(project.projectPath)"
                  >
                    <p-avatar 
                      [label]="getProjectInitials(getProjectName(project.projectPath))"
                      size="normal"
                      [style]="{ 
                        backgroundColor: project.conversation_id === appStore.currentQConversation()?.conversation_id ? '#dbeafe' : '#f3f4f6',
                        color: project.conversation_id === appStore.currentQConversation()?.conversation_id ? '#2563eb' : '#6b7280'
                      }"
                    />
                  </div>
                }
              </div>
            }
          </div>
        } @else if (!appStore.qHistoryLoading() && !appStore.error()) {
          <!-- Empty State -->
          @if (!collapsed()) {
            <div class="text-center py-8">
              <i class="pi pi-comments text-surface-300 text-4xl mb-4 block"></i>
              <p class="text-sm text-surface-500">No Amazon Q history</p>
              <p class="text-xs text-surface-400 mt-1">Start conversations with Amazon Q to see history</p>
            </div>
          }
        } @else if (appStore.error()) {
          <!-- Error State -->
          @if (!collapsed()) {
            <div class="text-center py-8">
              <i class="pi pi-exclamation-triangle text-red-300 text-4xl mb-4 block"></i>
              <p class="text-sm text-red-600 mb-2">履歴取得エラー</p>
              <p class="text-xs text-surface-500 mb-4">{{ appStore.error() }}</p>
              <p-button 
                label="再試行"
                icon="pi pi-refresh"
                size="small"
                (onClick)="retryLoadHistory()"
              />
            </div>
          }
        }
      </div>
    </div>
  `
})
export class ProjectListComponent implements OnInit, OnDestroy {
  collapsed = input<boolean>(false);
  protected appStore = inject(AppStore);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadAmazonQHistory();
  }

  ngOnDestroy(): void {
    // コンポーネント破棄時にリスナーをクリーンアップ
    this.webSocketService.removeQHistoryListeners();
  }

  private loadAmazonQHistory(): void {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    // リスナーの重複登録を防止
    this.webSocketService.removeQHistoryListeners();

    this.webSocketService.connect();

    // 接続状態を確認して適切に履歴を取得
    this.loadHistoryWithConnectionCheck();

    // Amazon Q履歴リストを受信
    this.webSocketService.setupQHistoryListeners(
      // q:history:data イベント（個別履歴）
      (data) => {
        console.log('📋 Received history data:', data);
        if (data.conversation) {
          // 履歴表示モードに切り替え
          this.appStore.switchToHistoryView(data.conversation);
        }
      },
      // q:history:list イベント（プロジェクト一覧）
      (data) => {
        console.log(`📋 Loaded ${data.count} Amazon Q conversations:`, data);
        this.appStore.setAmazonQHistory(data.projects);
      }
    );

    // 履歴更新通知を受信
    this.webSocketService.on('q:history:updated', () => {
      console.log('📋 History updated, refreshing history list...');
      this.requestHistoryWithRetry();
    });

    // エラーハンドリングの追加
    this.webSocketService.on('error', (error: any) => {
      console.error('❌ WebSocket error during history loading:', error);
      this.appStore.setQHistoryLoading(false);
      this.appStore.setError(`履歴の取得に失敗しました: ${error.message || '不明なエラー'}`);
    });
  }

  /**
   * 接続状態を確認して適切に履歴を取得
   */
  private loadHistoryWithConnectionCheck(): void {
    // ローディング状態を開始
    this.appStore.setQHistoryLoading(true);

    if (this.webSocketService.connected()) {
      // 既に接続済みの場合は即座に履歴取得
      console.log('🔌 WebSocket already connected, loading history immediately');
      this.requestHistoryWithRetry();
    } else {
      // 未接続の場合は接続完了を待つ
      console.log('🔌 WebSocket not connected, waiting for connection...');
      this.webSocketService.on('connect', () => {
        console.log('🔌 WebSocket connected, loading Amazon Q history...');
        this.requestHistoryWithRetry();
      });
    }
  }

  /**
   * リトライ機能付きの履歴取得
   */
  private async requestHistoryWithRetry(maxRetries = 3, retryDelay = 1000): Promise<void> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.webSocketService.getAllProjectsHistory();
        console.log(`✅ History request successful on attempt ${attempt + 1}`);
        return;
      } catch (error) {
        attempt++;
        console.warn(`⚠️ History request failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt >= maxRetries) {
          console.error('❌ All history request attempts failed');
          this.appStore.setQHistoryLoading(false);
          this.appStore.setError('履歴の取得に失敗しました。ページを再読み込みしてください。');
          return;
        }

        // 指数バックオフで再試行
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  selectQProject(project: ConversationMetadata): void {
    console.log('Selected Amazon Q project:', project);

    // 現在のアクティブセッションをクリア（重要！）
    this.appStore.clearCurrentView();

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

  /**
   * 履歴取得の再試行
   */
  retryLoadHistory(): void {
    console.log('🔄 Retrying history load...');
    this.appStore.clearError();
    this.loadAmazonQHistory();
  }

  /**
   * スクロールイベントの伝播を制御
   */
  onWheel(event: WheelEvent): void {
    const element = event.target as HTMLElement;
    const container = element.closest('.overflow-y-auto');

    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // 上端で上スクロール、または下端で下スクロールの場合のみ伝播を防ぐ
      if ((isAtTop && event.deltaY < 0) || (isAtBottom && event.deltaY > 0)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
}
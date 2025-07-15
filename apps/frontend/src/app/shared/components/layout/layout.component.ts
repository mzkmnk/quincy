import { Component, signal, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProjectPathModalComponent, ProjectPathSelection } from '../project-path-modal/project-path-modal.component';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, SidebarComponent, ProjectPathModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-gray-50">
      <!-- Sidebar -->
      <aside 
        class="fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40"
        [class.w-80]="!sidebarCollapsed()"
        [class.w-16]="sidebarCollapsed()"
        [class.translate-x-0]="!mobileMenuHidden() || window.innerWidth >= 768"
        [class.-translate-x-full]="mobileMenuHidden() && window.innerWidth < 768"
      >
        <!-- Sidebar Header -->
        <div class="p-4 border-b border-gray-200 flex items-center">
          <button
            (click)="toggleSidebar()"
            class="p-2 rounded-md hover:bg-gray-100 transition-colors"
            [class.hidden]="window.innerWidth < 768"
          >
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 
            class="text-xl font-semibold text-gray-900 ml-2 transition-opacity duration-300"
            [class.opacity-0]="sidebarCollapsed()"
            [class.hidden]="sidebarCollapsed()"
          >
            Quincy
          </h1>
        </div>

        <!-- Sidebar Content -->
        <div class="flex-1 h-0">
          <app-sidebar 
            [collapsed]="sidebarCollapsed()"
          ></app-sidebar>
        </div>
      </aside>

      <!-- Mobile Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        [class.hidden]="mobileMenuHidden()"
        (click)="closeMobileMenu()"
      ></div>

      <!-- Main Content Area -->
      <main 
        class="flex-1 transition-all duration-300"
        [class.ml-80]="!sidebarCollapsed() && window.innerWidth >= 768"
        [class.ml-16]="sidebarCollapsed() && window.innerWidth >= 768"
        [class.ml-0]="window.innerWidth < 768"
      >
        <!-- Mobile Header -->
        <div class="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            (click)="toggleMobileMenu()"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-gray-900">Quincy</h1>
          <div class="w-10"></div> <!-- Spacer for centering -->
        </div>

        <!-- Router Outlet -->
        <div class="h-full">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Project Path Modal (全画面表示) -->
      <app-project-path-modal 
        (confirmed)="onProjectPathConfirmed($event)"
        (cancelled)="onProjectPathCancelled()"
      />
    </div>
  `
})
export class LayoutComponent {
  protected sidebarCollapsed = signal(false);
  protected mobileMenuHidden = signal(true);
  protected window = window;
  protected appStore = inject(AppStore);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);
  
  projectPathModal = viewChild.required(ProjectPathModalComponent);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  toggleMobileMenu(): void {
    this.mobileMenuHidden.update(hidden => !hidden);
  }

  closeMobileMenu(): void {
    this.mobileMenuHidden.set(true);
  }

  showProjectModal(): void {
    this.projectPathModal().show();
  }

  onProjectPathConfirmed(selection: ProjectPathSelection): void {
    console.log('Project path confirmed:', selection);
    this.startProjectSession(selection.path, selection.resume);
  }

  onProjectPathCancelled(): void {
    console.log('Project path selection cancelled');
  }

  private startProjectSession(projectPath: string, resume: boolean): void {
    try {
      console.log('Starting project session:', { projectPath, resume });

      // WebSocket接続を確認
      this.webSocketService.connect();

      // 現在の表示状態をクリアしてセッション開始状態をセット
      this.appStore.clearCurrentView();
      this.appStore.setSessionStarting(true);

      // プロジェクトセッションを開始
      this.webSocketService.startProjectSession(projectPath, resume);

      // セッション開始の通知を受け取るリスナーを設定
      this.webSocketService.setupProjectSessionListeners((data) => {
        console.log('Amazon Q session started:', data);
        
        // アクティブセッションモードに切り替え
        this.appStore.switchToActiveSession(data);
        
        // チャット画面に移動
        this.router.navigate(['/chat']);
      });

      // エラーハンドリングのリスナーを設定
      this.webSocketService.on('error', (error: { code?: string; message?: string; [key: string]: unknown }) => {
        console.error('WebSocket error:', error);
        
        let userMessage = 'セッションの開始中にエラーが発生しました。';
        
        if (error.code === 'Q_CLI_NOT_AVAILABLE' || error.code === 'Q_CLI_NOT_FOUND') {
          userMessage = 'Amazon Q CLIが見つかりません。Amazon Q CLIをインストールしてから再度お試しください。';
        } else if (error.code === 'Q_CLI_PERMISSION_ERROR') {
          userMessage = 'Amazon Q CLIの実行権限がありません。ファイルの権限を確認してください。';
        } else if (error.code === 'Q_CLI_SPAWN_ERROR') {
          userMessage = 'Amazon Q CLIプロセスの起動に失敗しました。インストールを確認してください。';
        }
        
        // エラー状態をストアに保存
        this.appStore.setSessionError(userMessage);
        
        // チャット画面に移動してエラーを表示
        this.router.navigate(['/chat']);
      });

      // チャット画面に移動（ローディング状態を表示）
      this.router.navigate(['/chat']);

    } catch (error) {
      console.error('Error starting project session:', error);
      this.appStore.setSessionError('プロジェクトセッションの開始中にエラーが発生しました。');
      this.router.navigate(['/chat']);
    }
  }
}
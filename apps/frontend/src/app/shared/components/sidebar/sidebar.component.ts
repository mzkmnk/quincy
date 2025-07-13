import { Component, input, inject, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { ProjectListComponent } from '../project-list/project-list.component';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ProjectPathModalComponent, ProjectPathSelection } from '../project-path-modal/project-path-modal.component';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, ProjectListComponent, ProjectPathModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <!-- New Project Button -->
      <div class="p-4">
        <button
          class="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
          [class.hidden]="collapsed()"
          (click)="createNewProject()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Project
        </button>
        <button
          class="w-full p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center"
          [class.hidden]="!collapsed()"
          (click)="createNewProject()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </button>
      </div>

      <!-- Projects List -->
      <app-project-list [collapsed]="collapsed()"></app-project-list>

      <!-- Navigation Links (Legacy) -->
      <div class="border-t border-gray-100 p-4 space-y-2" [class.hidden]="collapsed()">
        <a routerLink="/dashboard" routerLinkActive="bg-blue-50 text-blue-600 border-blue-200" 
           class="block w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
          Dashboard
        </a>
        <a routerLink="/projects" routerLinkActive="bg-blue-50 text-blue-600 border-blue-200"
           class="block w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
          Projects
        </a>
        <a routerLink="/sessions" routerLinkActive="bg-blue-50 text-blue-600 border-blue-200"
           class="block w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
          Sessions
        </a>
      </div>

      <!-- Collapsed Navigation -->
      <div class="border-t border-gray-100 p-2 space-y-2" [class.hidden]="!collapsed()">
        <a routerLink="/dashboard" routerLinkActive="bg-blue-50 text-blue-600" 
           class="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
           title="Dashboard">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
          </svg>
        </a>
        <a routerLink="/projects" routerLinkActive="bg-blue-50 text-blue-600"
           class="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
           title="Projects">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </a>
        <a routerLink="/sessions" routerLinkActive="bg-blue-50 text-blue-600"
           class="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
           title="Sessions">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </a>
      </div>

      <!-- Project Path Modal -->
      <app-project-path-modal 
        (confirmed)="onProjectPathConfirmed($event)"
        (cancelled)="onProjectPathCancelled()"
      />
    </div>
  `
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  protected appStore = inject(AppStore);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);
  
  projectPathModal = viewChild.required(ProjectPathModalComponent);

  createNewProject(): void {
    // モーダルを表示
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

      // セッション開始状態をセット
      this.appStore.setSessionStarting(true);
      this.appStore.setCurrentQConversation(null);
      this.appStore.setSessionError(null); // エラー状態をクリア

      // プロジェクトセッションを開始
      this.webSocketService.startProjectSession(projectPath, resume);

      // セッション開始の通知を受け取るリスナーを設定
      this.webSocketService.setupProjectSessionListeners((data) => {
        console.log('Amazon Q session started:', data);
        
        // セッション情報をストアに保存
        this.appStore.setCurrentQSession(data);
        this.appStore.setSessionStarting(false);
        
        // チャット画面に移動
        this.router.navigate(['/chat']);
      });

      // エラーハンドリングのリスナーを設定
      this.webSocketService.on('error', (error: any) => {
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
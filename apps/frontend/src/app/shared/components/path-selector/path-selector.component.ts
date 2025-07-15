import { Component, signal, ViewChild, ElementRef, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Router } from '@angular/router';

export interface PathSelection {
  path: string;
  resume: boolean;
}

@Component({
  selector: 'app-path-selector',
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "min-w-full"
  },
  template: `
    <div class="flex items-center justify-center">
      <div class="flex w-8/12"> 
        <!-- Path Input Area -->
        <div class="flex gap-2 flex-col w-full bg-white border-1 border-gray-200 rounded-3xl p-2 mb-4">
          <!-- Path Input -->
          <textarea
            #pathTextarea
            [(ngModel)]="projectPath"
            (keydown)="onKeyDown($event)"
            placeholder="プロジェクトのパスを入力してください（例: /Users/username/my-project）"
            class="m-2 focus:outline-none resize-none placeholder:text-gray-500"
            rows="1"
          ></textarea>

          <!-- Input Footer -->
          <div class="flex w-full justify-end">
            <p-button
              (onClick)="startProject()"
              [disabled]="!canStart()"
              [loading]="starting()"
              icon="pi pi-arrow-right"
              [rounded]="true"
              [text]="false"
              [raised]="true"
              severity="contrast"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>
  `
})
export class PathSelectorComponent {
  @ViewChild('pathTextarea') pathTextarea!: ElementRef<HTMLTextAreaElement>;

  private appStore = inject(AppStore);
  private websocket = inject(WebSocketService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  // Events
  pathSelected = output<PathSelection>();

  projectPath = signal<string>('');
  starting = signal(false);

  canStart(): boolean {
    return this.projectPath().trim().length > 0 && !this.starting();
  }

  async startProject(): Promise<void> {
    if (!this.canStart()) return;

    const path = this.projectPath().trim();
    this.starting.set(true);

    try {
      console.log('Starting project session:', path);

      // WebSocket接続を確認
      this.websocket.connect();

      // 現在の表示状態をクリアしてセッション開始状態をセット
      this.appStore.clearCurrentView();
      this.appStore.setSessionStarting(true);

      // プロジェクトセッションを開始
      this.websocket.startProjectSession(path, false);

      // セッション開始の通知を受け取るリスナーを設定
      this.websocket.setupProjectSessionListeners((data) => {
        console.log('Amazon Q session started:', data);

        // アクティブセッションモードに切り替え
        this.appStore.switchToActiveSession(data);

        // チャット画面に移動
        this.router.navigate(['/chat']);
      });

      // エラーハンドリングのリスナーを設定
      this.websocket.on('error', (error: { code?: string; message?: string;[key: string]: unknown }) => {
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
        this.starting.set(false);
      });

    } catch (error) {
      console.error('Error starting project session:', error);
      this.appStore.setSessionError('プロジェクトセッションの開始中にエラーが発生しました。');
      this.messageService.add({
        severity: 'error',
        summary: 'エラー',
        detail: 'プロジェクトの開始に失敗しました',
        life: 5000
      });
      this.starting.set(false);
    }
  }

  selectFolder(): void {
    // ブラウザ環境では直接フォルダ選択はできないため、
    // ユーザーに手動入力を促すメッセージを表示
    this.messageService.add({
      severity: 'info',
      summary: '情報',
      detail: 'プロジェクトフォルダの絶対パスを入力してください',
      life: 3000
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.startProject();
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Allow new line
      setTimeout(() => this.adjustTextareaHeight(), 0);
    }
  }

  private adjustTextareaHeight(): void {
    if (this.pathTextarea) {
      const textarea = this.pathTextarea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }
}
import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ProjectPathSelection {
  path: string;
  resume: boolean;
}

@Component({
  selector: 'app-project-path-modal',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto" [class.hidden]="!isVisible()">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="close()"></div>
      
      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">新規プロジェクト作成</h3>
            <button 
              class="text-gray-400 hover:text-gray-600 transition-colors"
              (click)="close()"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Path Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                プロジェクトパス <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="projectPath"
                  placeholder="/Users/username/my-project"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  [class.border-red-500]="pathError()"
                  (input)="validatePath()"
                  (keydown.enter)="startProject()"
                />
                @if (supportsFileSystemAccess()) {
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    (click)="selectFolder()"
                  >
                    選択
                  </button>
                }
              </div>
              @if (pathError()) {
                <p class="mt-1 text-sm text-red-600">{{ pathError() }}</p>
              }
            </div>

            <!-- Resume Option -->
            <div class="flex items-center">
              <input
                type="checkbox"
                id="resume"
                [(ngModel)]="resumeSession"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="resume" class="ml-2 text-sm text-gray-700">
                既存のセッションを再開する（--resumeオプション）
              </label>
            </div>

            <!-- Hints -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex">
                <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="ml-2">
                  <p class="text-sm font-medium text-blue-800">ヒント:</p>
                  <ul class="mt-1 text-sm text-blue-700">
                    <li>• 絶対パスを入力してください</li>
                    <li>• 例: /Users/username/projects/my-app</li>
                    <li>• プロジェクトのルートディレクトリを指定</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                (click)="close()"
              >
                キャンセル
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                [disabled]="!isValidPath()"
                (click)="startProject()"
              >
                プロジェクト開始
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProjectPathModalComponent {
  isVisible = signal(false);
  pathError = signal<string | null>(null);
  
  projectPath = '';
  resumeSession = false;

  // Events
  confirmed = output<ProjectPathSelection>();
  cancelled = output<void>();

  show(): void {
    this.isVisible.set(true);
    this.reset();
  }

  close(): void {
    this.isVisible.set(false);
    this.cancelled.emit();
  }

  private reset(): void {
    this.projectPath = '';
    this.resumeSession = false;
    this.pathError.set(null);
  }

  validatePath(): void {
    if (!this.projectPath.trim()) {
      this.pathError.set('パスを入力してください');
      return;
    }

    // 基本的なパス形式チェック
    const path = this.projectPath.trim();
    
    if (path.length < 2) {
      this.pathError.set('有効なパスを入力してください');
      return;
    }

    // 絶対パスチェック（Unix/Linux/Mac）
    if (!path.startsWith('/') && !path.match(/^[A-Za-z]:\\/)) {
      this.pathError.set('絶対パスを入力してください（例: /Users/username/project）');
      return;
    }

    // 危険な文字列チェック
    if (path.includes('..') || path.includes('//')) {
      this.pathError.set('無効な文字が含まれています');
      return;
    }

    this.pathError.set(null);
  }

  isValidPath(): boolean {
    return this.projectPath.trim().length > 0 && !this.pathError();
  }

  startProject(): void {
    this.validatePath();
    if (this.isValidPath()) {
      this.confirmed.emit({
        path: this.projectPath.trim(),
        resume: this.resumeSession
      });
      this.close();
    }
  }

  supportsFileSystemAccess(): boolean {
    return 'showDirectoryPicker' in window;
  }

  async selectFolder(): Promise<void> {
    if (!this.supportsFileSystemAccess()) {
      return;
    }

    try {
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });

      if (directoryHandle) {
        // File System Access APIの制約により完全パスは取得できないため、
        // ユーザーにパスの入力を促す
        this.projectPath = `/path/to/${directoryHandle.name}`;
        this.pathError.set('上記のパスを実際のフォルダパスに修正してください');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error selecting folder:', error);
      }
    }
  }
}
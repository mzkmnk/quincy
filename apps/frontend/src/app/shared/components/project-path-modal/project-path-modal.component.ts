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
    <div class="fixed inset-0 z-[9999] overflow-y-auto" [class.hidden]="!isVisible()">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black opacity-25 transition-opacity" (click)="close()"></div>
      
      <!-- Modal -->
      <div class="relative flex min-h-full items-center justify-center p-6">
        <div class="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-8 shadow-2xl transition-all z-10">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-2xl font-bold text-gray-900">新規プロジェクト作成</h3>
              <p class="text-gray-600 mt-2">Amazon Q CLIを使用して新しいプロジェクトセッションを開始します</p>
            </div>
            <button 
              class="text-gray-400 hover:text-gray-600 transition-colors p-2"
              (click)="close()"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- Path Input -->
            <div>
              <label class="block text-lg font-medium text-gray-700 mb-3">
                プロジェクトパス <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="projectPath"
                  placeholder="/Users/username/my-project"
                  class="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white placeholder:text-gray-500"
                  [class.border-red-500]="pathError()"
                  [class.bg-red-50]="pathError()"
                  (input)="validatePath()"
                  (keydown.enter)="startProject()"
                />
              </div>
              @if (pathError()) {
                <p class="mt-2 text-sm text-red-600 font-medium">{{ pathError() }}</p>
              }
            </div>

            <!-- Resume Option -->
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="resume"
                  [(ngModel)]="resumeSession"
                  class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="resume" class="ml-3 text-base text-gray-700 font-medium">
                  既存のセッションを再開する（--resumeオプション）
                </label>
              </div>
              <p class="mt-2 ml-8 text-sm text-gray-600">
                プロジェクト内の以前の会話履歴を引き継いでセッションを開始します
              </p>
            </div>

            <!-- Hints -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <div class="flex">
                <svg class="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="ml-4">
                  <p class="text-base font-semibold text-blue-800">💡 パス入力のヒント</p>
                  <ul class="mt-3 space-y-2 text-sm text-blue-700">
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      <span>絶対パスを入力してください（相対パス不可）</span>
                    </li>
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      <span>例: <code class="bg-blue-100 px-2 py-1 rounded text-xs">/Users/username/projects/my-app</code></span>
                    </li>
                    <li class="flex items-center">
                      <span class="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      <span>プロジェクトのルートディレクトリを指定してください</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                class="px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                (click)="close()"
              >
                キャンセル
              </button>
              <button
                type="button"
                class="px-8 py-3 text-base font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
                [disabled]="!isValidPath()"
                (click)="startProject()"
              >
                🚀 プロジェクト開始
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

}
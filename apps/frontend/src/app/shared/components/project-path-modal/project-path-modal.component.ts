import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';

export interface ProjectPathSelection {
  path: string;
  resume: boolean;
}

@Component({
  selector: 'app-project-path-modal',
  imports: [CommonModule, FormsModule, Button, Dialog, InputText, Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog 
      [(visible)]="isVisible" 
      [modal]="true" 
      header="新規プロジェクト作成"
      [style]="{ width: '50rem' }"
      [closable]="true"
      [draggable]="false"
      (onHide)="close()">
      
      <p class="mb-6 text-surface-600">Amazon Q CLIを使用して新しいプロジェクトセッションを開始します</p>
      
      <!-- Path Input -->
      <div class="mb-6">
        <label class="block text-lg font-medium mb-3">
          プロジェクトパス <span class="text-red-500">*</span>
        </label>
        <input 
          pInputText 
          type="text"
          [(ngModel)]="projectPath"
          placeholder="/Users/username/my-project"
          class="w-full"
          [class.ng-invalid]="pathError()"
          (input)="validatePath()"
          (keydown.enter)="startProject()"
        />
        @if (pathError()) {
          <small class="text-red-500 block mt-2">{{ pathError() }}</small>
        }
      </div>

      <!-- Resume Option -->
      <div class="mb-6 p-4 bg-surface-100 rounded-lg">
        <div class="flex items-center mb-3">
          <p-checkbox 
            [(ngModel)]="resumeSession" 
            [binary]="true"
            inputId="resume"
            class="mr-3"
          />
          <label for="resume" class="text-base font-medium">
            既存のセッションを再開する（--resumeオプション）
          </label>
        </div>
        <p class="text-sm text-surface-600 ml-8">
          プロジェクト内の以前の会話履歴を引き継いでセッションを開始します
        </p>
      </div>

      <!-- Hints -->
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex">
          <i class="pi pi-info-circle text-blue-500 text-xl mr-3 mt-1"></i>
          <div>
            <p class="text-base font-semibold text-blue-800 mb-3">💡 パス入力のヒント</p>
            <ul class="space-y-2 text-sm text-blue-700">
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

      <div class="flex gap-2 justify-end">
        <p-button 
          label="キャンセル" 
          icon="pi pi-times" 
          severity="secondary"
          (onClick)="close()"
        />
        <p-button 
          label="🚀 プロジェクト開始" 
          icon="pi pi-play" 
          [disabled]="!isValidPath()"
          (onClick)="startProject()"
        />
      </div>
    </p-dialog>
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
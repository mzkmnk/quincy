import { Component, signal, ViewChild, ElementRef, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { Router } from '@angular/router';

import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';

import { validatePath, isValidPath, canStartProject } from './services/path-validator';
import { startProject } from './services/session-starter';

// 分離されたユーティリティのインポート
import { adjustTextareaHeight, handleKeyDown, toggleResumeOption, selectFolder } from './utils';

export interface PathSelection {
  path: string;
  resume: boolean;
}

@Component({
  selector: 'app-path-selector',
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, CheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "min-w-full"
  },
  template: `
    <div class="flex items-center justify-center">
      <div class="flex w-8/12"> 
        <!-- Path Input Area -->
        <div class="flex gap-4 flex-col w-full bg-[var(--secondary-bg)] border-1 border-[var(--border-color)] rounded-3xl p-4 mb-4">
          <!-- Path Input -->
          <div>
            <textarea
              #pathTextarea
              [(ngModel)]="projectPath"
              (keydown)="onKeyDown($event)"
              (input)="onValidatePath()"
              placeholder="プロジェクトのパスを入力してください（例: /Users/username/my-project）"
              class="w-full focus:outline-none resize-none placeholder:text-[var(--text-muted)] border-0 p-2 bg-transparent text-[var(--text-primary)]"
              [class.border-red-300]="pathError()"
              rows="1"
            ></textarea>
            @if (pathError()) {
              <small class="text-[var(--error)] block mt-1 ml-2">{{ pathError() }}</small>
            }
          </div>

          <!-- Input Footer -->
          <div class="flex w-full justify-between">
            <!-- resume button -->
            <p-button
              (onClick)="onToggleResumeOption()"
              icon="pi pi-history"
              [style]="{
                'background-color': 'transparent',
                'border-color': 'transparent',
                'color': resumeSession() ? 'var(--accent-blue)' : 'var(--text-muted)'
              }"
              [text]="true"
              size="small"
              [attr.aria-pressed]="resumeSession()"
              [attr.title]="resumeSession() ? '履歴を引き継ぐ（ON）' : '履歴を引き継ぐ（OFF）'"
            />

            <!-- submit button  -->
            <p-button
              (onClick)="onStartProject()"
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
  resumeSession = signal<boolean>(false);
  pathError = signal<string | null>(null);

  // 分離されたサービス関数をコンポーネントメソッドとして公開
  canStart = (): boolean => {
    return canStartProject(this.projectPath(), this.pathError(), this.starting());
  };

  isValidPath = (): boolean => {
    return isValidPath(this.projectPath(), this.pathError());
  };

  onValidatePath = (): void => {
    const path = this.projectPath();
    const error = validatePath(path);
    this.pathError.set(error);
  };

  onStartProject = async (): Promise<void> => {
    if (!this.canStart()) return;

    await startProject(
      this.projectPath(),
      this.resumeSession(),
      this.websocket,
      this.appStore,
      this.messageService,
      this.router,
      this.starting
    );
  };

  onToggleResumeOption = (): void => {
    toggleResumeOption(this.resumeSession(), this.resumeSession);
  };

  selectFolder = (): void => {
    selectFolder(this.messageService);
  };

  onKeyDown = (event: KeyboardEvent): void => {
    handleKeyDown(
      event,
      this.onStartProject,
      () => this.adjustTextareaHeight()
    );
  };

  private adjustTextareaHeight = (): void => {
    adjustTextareaHeight(this.pathTextarea);
  };
}
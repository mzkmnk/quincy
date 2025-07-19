import { Component, input, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectListComponent } from '../project-list/project-list.component';
import { AppStore } from '../../../core/store/app.state';
import { shouldShowFullButton, shouldShowIconButton } from './utils';
import { handleNewProject } from './services';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, ProjectListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <!-- New Project Button -->
      <div class="p-4">
        <button
          class="w-full px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--tertiary-bg)] border border-[var(--border-color)] rounded-md hover:bg-[var(--hover-bg)] transition-colors flex items-center justify-center gap-2"
          [class.hidden]="!showFullButton()"
          (click)="createNewProject()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Project
        </button>
        <button
          class="w-full p-2 text-[var(--text-primary)] bg-[var(--tertiary-bg)] border border-[var(--border-color)] rounded-md hover:bg-[var(--hover-bg)] transition-colors flex items-center justify-center"
          [class.hidden]="!showIconButton()"
          (click)="createNewProject()"
          title="New Project"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </button>
      </div>

      <!-- Projects List -->
      <app-project-list [collapsed]="collapsed()"></app-project-list>


    </div>
  `
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  
  private router = inject(Router);
  private appStore = inject(AppStore);

  showFullButton = computed(() => shouldShowFullButton(this.collapsed()));
  showIconButton = computed(() => shouldShowIconButton(this.collapsed()));

  createNewProject(): void {
    handleNewProject(this.router, this.appStore);
  }
}
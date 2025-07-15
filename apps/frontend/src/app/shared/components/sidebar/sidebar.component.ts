import { Component, input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectListComponent } from '../project-list/project-list.component';
import { AppStore } from '../../../core/store/app.state';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, ProjectListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <!-- New Project Button -->
      <div class="p-4">
        <button
          class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          [class.hidden]="collapsed()"
          (click)="createNewProject()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Project
        </button>
        <button
          class="w-full p-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
          [class.hidden]="!collapsed()"
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

  createNewProject(): void {
    // 現在の状態をクリアしてプロジェクト未選択状態にする
    this.appStore.clearCurrentView();
    // /chatページに移動
    this.router.navigate(['/chat']);
  }
}
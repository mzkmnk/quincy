import { Component, input, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectListComponent } from '../project-list/project-list.component';

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
  
  // モーダル表示要求を親コンポーネントに通知
  newProjectRequested = output<void>();

  createNewProject(): void {
    // 親コンポーネントにモーダル表示を要求
    this.newProjectRequested.emit();
  }
}
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
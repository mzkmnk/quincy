import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { Project, Session } from '@quincy/shared';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4" [class.p-2]="collapsed()">
      <!-- Projects Section Header -->
      <div class="mb-3" [class.hidden]="collapsed()">
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</h3>
      </div>

      <!-- Projects List -->
      @if (appStore.hasProjects()) {
        <div class="space-y-1">
          @for (project of appStore.projects(); track project.id) {
            <div
              class="group cursor-pointer rounded-lg transition-all duration-200 hover:bg-gray-50"
              [class.bg-blue-50]="project.id === appStore.currentProject()?.id"
              [class.border-l-2]="project.id === appStore.currentProject()?.id"
              [class.border-blue-500]="project.id === appStore.currentProject()?.id"
              (click)="selectProject(project)"
            >
              @if (!collapsed()) {
                <div class="p-3">
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-medium text-gray-900 truncate">
                        {{ project.name }}
                      </h4>
                    </div>
                    <div class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        class="p-1 rounded text-gray-400 hover:text-gray-600"
                        (click)="$event.stopPropagation(); openProjectMenu(project)"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Recent Sessions for Current Project -->
                  @if (project.id === appStore.currentProject()?.id && appStore.currentProjectSessions().length > 0) {
                    <div class="mt-2 pt-2 border-t border-gray-100">
                      <p class="text-xs text-gray-400 mb-1">Recent Sessions</p>
                      @for (session of appStore.currentProjectSessions().slice(0, 3); track session.id) {
                        <div 
                          class="text-xs text-gray-600 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer truncate"
                          (click)="$event.stopPropagation(); selectSession(session)"
                        >
                          Session {{ session.id }}
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <!-- Collapsed View -->
                <div 
                  class="p-2 flex items-center justify-center"
                  [title]="project.name"
                >
                  <div 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                    [class.bg-blue-100]="project.id === appStore.currentProject()?.id"
                    [class.text-blue-600]="project.id === appStore.currentProject()?.id"
                    [class.bg-gray-100]="project.id !== appStore.currentProject()?.id"
                    [class.text-gray-600]="project.id !== appStore.currentProject()?.id"
                  >
                    {{ getProjectInitials(project.name) }}
                  </div>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        @if (!collapsed()) {
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <p class="text-sm text-gray-500">No projects yet</p>
            <p class="text-xs text-gray-400 mt-1">Create your first project to get started</p>
          </div>
        }
      }
    </div>
  `
})
export class ProjectListComponent {
  collapsed = input<boolean>(false);
  protected appStore = inject(AppStore);
  private router = inject(Router);

  selectProject(project: Project): void {
    this.appStore.setCurrentProject(project);
    this.router.navigate(['/chat']);
  }

  selectSession(session: Session): void {
    this.appStore.setCurrentSession(session);
    this.router.navigate(['/chat']);
  }

  openProjectMenu(project: Project): void {
    // TODO: Implement project menu (edit, delete, etc.)
    console.log('Open project menu for:', project.name);
  }

  getProjectInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
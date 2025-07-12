import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { ApiService } from '../../core/services/api.service';
import type { Project, ProjectScanResult } from '@quincy/shared';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-projects',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 max-w-screen-xl mx-auto">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 class="m-0 text-gray-800">Projects</h1>
        <div class="flex gap-2">
          <button class="py-2 px-4 border border-gray-500 rounded bg-gray-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-600" 
                  (click)="scanProjects()"
                  [disabled]="appStore.loading()">
            {{ appStore.loading() ? 'Scanning...' : 'Scan Projects' }}
          </button>
        </div>
      </header>

      @if (appStore.loading()) {
        <div class="text-center py-8 text-lg">Loading projects...</div>
      }

      @if (appStore.error()) {
        <div class="text-center py-8 text-lg text-red-600 bg-red-50 border border-red-200 rounded p-4">{{ appStore.error() }}</div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        @for (project of appStore.projects(); track project.id) {
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm transition-all duration-200 hover:shadow-md"
               [class.border-blue-500]="isSelected(project)"
               [class.bg-blue-50]="isSelected(project)">
            <div class="mb-4">
              <h3 class="m-0 mb-2 text-gray-800">{{ project.name }}</h3>
              <div class="text-xs text-gray-500 space-y-1">
                <div>📁 {{ project.path }}</div>
                <div class="text-green-600">🔍 Detected Project</div>
              </div>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button class="py-2 px-4 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-green-600" 
                      (click)="selectProject(project)">
                {{ isSelected(project) ? 'Selected' : 'Select' }}
              </button>
              <button class="py-2 px-4 border border-purple-500 rounded bg-purple-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-purple-600" 
                      (click)="viewQHistory(project)">
                Q History
              </button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-12 text-gray-600">
            <p class="mb-4">No projects found. Try scanning for projects!</p>
          </div>
        }
      </div>

      <div class="flex gap-4">
        <button class="py-2 px-4 border border-purple-400 rounded bg-purple-400 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-purple-500" 
                (click)="viewAllQHistory()">
          View All Q History
        </button>
        <button class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                (click)="goBack()">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
})
export class ProjectsComponent implements OnInit {
  protected appStore = inject(AppStore);
  private apiService = inject(ApiService);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadProjects();
    this.setupWebSocketListeners();
  }

  private loadProjects(): void {
    this.appStore.setLoading(true);
    this.apiService.getProjects().subscribe({
      next: (projects) => this.appStore.setProjects(projects),
      error: (error) => this.appStore.setError('Failed to load projects')
    });
  }

  selectProject(project: Project): void {
    this.appStore.setCurrentProject(project);
  }

  isSelected(project: Project): boolean {
    return this.appStore.currentProject()?.id === project.id;
  }


  scanProjects(): void {
    this.appStore.setLoading(true);
    this.apiService.scanProjects().subscribe({
      next: (result: ProjectScanResult) => {
        // スキャン結果から新しいプロジェクトを追加
        result.projects.forEach(project => {
          // 既存のプロジェクトかチェック
          const existingProject = this.appStore.projects().find(p => p.id === project.id);
          if (!existingProject) {
            this.appStore.addProject(project);
          } else {
            this.appStore.updateProject(project);
          }
        });
        
        console.log(`プロジェクトスキャンが完了しました: ${result.projects.length}個のプロジェクトが見つかりました`);
        this.appStore.setLoading(false);
      },
      error: (error) => {
        console.error('プロジェクトスキャンに失敗しました:', error);
        this.appStore.setError('プロジェクトスキャンに失敗しました');
      }
    });
  }


  private setupWebSocketListeners(): void {
    this.webSocketService.connect();


    // プロジェクトスキャン完了イベント
    this.webSocketService.on<{ result: ProjectScanResult }>('projects:scanned', (data) => {
      data.result.projects.forEach(project => {
        const existingProject = this.appStore.projects().find(p => p.id === project.id);
        if (!existingProject) {
          this.appStore.addProject(project);
        } else {
          this.appStore.updateProject(project);
        }
      });
      this.appStore.setLoading(false);
    });
  }

  viewQHistory(project: Project): void {
    // 特定のプロジェクトの履歴を表示
    this.router.navigate(['/amazon-q-history'], { 
      queryParams: { projectPath: encodeURIComponent(project.path) } 
    });
  }

  viewAllQHistory(): void {
    // 全プロジェクトの履歴を表示
    this.router.navigate(['/amazon-q-history']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
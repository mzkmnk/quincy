import { Component, inject, ChangeDetectionStrategy, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PerformanceService } from '../services/performance-service';

@Component({
  selector: 'app-performance-dashboard',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isDevModeEnabled()) {
      <div class="performance-dashboard p-4 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-md">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">Performance Monitor</h3>
        <div class="flex gap-2">
          <button
            (click)="toggleMonitoring()"
            [class]="isMonitoring() ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'"
            class="px-3 py-1 text-white text-sm rounded transition-colors"
          >
            {{ isMonitoring() ? 'Stop' : 'Start' }}
          </button>
          <button
            (click)="clearMetrics()"
            class="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="metric-card">
          <div class="text-sm text-[var(--text-secondary)]">Memory Usage</div>
          <div class="text-lg font-bold text-[var(--text-primary)]">
            {{ formatBytes(statistics().avgMemoryUsage) }}
          </div>
        </div>

        <div class="metric-card">
          <div class="text-sm text-[var(--text-secondary)]">Avg Render Time</div>
          <div class="text-lg font-bold text-[var(--text-primary)]">
            {{ statistics().avgRenderTime.toFixed(2) }}ms
          </div>
        </div>

        <div class="metric-card">
          <div class="text-sm text-[var(--text-secondary)]">Average FPS</div>
          <div class="text-lg font-bold" [class]="getFPSClass(statistics().avgFPS)">
            {{ statistics().avgFPS.toFixed(1) }}
          </div>
        </div>

        <div class="metric-card">
          <div class="text-sm text-[var(--text-secondary)]">Max Memory</div>
          <div class="text-lg font-bold text-[var(--text-primary)]">
            {{ formatBytes(statistics().maxMemoryUsage) }}
          </div>
        </div>
      </div>

      @if (metrics().length > 0) {
        <div class="metrics-chart h-32 bg-[var(--tertiary-bg)] rounded p-2">
          <div class="text-xs text-[var(--text-secondary)] mb-2">
            Recent metrics ({{ metrics().length }} samples)
          </div>
          <div class="flex items-end h-24 gap-1">
            @for (metric of getChartData(); track metric.timestamp) {
              <div 
                class="bg-blue-500 rounded-sm min-w-[2px]"
                [style.height.%]="metric.normalizedFPS"
                [title]="'FPS: ' + metric.fps.toFixed(1) + ' at ' + formatTime(metric.timestamp)"
              ></div>
            }
          </div>
        </div>
      }
      </div>
    }
  `,
  styles: [`
    @reference "tailwindcss";
    
    .metric-card {
      @apply p-3 bg-[var(--tertiary-bg)] rounded border border-[var(--border-color)];
    }
  `]
})
export class PerformanceDashboardComponent {
  private performanceService = inject(PerformanceService);

  metrics = this.performanceService.getMetrics;
  isMonitoring = this.performanceService.getIsMonitoring;
  statistics = this.performanceService.getStatistics;

  isDevModeEnabled(): boolean {
    return isDevMode();
  }

  toggleMonitoring(): void {
    if (this.isMonitoring()) {
      this.performanceService.stopMonitoring();
    } else {
      this.performanceService.startMonitoring();
    }
  }

  clearMetrics(): void {
    this.performanceService.clearMetrics();
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getFPSClass(fps: number): string {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  }

  getChartData(): Array<{ fps: number; normalizedFPS: number; timestamp: number }> {
    const allMetrics = this.metrics();
    const recent = allMetrics.slice(-50); // 最新50件
    
    if (recent.length === 0) return [];
    
    const maxFPS = Math.max(...recent.map(m => m.fps));
    const minFPS = Math.min(...recent.map(m => m.fps));
    const range = maxFPS - minFPS || 1;
    
    return recent.map(metric => ({
      fps: metric.fps,
      normalizedFPS: ((metric.fps - minFPS) / range) * 100,
      timestamp: metric.timestamp
    }));
  }
}
import { isDevMode } from '@angular/core';

/**
 * パフォーマンス監視機能を遅延読み込みする
 */
export async function loadPerformanceFeatures() {
  if (!isDevMode()) {
    return null;
  }

  const { PerformanceService } = await import('./services/performance-service');
  const { PerformanceDashboardComponent } = await import('./components/performance-dashboard.component');
  const { PerformanceMonitorDirective } = await import('./directives/performance-monitor.directive');

  return {
    PerformanceService,
    PerformanceDashboardComponent,
    PerformanceMonitorDirective
  };
}
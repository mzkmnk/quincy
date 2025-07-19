import { Injectable, signal, isDevMode } from '@angular/core';

import { measureMemoryUsage, measureRenderPerformance, measureFPS } from '../utils';

export interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  fps: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class PerformanceService {
  private metrics = signal<PerformanceMetrics[]>([]);
  private isMonitoring = signal(false);
  private monitoringInterval?: number;

  getMetrics = this.metrics.asReadonly();
  getIsMonitoring = this.isMonitoring.asReadonly();

  /**
   * パフォーマンス監視を開始する（開発環境のみ）
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (!isDevMode() || this.isMonitoring()) {
      return;
    }

    this.isMonitoring.set(true);

    this.monitoringInterval = window.setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.addMetrics(metrics);
    }, intervalMs);
  }

  /**
   * パフォーマンス監視を停止する
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring.set(false);
  }

  /**
   * メトリクスをクリアする
   */
  clearMetrics(): void {
    this.metrics.set([]);
  }

  /**
   * 現在のパフォーマンスメトリクスを収集する（開発環境のみ）
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    if (!isDevMode()) {
      return {
        memoryUsage: 0,
        renderTime: 0,
        fps: 60,
        timestamp: Date.now(),
      };
    }

    const [memoryUsage, fps] = await Promise.all([measureMemoryUsage(), measureFPS(1000)]);

    return {
      memoryUsage,
      renderTime: 0, // レンダリング時間は別途測定
      fps,
      timestamp: Date.now(),
    };
  }

  /**
   * レンダリングパフォーマンスを測定する
   */
  measureRender(name: string): {
    start: () => void;
    end: () => void;
  } {
    const measurement = measureRenderPerformance(name);

    return {
      start: () => measurement.start(),
      end: () => {
        const renderTime = measurement.end();
        this.addRenderMetrics(renderTime);
      },
    };
  }

  /**
   * パフォーマンス統計を取得する
   */
  getStatistics(): {
    avgMemoryUsage: number;
    avgRenderTime: number;
    avgFPS: number;
    maxMemoryUsage: number;
    minFPS: number;
  } {
    const allMetrics = this.metrics();

    if (allMetrics.length === 0) {
      return {
        avgMemoryUsage: 0,
        avgRenderTime: 0,
        avgFPS: 0,
        maxMemoryUsage: 0,
        minFPS: 0,
      };
    }

    const memoryUsages = allMetrics.map(m => m.memoryUsage);
    const renderTimes = allMetrics.map(m => m.renderTime).filter(t => t > 0);
    const fpsList = allMetrics.map(m => m.fps);

    return {
      avgMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      avgRenderTime:
        renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0,
      avgFPS: fpsList.reduce((a, b) => a + b, 0) / fpsList.length,
      maxMemoryUsage: Math.max(...memoryUsages),
      minFPS: Math.min(...fpsList),
    };
  }

  private addMetrics(metrics: PerformanceMetrics): void {
    const current = this.metrics();
    // 最新の100件のみ保持
    const updated = [...current, metrics].slice(-100);
    this.metrics.set(updated);
  }

  private addRenderMetrics(renderTime: number): void {
    const current = this.metrics();
    if (current.length > 0) {
      const latest = { ...current[current.length - 1] };
      latest.renderTime = renderTime;

      const updated = [...current.slice(0, -1), latest];
      this.metrics.set(updated);
    }
  }
}

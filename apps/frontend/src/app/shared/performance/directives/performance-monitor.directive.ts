import { Directive, inject, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { PerformanceService } from '../services/performance-service';

@Directive({
  selector: '[appPerformanceMonitor]'
})
export class PerformanceMonitorDirective implements OnInit, OnDestroy {
  private performanceService = inject(PerformanceService);
  private elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;
  private renderMeasurement?: { start: () => void; end: () => void };

  ngOnInit(): void {
    this.setupIntersectionObserver();
    this.setupRenderMeasurement();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 要素が表示された時の処理
          this.renderMeasurement?.start();
        } else {
          // 要素が非表示になった時の処理
          this.renderMeasurement?.end();
        }
      });
    }, {
      threshold: 0.1
    });

    this.observer.observe(this.elementRef.nativeElement);
  }

  private setupRenderMeasurement(): void {
    const elementName = this.elementRef.nativeElement.tagName.toLowerCase();
    this.renderMeasurement = this.performanceService.measureRender(`component-${elementName}`);
  }
}
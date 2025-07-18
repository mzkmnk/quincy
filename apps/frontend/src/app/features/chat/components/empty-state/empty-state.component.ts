import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PathSelectorComponent } from '../../../../shared/components/path-selector/path-selector.component';

@Component({
  selector: 'app-empty-state',
  imports: [CommonModule, PathSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center min-h-full min-w-full">
      <app-path-selector></app-path-selector>
    </div>
  `
})
export class EmptyStateComponent {
}
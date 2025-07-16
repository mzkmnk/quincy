import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-message',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- User Message - Right aligned with speech bubble -->
    <div class="flex justify-end mb-4">
      <div class="flex items-end gap-2 max-w-xl">
        <div class="bg-[#1a1a1a] text-white rounded-2xl px-4 py-3 shadow-sm">
          <div class="whitespace-pre-wrap text-[#ffffff] break-words">{{ content() }}</div>
        </div>
      </div>
    </div>
  `
})
export class UserMessageComponent {
  content = input.required<string>();
}
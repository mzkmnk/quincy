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
        <div class="bg-gray-100 text-white rounded-2xl px-4 py-3 shadow-sm">
          <div class="whitespace-pre-wrap text-gray-700 break-words">{{ content() }}</div>
          @if (showTimestamp()) {
            <div class="text-xs text-gray-500 mt-1 text-right">
              {{ formatTime(timestamp()) }}
            </div>
          }
        </div>
        @if (showAvatar()) {
          <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
            <i class="pi pi-user"></i>
          </div>
        }
      </div>
    </div>
  `
})
export class UserMessageComponent {
  content = input.required<string>();
  timestamp = input<Date>(new Date());
  showTimestamp = input<boolean>(false);
  showAvatar = input<boolean>(false);

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
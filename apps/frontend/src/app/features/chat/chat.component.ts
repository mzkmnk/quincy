import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';
import { MessageListComponent } from '../../shared/components/message-list/message-list.component';
import { MessageInputComponent } from '../../shared/components/message-input/message-input.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, MessageListComponent, MessageInputComponent],
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Chat Header -->
      <div class="border-b border-gray-200 p-4 bg-white">
        <div class="flex items-center justify-between">
          <div>
            @if (appStore.currentProject()) {
              <h1 class="text-xl font-semibold text-gray-900">{{ appStore.currentProject()?.name }}</h1>
            } @else {
              <h1 class="text-xl font-semibold text-gray-900">Welcome to Quincy</h1>
              <p class="text-sm text-gray-500 mt-1">Select a project from the sidebar to start chatting</p>
            }
          </div>
          
          <!-- Connection Status -->
          <div class="flex items-center gap-2 text-sm">
            <span 
              class="w-2 h-2 rounded-full transition-colors duration-200"
              [class.bg-green-500]="websocket.connected()"
              [class.bg-orange-500]="websocket.connecting()"
              [class.animate-pulse]="websocket.connecting()"
              [class.bg-red-500]="!websocket.connected() && !websocket.connecting()"
            ></span>
            <span class="text-gray-600 font-medium">
              {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 overflow-y-auto">
        @if (appStore.currentProject()) {
          <app-message-list></app-message-list>
        } @else {
          <!-- Welcome/Empty State -->
          <div class="h-full flex items-center justify-center">
            <div class="text-center max-w-md">
              <div class="mb-6">
                <svg class="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Start a Conversation</h2>
              <p class="text-gray-500 mb-6 leading-relaxed">
                Welcome to Quincy! Select an existing project from the sidebar or create a new one to begin chatting with your AI assistant.
              </p>
              <div class="space-y-2 text-sm text-gray-400">
                <p>💡 Create projects to organize your conversations</p>
                <p>🤖 Chat with AI assistants in real-time</p>
                <p>📁 Upload files and manage sessions</p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Chat Input Area -->
      @if (appStore.currentProject()) {
        <div class="border-t border-gray-200 bg-white">
          <app-message-input></app-message-input>
        </div>
      }
    </div>
  `
})
export class ChatComponent implements OnInit {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);

  ngOnInit(): void {
    // Connect to websocket if not already connected
    if (!this.websocket.connected()) {
      this.websocket.connect();
    }
  }
}
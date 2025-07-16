import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex bg-[#15202b]">
      <!-- Sidebar -->
      <aside 
        class="fixed left-0 top-0 h-full bg-[#192734] border-r border-[#2f3336] transition-all duration-300 z-40"
        [class.w-80]="!sidebarCollapsed()"
        [class.w-16]="sidebarCollapsed()"
        [class.translate-x-0]="!mobileMenuHidden() || window.innerWidth >= 768"
        [class.-translate-x-full]="mobileMenuHidden() && window.innerWidth < 768"
      >
        <!-- Sidebar Header -->
        <div class="p-4 border-b border-[#2f3336] flex items-center">
          <button
            (click)="toggleSidebar()"
            class="p-2 rounded-md hover:bg-[#22303c] transition-colors"
            [class.hidden]="window.innerWidth < 768"
          >
            <svg class="w-5 h-5 text-[#e7e9ea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 
            class="text-xl font-semibold text-white ml-2 transition-opacity duration-300"
            [class.opacity-0]="sidebarCollapsed()"
            [class.hidden]="sidebarCollapsed()"
          >
            Quincy
          </h1>
        </div>

        <!-- Sidebar Content -->
        <div class="flex-1 h-0">
          <app-sidebar 
            [collapsed]="sidebarCollapsed()"
          ></app-sidebar>
        </div>
      </aside>

      <!-- Mobile Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-70 z-30 md:hidden"
        [class.hidden]="mobileMenuHidden()"
        (click)="closeMobileMenu()"
      ></div>

      <!-- Main Content Area -->
      <main 
        class="flex-1 transition-all duration-300"
        [class.ml-80]="!sidebarCollapsed() && window.innerWidth >= 768"
        [class.ml-16]="sidebarCollapsed() && window.innerWidth >= 768"
        [class.ml-0]="window.innerWidth < 768"
      >
        <!-- Mobile Header -->
        <div class="md:hidden bg-[#192734] border-b border-[#2f3336] p-4 flex items-center justify-between">
          <button
            (click)="toggleMobileMenu()"
            class="p-2 rounded-lg hover:bg-[#22303c] transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-white">Quincy</h1>
          <div class="w-10"></div> <!-- Spacer for centering -->
        </div>

        <!-- Router Outlet -->
        <div class="h-full">
          <router-outlet></router-outlet>
        </div>
      </main>

    </div>
  `
})
export class LayoutComponent {
  protected sidebarCollapsed = signal(false);
  protected mobileMenuHidden = signal(true);
  protected window = window;

  toggleSidebar(): void {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  toggleMobileMenu(): void {
    this.mobileMenuHidden.update(hidden => !hidden);
  }

  closeMobileMenu(): void {
    this.mobileMenuHidden.set(true);
  }
}
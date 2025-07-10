import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from '../navigation/navigation.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavigationComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-navigation></app-navigation>
      <main class="flex-1 pt-16 min-h-[calc(100vh-64px)]">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LayoutComponent {}
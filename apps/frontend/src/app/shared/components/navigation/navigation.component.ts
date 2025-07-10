import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <a routerLink="/dashboard" class="brand-link">
            <h1>Quincy</h1>
          </a>
        </div>
        
        <div class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            Dashboard
          </a>
          <a routerLink="/projects" routerLinkActive="active" class="nav-link">
            Projects
          </a>
          <a routerLink="/sessions" routerLinkActive="active" class="nav-link">
            Sessions
          </a>
        </div>
        
        <div class="nav-status">
          <div class="connection-status">
            <span 
              class="status-dot" 
              [class.connected]="websocket.connected()"
              [class.connecting]="websocket.connecting()"
              [class.disconnected]="!websocket.connected() && !websocket.connecting()"
            ></span>
            <span class="status-text">
              {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      height: 64px;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
    }

    .nav-brand {
      display: flex;
      align-items: center;
    }

    .brand-link {
      text-decoration: none;
      color: inherit;
    }

    .brand-link h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #2196f3;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-link {
      text-decoration: none;
      color: #666;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      transition: all 0.2s;
    }

    .nav-link:hover {
      color: #2196f3;
      background: #f5f5f5;
    }

    .nav-link.active {
      color: #2196f3;
      background: #e3f2fd;
    }

    .nav-status {
      display: flex;
      align-items: center;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ccc;
      transition: background 0.2s;
    }

    .status-dot.connected {
      background: #4caf50;
    }

    .status-dot.connecting {
      background: #ff9800;
      animation: pulse 2s infinite;
    }

    .status-dot.disconnected {
      background: #f44336;
    }

    .status-text {
      color: #666;
      font-weight: 500;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    @media (max-width: 768px) {
      .nav-container {
        padding: 0 1rem;
      }
      
      .nav-links {
        gap: 1rem;
      }
      
      .nav-link {
        padding: 0.5rem;
        font-size: 0.875rem;
      }
      
      .status-text {
        display: none;
      }
    }
  `]
})
export class NavigationComponent {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);
  private router = inject(Router);
}
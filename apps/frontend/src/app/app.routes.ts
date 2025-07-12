import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/chat',
    pathMatch: 'full'
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent)
  },
  {
    path: 'sessions',
    loadComponent: () => import('./features/sessions/sessions.component').then(m => m.SessionsComponent)
  },
  {
    path: 'amazon-q-history',
    loadComponent: () => import('./features/amazon-q-history/amazon-q-history.component').then(m => m.AmazonQHistoryComponent)
  },
  {
    path: 'amazon-q-history/:projectPath',
    loadComponent: () => import('./features/amazon-q-history/amazon-q-history.component').then(m => m.AmazonQHistoryComponent)
  },
  {
    path: '**',
    redirectTo: '/chat'
  }
];

# Frontend Setup Instructions

This document provides setup instructions for the Angular frontend application.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v7 or higher)

## Dependencies Installation

Install the required dependencies by running from the root directory:

```bash
pnpm install
```

### Required Dependencies

The following dependencies need to be installed manually:

```bash
# From the root directory
pnpm --filter frontend add @angular/material @angular/cdk @angular/animations
pnpm --filter frontend add socket.io-client
pnpm --filter frontend add @ngrx/signals
```

## Development Setup

### 1. Start the Backend

First, start the backend server:

```bash
pnpm --filter backend dev
```

The backend will run on `http://localhost:3000`.

### 2. Start the Frontend

Start the frontend development server:

```bash
pnpm --filter frontend start
```

The frontend will run on `http://localhost:4200`.

## Features

### ✅ Implemented Features

1. **Angular 20 with Standalone Components**
   - Modern Angular architecture
   - Zoneless change detection
   - Standalone components pattern

2. **Routing Configuration**
   - Lazy-loaded routes
   - Navigation between Dashboard, Projects, and Sessions
   - Route guards and navigation handling

3. **Project Structure**
   - `core/` - Core services and state management
   - `features/` - Feature modules (dashboard, projects, sessions)
   - `shared/` - Shared components and utilities

4. **State Management with ngrx/signals**
   - Centralized application state
   - Reactive state updates
   - Signal-based state management

5. **WebSocket Client (Socket.io)**
   - Real-time connection to backend
   - Connection status monitoring
   - Event handling and communication

6. **Development Proxy**
   - API calls forwarded to backend
   - Development environment configuration
   - CORS handling

7. **Navigation System**
   - Fixed navigation bar
   - Route active states
   - Connection status display

### 📋 Project Structure

```
src/app/
├── core/
│   ├── services/
│   │   ├── api.service.ts          # HTTP API communication
│   │   └── websocket.service.ts    # WebSocket client
│   └── store/
│       └── app.state.ts            # ngrx/signals state management
├── features/
│   ├── dashboard/
│   │   └── dashboard.component.ts  # Main dashboard
│   ├── projects/
│   │   └── projects.component.ts   # Project management
│   └── sessions/
│       └── sessions.component.ts   # Session management
├── shared/
│   └── components/
│       ├── layout/
│       │   └── layout.component.ts # Main layout wrapper
│       └── navigation/
│           └── navigation.component.ts # Navigation bar
├── app.config.ts                   # Angular app configuration
├── app.routes.ts                   # Route configuration
├── app.ts                          # Root component
└── main.ts                         # Bootstrap
```

### 🔧 Configuration Files

- `proxy.conf.json` - Development proxy configuration
- `angular.json` - Angular CLI configuration with proxy setup
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

## Usage

### Dashboard
- View application statistics
- Monitor WebSocket connection status
- Navigate to other sections

### Projects
- View all projects
- Create new projects
- Select current project
- Manage project settings

### Sessions
- View sessions for selected project
- Create new sessions
- Manage session data
- Select current session

## API Integration

The frontend communicates with the backend via:

1. **HTTP API** - RESTful endpoints for CRUD operations
2. **WebSocket** - Real-time communication for live updates

### API Endpoints

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/sessions` - Get sessions
- `POST /api/sessions` - Create new session

## State Management

The application uses ngrx/signals for state management:

- **AppStore** - Main application state
- **Computed signals** - Derived state values
- **Methods** - State update functions
- **Reactive updates** - Automatic UI updates

## Development Notes

- The app uses zoneless change detection for better performance
- All components are standalone (no NgModules)
- Responsive design with mobile-first approach
- TypeScript strict mode enabled
- Angular Material ready for UI components

## Next Steps

To complete the setup:

1. Install the missing dependencies listed above
2. Configure Angular Material theming
3. Add backend API endpoints
4. Test WebSocket connectivity
5. Add authentication if needed
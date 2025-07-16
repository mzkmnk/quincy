# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo managed with pnpm workspaces containing:

- **Backend**: Node.js/TypeScript API using Express framework (`apps/backend/`)
- **Frontend**: Angular 20 application with standalone components (`apps/frontend/`)

## Development Commands

### Root Level
```bash
# Install dependencies for all workspaces
pnpm install

# Run commands in specific workspaces
pnpm --filter backend <command>
pnpm --filter frontend <command>

# Development shortcuts
pnpm dev:backend
pnpm dev:frontend
pnpm dev:docs

# Build shortcuts
pnpm build:backend
pnpm build:frontend
pnpm build:docs
pnpm build  # builds both backend and frontend
```

### Backend (`apps/backend/`)
```bash
# Development server with hot reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Type checking
pnpm typecheck

# Run production build
pnpm start
pnpm start:prod  # with NODE_ENV=production

# Run tests
pnpm test
pnpm test:watch
```

### Frontend (`apps/frontend/`)
```bash
# Development server (runs on http://localhost:4200)
pnpm start
# or
ng serve

# Build for production
pnpm build
# or
ng build

# Build and watch for changes
pnpm watch
# or
ng build --watch --configuration development

# Run unit tests
pnpm test
# or
ng test

# Generate new components
ng generate component component-name
```

## Architecture Notes

### Backend
- Uses Express framework for HTTP server with Socket.io for WebSocket support
- Runs on port 3000 by default
- Built with TypeScript and uses tsx for development
- REST API structure with Express Router
- Includes middleware for CORS, Helmet security, compression, and request logging
- WebSocket service handles real-time communication with Amazon Q CLI
- Uses Jest for testing
- SQLite3 database for session persistence

### Frontend
- Angular 20 with standalone components (no NgModules)
- Uses zoneless change detection
- PrimeNG 20.0.0-rc.3 for UI components
- Tailwind CSS 4.1.11 for styling
- @ngrx/signals for state management
- Socket.io-client for WebSocket communication
- Uses Karma/Jasmine for testing
- Standard Angular CLI project structure

## Key Configuration Files

- `pnpm-workspace.yaml`: Workspace configuration
- `apps/backend/tsconfig.json`: Backend TypeScript configuration
- `apps/frontend/angular.json`: Angular CLI configuration
- `apps/frontend/src/app/app.config.ts`: Angular app configuration

## Development Workflow

1. Run `pnpm install` at root to install all dependencies
2. Start backend: `pnpm dev:backend` (or `pnpm --filter backend dev`)
3. Start frontend: `pnpm dev:frontend` (or `pnpm --filter frontend start`)
4. Backend serves on localhost:3000, frontend on localhost:4200
5. WebSocket communication handles real-time Amazon Q CLI interactions

### Test-Driven Development (TDD)

- Follow Test-Driven Development (TDD) as a principle
- Create tests first based on expected inputs and outputs
- Write only tests without implementation code
- Run tests and confirm they fail
- Commit once tests are verified to be correct
- Then proceed with implementation to make tests pass
- Do not modify tests during implementation, only fix code
- Repeat until all tests pass

### Testing Status

#### Backend Tests
- **Current Test Coverage**: Limited test coverage with 2 test files
  - `amazon-q-cli.test.ts`: Tests for Amazon Q CLI integration
  - `websocket.test.ts`: Tests for WebSocket functionality
- **Test Framework**: Jest with TypeScript support
- **Test Command**: `pnpm test` or `pnpm test:watch`
- **Goal**: Expand test coverage for all services and utilities

#### Frontend Tests
- **Test Framework**: Karma/Jasmine (Angular default)
- **Test Command**: `pnpm test` or `ng test`
- **Current Status**: Standard Angular CLI test setup

You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.
## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
## Angular Best Practices
- Always use standalone components over NgModules
- Don't use explicit `standalone: true` (it is implied by default)
- Use signals for state management
- Implement lazy loading for feature routes
- Use `NgOptimizedImage` for all static images.
## Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- DO NOT use `ngStyle`, use `style` bindings instead
## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection


## Language Settings / 言語設定

**IMPORTANT / 重要**: In this project, Claude Code must ALWAYS respond in Japanese. Technical terms can remain in English.

このプロジェクトでは、Claude Codeは**必ず**日本語で返答してください。技術用語は英語のままで問題ありません。

### Examples / 例:
- ✅ 「componentを作成しました」
- ✅ 「TypeScriptの型定義を追加しました」
- ❌ "I've created a new component"
- ❌ "Added TypeScript type definitions"
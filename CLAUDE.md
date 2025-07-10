# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo managed with pnpm workspaces containing:

- **Backend**: Node.js/TypeScript API using Hono framework (`apps/backend/`)
- **Frontend**: Angular 20 application with standalone components (`apps/frontend/`)

## Development Commands

### Root Level
```bash
# Install dependencies for all workspaces
pnpm install

# Run commands in specific workspaces
pnpm --filter backend <command>
pnpm --filter frontend <command>
```

### Backend (`apps/backend/`)
```bash
# Development server with hot reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Run production build
pnpm start
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

# Run unit tests
pnpm test
# or
ng test

# Generate new components
ng generate component component-name
```

## Architecture Notes

### Backend
- Uses Hono framework for HTTP server
- Runs on port 3000 by default
- Built with TypeScript and uses tsx for development
- Simple REST API structure with minimal setup

### Frontend
- Angular 20 with standalone components (no NgModules)
- Uses zoneless change detection
- Router configured but no routes defined yet
- Uses Karma/Jasmine for testing
- Standard Angular CLI project structure

## Key Configuration Files

- `pnpm-workspace.yaml`: Workspace configuration
- `apps/backend/tsconfig.json`: Backend TypeScript configuration
- `apps/frontend/angular.json`: Angular CLI configuration
- `apps/frontend/src/app/app.config.ts`: Angular app configuration

## Development Workflow

1. Run `pnpm install` at root to install all dependencies
2. Start backend: `pnpm --filter backend dev`
3. Start frontend: `pnpm --filter frontend start`
4. Backend serves on localhost:3000, frontend on localhost:4200

### Test-Driven Development (TDD)

- 原則としてテスト駆動開発（TDD）で進める
- 期待される入出力に基づき、まずテストを作成する
- 実装コードは書かず、テストのみを用意する
- テストを実行し、失敗を確認する
- テストが正しいことを確認できた段階でコミットする
- その後、テストをパスさせる実装を進める
- 実装中はテストを変更せず、コードを修正し続ける
- すべてのテストが通過するまで繰り返す

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
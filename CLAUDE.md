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

#### New Modular Architecture (After Refactoring)

The backend has been refactored into a modular, 1-file-1-function architecture:

- **Services** (`src/services/`):
  - `amazon-q-cli/`: Amazon Q CLI integration with sub-modules:
    - `buffer-manager/`: Output buffer management functions
    - `cli-checker/`: CLI availability validation
    - `message-handler/`: Message processing and classification
    - `process-manager/`: Process lifecycle management
    - `session-manager/`: Session state management
  - `amazon-q-history/`: History data retrieval functions
  - `amazon-q-history-transformer/`: History data transformation
  - `amazon-q-message-formatter/`: Message formatting for display
  - `websocket/`: WebSocket functionality with sub-modules:
    - `amazon-q-handler/`: Amazon Q specific WebSocket handlers
    - `connection-manager/`: Connection lifecycle management
    - `error-handler/`: Error handling utilities
    - `event-setup/`: Event handler setup
    - `message-handler/`: Message processing
    - `room-manager/`: Room management functionality

- **Utilities** (`src/utils/`):
  - `ansi-stripper/`: ANSI escape code removal
  - `cli-validator/`: CLI path validation
  - `error-factory/`: Error creation utilities
  - `errors/`: Custom error classes and unified error handling
  - `id-generator/`: ID generation utilities
  - `path-validator/`: Path validation and security

- **Types** (`src/types/`):
  - `amazon-q.ts`: Amazon Q related type definitions
  - `common.ts`: Common type definitions
  - `websocket.ts`: WebSocket related type definitions

- **Testing** (`src/tests/`):
  - Unit tests for all utility functions
  - Integration tests for services
  - End-to-end tests for complete workflows

### Frontend

- Angular 20 with standalone components (no NgModules)
- Uses zoneless change detection
- PrimeNG 20.0.0-rc.3 for UI components
- Tailwind CSS 4.1.11 for styling
- @ngrx/signals for state management
- Socket.io-client for WebSocket communication
- Uses Karma/Jasmine for testing
- Standard Angular CLI project structure

#### New Modular Architecture (After Refactoring)

The frontend has been refactored into a modular, 1-file-1-function architecture:

- **Core Services** (`src/app/core/services/`):
  - `websocket/`: WebSocket service with sub-modules:
    - `connection/`: Connection lifecycle management
    - `amazon-q-history/`: History data retrieval functions
    - `chat/`: Chat message handling
    - `project-session/`: Project session management

- **State Management** (`src/app/core/store/`):
  - `project/`: Project state management with actions and selectors
  - `session/`: Session state management
  - `amazon-q-history/`: Amazon Q history state management
  - `chat/`: Chat message state management
  - `app.state.ts`: Unified state management with backward compatibility

- **Components** (`src/app/features/chat/`):
  - `components/`: Child components (chat-header, session-start, chat-error, etc.)
  - `services/`: Component-specific services (chat-websocket, message-streaming, session-manager)
  - `utils/`: Utility functions (message-index-manager, session-status-checker)

- **Shared Components** (`src/app/shared/components/`):
  - `message-list/`: Message list with services and utilities
  - `path-selector/`: Path selector with validation and session starting
  - `message-input/`: Message input with composition state management

- **Utilities** (`src/app/shared/utils/`):
  - `validators/`: Input validation functions
  - `formatters/`: Data formatting functions
  - `converters/`: Data conversion functions
  - `generators/`: Data generation functions

- **Type Definitions** (`src/app/core/types/` and `src/app/shared/types/`):
  - `common.types.ts`: Common type definitions and type guards
  - `websocket.types.ts`: WebSocket-related type definitions
  - `amazon-q.types.ts`: Amazon Q-specific type definitions
  - `ui.types.ts`: UI component type definitions

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

## Development Guidelines

### Code Organization Principles

- **1-File-1-Function**: Each module contains exactly one primary function
- **Modular Structure**: Related functions are grouped in directories
- **Clear Separation**: Services, utilities, and types are clearly separated
- **Index Files**: Each module has an `index.ts` for clean imports

### Adding New Features

#### Backend

1. **Services**: Add new services in `src/services/[service-name]/`
2. **Utilities**: Add reusable functions in `src/utils/[util-name]/`
3. **Types**: Add type definitions in `src/types/`
4. **Tests**: Always add corresponding test files in `src/tests/`

#### Frontend

1. **Components**: Add new components in `src/app/features/[feature-name]/` or `src/app/shared/components/[component-name]/`
2. **Services**: Add component-specific services in `src/app/features/[feature-name]/services/` or core services in `src/app/core/services/`
3. **State Management**: Add state in `src/app/core/store/[domain]/` with actions and selectors
4. **Utilities**: Add reusable functions in `src/app/shared/utils/[util-name]/`
5. **Types**: Add type definitions in `src/app/core/types/` or `src/app/shared/types/`
6. **Tests**: Always add corresponding test files for each function/component

### Import Conventions

#### Backend

- Use index files for clean imports: `import { functionName } from '../services/module-name'`
- Avoid deep imports: `import { functionName } from '../services/module-name/sub-module/function-name'`
- Use absolute imports when possible

#### Frontend

- Use index files for clean imports: `import { functionName } from './services/module-name'`
- Prefer relative imports within the same feature: `import { helper } from './utils/helper'`
- Use absolute imports for core services: `import { AppStore } from '../../../core/store/app.state'`
- Import types separately: `import type { MessageId } from '../../core/types/common.types'`

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

- **Test Framework**: Jest with TypeScript support
- **Test Command**: `pnpm test` or `pnpm test:watch`
- **Comprehensive Test Coverage**: Full test suite covering all refactored modules
  - **Unit Tests**:
    - `ansi-stripper.test.ts`: ANSI escape code removal
    - `cli-validator.test.ts`: CLI path validation
    - `id-generator.test.ts`: ID generation utilities
    - `path-validator.test.ts`: Path validation and security
  - **Integration Tests**:
    - `amazon-q-cli.integration.test.ts`: Amazon Q CLI service integration
    - `websocket.integration.test.ts`: WebSocket service integration
    - `amazon-q-websocket.integration.test.ts`: Amazon Q + WebSocket integration
  - **Legacy Tests** (maintained for compatibility):
    - `amazon-q-cli.test.ts`: Original Amazon Q CLI tests
    - `websocket.test.ts`: Original WebSocket tests
  - **End-to-End Tests**:
    - `end-to-end.test.ts`: Complete workflow testing

#### Frontend Tests

- **Test Framework**: Karma/Jasmine (Angular default)
- **Test Command**: `pnpm test` or `ng test`
- **Current Status**: Comprehensive test coverage for refactored modules
  - **Unit Tests**: All utility functions, services, and components
  - **Integration Tests**: Component interactions and state management
  - **Type Safety**: Full TypeScript coverage with strict mode
  - **Test Structure**: Follows 1-file-1-function testing approach

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

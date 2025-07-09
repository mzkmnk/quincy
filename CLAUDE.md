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
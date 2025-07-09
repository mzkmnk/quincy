import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Project, Session } from '@quincy/shared'

// Import middleware and utilities
import { loggerMiddleware } from './utils/logger.ts'
import { errorHandler, notFoundHandler } from './utils/errors.ts'
import { routes } from './routes/index.ts'

const app = new Hono()

// Configure CORS middleware for frontend communication (localhost:4200)
app.use('*', cors({
  origin: ['http://localhost:4200'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Add built-in Hono logger middleware
app.use('*', logger())

// Add custom request logging middleware
app.use('*', loggerMiddleware)

// Add error handling middleware
app.use('*', errorHandler)

// API routes
app.route('/api', routes)

// Test route to verify shared types
app.get('/', (c) => {
  // sharedパッケージの型を使用するテスト
  const testProject: Project = {
    id: '1',
    name: 'Test Project'
  }
  
  const testSession: Session = {
    id: 'session-1',
    projectId: testProject.id
  }
  
  return c.json({ 
    message: 'Hono Backend Server is running!',
    project: testProject,
    session: testSession
  })
})

// Handle 404 errors
app.notFound(notFoundHandler)

// Start server
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`)
  console.log(`📡 CORS enabled for http://localhost:4200`)
  console.log(`🔗 Health check: http://localhost:${info.port}/api/health`)
})

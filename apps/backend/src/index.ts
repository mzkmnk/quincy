import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createServer } from 'http'

// Import middleware and utilities
import { loggerMiddleware } from './utils/logger.ts'
import { errorHandler, notFoundHandler } from './utils/errors.ts'
import { routes } from './routes/index.ts'
import { WebSocketService } from './services/websocket.ts'
import { setWebSocketService } from './routes/projects.ts'

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

// Health check route
app.get('/', (c) => {
  return c.json({ 
    message: 'Quincy Backend API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Handle 404 errors
app.notFound(notFoundHandler)

// Create HTTP server
const httpServer = createServer()

// Initialize WebSocket service
const webSocketService = new WebSocketService(httpServer)

// Inject WebSocket service into projects routes
setWebSocketService(webSocketService)

// Start server with WebSocket support
serve({
  fetch: app.fetch,
  port: 3000,
  createServer: () => httpServer
}, (info) => {
  console.log(`🚀 Server is running on http://localhost:${info.port}`)
  console.log(`📡 CORS enabled for http://localhost:4200`)
  console.log(`🔗 Health check: http://localhost:${info.port}/api/health`)
  console.log(`🔌 WebSocket server ready for connections`)
  console.log(`📊 Connected users: ${webSocketService.getUserCount()}`)
})

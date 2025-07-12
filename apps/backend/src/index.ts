import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createServer, Server as HttpServer } from 'http'

// Import middleware and utilities
import { loggerMiddleware } from './utils/logger'
import { errorHandler, notFoundHandler } from './utils/errors'
import { routes } from './routes/index'
import { WebSocketService } from './services/websocket'
import { setWebSocketService } from './routes/projects'

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

// Create HTTP server with Hono app integration
const httpServer = createServer(async (req, res) => {
  try {
    // Get request body for non-GET/HEAD requests
    let body: string | undefined = undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      body = Buffer.concat(chunks).toString()
    }

    const request = new Request(`http://localhost:3000${req.url}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: body,
    })
    
    const response = await app.fetch(request)
    
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    
    const responseBody = await response.text()
    res.end(responseBody)
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
})

// Initialize WebSocket service
const webSocketService = new WebSocketService(httpServer)

// Inject WebSocket service into projects routes
setWebSocketService(webSocketService)

// Start the server
httpServer.listen(3000, () => {
  console.log(`🚀 Server is running on http://localhost:3000`)
  console.log(`📡 CORS enabled for http://localhost:4200`)
  console.log(`🔗 Health check: http://localhost:3000/api/health`)
  console.log(`🔌 WebSocket server ready for connections`)
  console.log(`📊 Connected users: ${webSocketService.getUserCount()}`)
})

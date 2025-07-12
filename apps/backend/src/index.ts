import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'

// Import middleware and utilities
import { loggerMiddleware } from './utils/logger.js'
import { errorHandler, notFoundHandler } from './utils/errors.js'
import { routes } from './routes/index.js'
import { WebSocketService } from './services/websocket.js'
import { setWebSocketService } from './routes/projects.js'

const app = express()

// Security middleware
app.use(helmet())

// CORS middleware for frontend communication (localhost:4200)
app.use(cors({
  origin: ['http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Custom request logging middleware
app.use(loggerMiddleware)

// API routes
app.use('/api', routes)

// Root endpoint - API info
app.get('/', (_req, res) => {
  res.json({
    name: 'Quincy Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      projects: '/api/projects',
      websocket: '/api/websocket'
    }
  })
})

// Handle 404 errors
app.use(notFoundHandler)

// Handle errors
app.use(errorHandler)

// Create HTTP server
const httpServer = createServer(app)

// Initialize WebSocket service
const webSocketService = new WebSocketService(httpServer)

// Inject WebSocket service into projects routes
setWebSocketService(webSocketService)

// Start the server
const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
  console.log(`📡 CORS enabled for http://localhost:4200`)
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔌 WebSocket server ready for connections`)
  console.log(`📊 Connected users: ${webSocketService.getUserCount()}`)
})
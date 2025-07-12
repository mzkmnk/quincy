import { Router } from 'express'
import { websocket } from './websocket.js'
import { projects } from './projects.js'

const routes = Router()

// Health check endpoint
routes.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Projects routes
routes.use('/projects', projects)

// WebSocket routes
routes.use('/websocket', websocket)

export { routes }
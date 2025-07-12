import { Router } from 'express'
import { websocket } from './websocket.js'
import { projects } from './projects.js'
import { healthRoute } from './health'

const routes = Router()

// Health check endpoint
routes.use('/health', healthRoute)

// Projects routes
routes.use('/projects', projects)

// WebSocket routes
routes.use('/websocket', websocket)

export { routes }
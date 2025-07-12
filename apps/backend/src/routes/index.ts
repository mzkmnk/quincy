import { Router } from 'express'
import { websocket } from './websocket.js'
import { healthRoute } from './health'

const routes = Router()

// Health check endpoint
routes.use('/health', healthRoute)

// WebSocket routes
routes.use('/websocket', websocket)

export { routes }
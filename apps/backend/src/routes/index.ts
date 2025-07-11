import { Hono } from 'hono'
import { websocket } from './websocket.ts'
import { projects } from './projects.ts'

const routes = new Hono()

// Health check endpoint
routes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Projects routes
routes.route('/projects', projects)

// WebSocket routes
routes.route('/websocket', websocket)

export { routes }
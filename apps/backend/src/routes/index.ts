import { Hono } from 'hono'
import { healthRoute } from './health.js'

const routes = new Hono()

// Health check endpoint
routes.route('/health', healthRoute)

export { routes }
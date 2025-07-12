import { Hono } from 'hono'
import { getHealthStatus } from '../services/health'

const healthRoute = new Hono()

healthRoute.get('/', (c) => {
  const healthStatus = getHealthStatus()
  return c.json(healthStatus, 200)
})

export { healthRoute }
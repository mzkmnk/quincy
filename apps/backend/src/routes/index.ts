import { Hono } from 'hono'
import type { Project } from '@quincy/shared'

const routes = new Hono()

// Health check endpoint
routes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Projects endpoints (placeholder)
routes.get('/projects', (c) => {
  const projects: Project[] = [
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' }
  ]
  return c.json(projects)
})

export { routes }
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { Project, Session } from '@quincy/shared'

const app = new Hono()

app.get('/', (c) => {
  // sharedパッケージの型を使用するテスト
  const testProject: Project = {
    id: '1',
    name: 'Test Project'
  }
  
  const testSession: Session = {
    id: 'session-1',
    projectId: testProject.id
  }
  
  return c.json({ 
    message: 'Hello Hono!',
    project: testProject,
    session: testSession
  })
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

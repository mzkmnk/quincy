import { Router, Request, Response } from 'express'

const websocket = Router()

// WebSocket server status endpoint
websocket.get('/status', (_req: Request, res: Response) => {
  res.json({
    status: 'running',
    message: 'WebSocket server is operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      connection: 'ws://localhost:3000/socket.io/',
      events: {
        client_to_server: [
          'q:command',
          'q:abort',
          'q:history',
          'q:projects',
          'q:resume',
          'message:send',
          'room:join',
          'room:leave',
          'ping'
        ],
        server_to_client: [
          'q:response',
          'q:error',
          'q:complete',
          'q:history:data',
          'q:history:list',
          'session:created',
          'message:received',
          'message:broadcast',
          'room:joined',
          'room:left',
          'error',
          'pong'
        ]
      }
    }
  })
})

// WebSocket connection info endpoint
websocket.get('/info', (_req: Request, res: Response) => {
  res.json({
    cors: {
      origin: ['http://localhost:4200'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    configuration: {
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    },
    features: [
      'Amazon Q CLI Integration',
      'History Management',
      'Message Broadcasting',
      'Room Management',
      'Error Handling',
      'Heartbeat/Ping-Pong',
      'Reconnection Support'
    ]
  })
})

export { websocket }
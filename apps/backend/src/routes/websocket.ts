import { Hono } from 'hono'

const websocket = new Hono()

// WebSocket server status endpoint
websocket.get('/status', (c) => {
  return c.json({
    status: 'running',
    message: 'WebSocket server is operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      connection: 'ws://localhost:3000/socket.io/',
      events: {
        client_to_server: [
          'auth:request',
          'message:send',
          'room:join',
          'room:leave',
          'ping'
        ],
        server_to_client: [
          'auth:success',
          'auth:failure',
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
websocket.get('/info', (c) => {
  return c.json({
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
      'Authentication',
      'Message Broadcasting',
      'Room Management',
      'Error Handling',
      'Heartbeat/Ping-Pong',
      'Reconnection Support'
    ]
  })
})

export { websocket }
/**
 * WebSocket server integration test
 * Basic test to verify WebSocket server functionality
 */

import { WebSocketService } from '../services/websocket.ts'
import { createServer, Server } from 'http'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'
import type { 
  AuthenticationData, 
  ConnectionInfo, 
  MessageSendEvent, 
  MessageData 
} from '@quincy/shared'

describe('WebSocket Server', () => {
  let httpServer: Server
  let webSocketService: WebSocketService
  let clientSocket: ClientSocket
  const port = 3001 // Use different port for testing

  beforeAll((done) => {
    // Create HTTP server for testing
    httpServer = createServer()
    webSocketService = new WebSocketService(httpServer)
    
    // Start test server
    httpServer.listen(port, () => {
      console.log(`Test WebSocket server listening on port ${port}`)
      done()
    })
  })

  afterAll(() => {
    httpServer?.close()
  })

  beforeEach((done) => {
    // Create client connection
    clientSocket = Client(`http://localhost:${port}`)
    clientSocket.on('connect', done)
  })

  afterEach(() => {
    clientSocket?.close()
  })

  it('should accept client connections', (done) => {
    expect(clientSocket.connected).toBe(true)
    done()
  })

  it('should handle authentication requests', (done) => {
    const authData: AuthenticationData = {
      userId: 'test-user',
      sessionId: 'test-session'
    }

    clientSocket.emit('auth:request', authData)
    
    clientSocket.on('auth:success', (data: ConnectionInfo) => {
      expect(data.userId).toBe('test-user')
      expect(data.sessionId).toBe('test-session')
      expect(data.authenticated).toBe(true)
      expect(data.socketId).toBeDefined()
      done()
    })
  })

  it('should reject invalid authentication', (done) => {
    const invalidAuthData: AuthenticationData = {}

    clientSocket.emit('auth:request', invalidAuthData)
    
    clientSocket.on('auth:failure', (error) => {
      expect(error.code).toBe('INVALID_AUTH')
      expect(error.message).toContain('sessionId or userId required')
      done()
    })
  })

  it('should handle message broadcasting', (done) => {
    // First authenticate
    clientSocket.emit('auth:request', { userId: 'test-user' })
    
    clientSocket.on('auth:success', () => {
      // Create second client to receive broadcast
      const secondClient = Client(`http://localhost:${port}`)
      
      secondClient.on('connect', () => {
        secondClient.emit('auth:request', { userId: 'test-user-2' })
      })
      
      secondClient.on('auth:success', () => {
        // Listen for broadcast message
        secondClient.on('message:broadcast', (data: MessageData) => {
          expect(data.content).toBe('Hello, world!')
          expect(data.senderId).toBe('test-user')
          expect(data.type).toBe('text')
          secondClient.close()
          done()
        })
        
        // Send message from first client
        const messageData: MessageSendEvent = {
          content: 'Hello, world!',
          senderId: 'test-user',
          type: 'text'
        }
        clientSocket.emit('message:send', messageData)
      })
    })
  })

  it('should handle room management', (done) => {
    // Authenticate first
    clientSocket.emit('auth:request', { userId: 'test-user' })
    
    clientSocket.on('auth:success', () => {
      // Join a room
      clientSocket.emit('room:join', { roomId: 'test-room' })
      
      clientSocket.on('room:joined', (data) => {
        expect(data.roomId).toBe('test-room')
        expect(data.userId).toBe('test-user')
        
        // Leave the room
        clientSocket.emit('room:leave', { roomId: 'test-room' })
        
        clientSocket.on('room:left', (data) => {
          expect(data.roomId).toBe('test-room')
          expect(data.userId).toBe('test-user')
          done()
        })
      })
    })
  })

  it('should handle ping/pong', (done) => {
    clientSocket.emit('ping')
    
    clientSocket.on('pong', () => {
      done()
    })
  })

  it('should track connected users', () => {
    const connectedUsers = webSocketService.getConnectedUsers()
    expect(Array.isArray(connectedUsers)).toBe(true)
    
    const userCount = webSocketService.getUserCount()
    expect(typeof userCount).toBe('number')
    expect(userCount).toBeGreaterThanOrEqual(0)
  })
})
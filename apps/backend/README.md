# Quincy Backend - WebSocket Server

This backend application provides a real-time WebSocket server implementation using Socket.io integrated with Hono framework.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open in browser
open http://localhost:3000
```

## Features

- **Real-time Communication**: Socket.io WebSocket server
- **Direct Access**: No authentication required for local development
- **Room Management**: Join/leave rooms for group communication
- **Message Broadcasting**: Send messages to all users or specific rooms
- **Connection Management**: Auto-cleanup and reconnection support
- **Error Handling**: Comprehensive error responses
- **Health Monitoring**: Ping/pong heartbeat system

## WebSocket API

### Connection

Connect to the WebSocket server:
```javascript
const socket = io('http://localhost:3000');
```

### Direct Connection

Connect and start using features immediately (no authentication required):

```javascript
// Connection is ready to use immediately
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  // Can start sending messages or joining rooms immediately
});
```

### Messaging

Send and receive messages:

```javascript
// Send a message
socket.emit('message:send', {
  content: 'Hello, world!',
  senderId: 'user123',
  type: 'text',
  roomId: 'optional-room-id' // Leave empty for broadcast to all
});

// Receive messages
socket.on('message:received', (data) => {
  console.log('Message sent:', data);
});

socket.on('message:broadcast', (data) => {
  console.log('New message:', data.content);
});
```

### Room Management

Join and leave rooms for group communication:

```javascript
// Join a room
socket.emit('room:join', {
  roomId: 'project-123',
  projectId: 'optional-project-id'
});

// Leave a room
socket.emit('room:leave', {
  roomId: 'project-123'
});

// Handle room events
socket.on('room:joined', (data) => {
  console.log('Joined room:', data.roomId);
});

socket.on('room:left', (data) => {
  console.log('Left room:', data.roomId);
});
```

## HTTP API Endpoints

### WebSocket Status
```
GET /api/websocket/status
```

### WebSocket Info
```
GET /api/websocket/info
```

### Health Check
```
GET /api/health
```

## Scripts

```bash
# Development
pnpm dev

# Testing
pnpm test

# Build
pnpm build

# Production
pnpm start
```

## Configuration

- **Port**: 3000
- **CORS**: Enabled for `http://localhost:4200`
- **WebSocket**: Socket.io with polling/websocket transport
- **Environment**: Optimized for local development

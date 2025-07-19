import { createServer } from 'http';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import middleware and utilities
import { errorHandler, notFoundHandler } from './utils/errors';
import { routes } from './routes/index';
import { WebSocketService } from './services/websocket/index';

const app = express();

// Environment variables with defaults
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

// Compression middleware (for better performance)
app.use(compression());

// Enhanced security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Socket.io compatibility
  })
);

// CORS middleware with environment-based configuration
app.use(
  cors({
    origin:
      NODE_ENV === 'production'
        ? [FRONTEND_URL]
        : ['http://localhost:4200', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom request logging middleware

// API routes
app.use('/api', routes);

// Root endpoint - API info
app.get('/', (_req, res) => {
  res.json({
    name: 'Quincy Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      projects: '/api/projects',
      websocket: '/api/websocket',
    },
  });
});

// Handle 404 errors
app.use(notFoundHandler);

// Handle errors
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket service
const webSocketService = new WebSocketService(httpServer);

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for http://localhost:4200`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready for connections`);
  console.log(`📊 Connected users: ${webSocketService.getUserCount()}`);
});

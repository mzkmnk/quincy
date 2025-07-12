import type { Request, Response, NextFunction } from 'express'

// Simple logger utility
export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '')
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error)
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '')
  }
}

// Middleware for request logging
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  // Log when response finishes
  res.on('finish', () => {
    const end = Date.now()
    logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${end - start}ms`)
  })
  
  next()
}
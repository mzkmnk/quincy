import type { Request, Response, NextFunction } from 'express'
import { logger } from './logger'

export interface ErrorResponse {
  error: string
  message: string
  timestamp: string
  path?: string
}

export const createErrorResponse = (error: string, message: string, path?: string): ErrorResponse => ({
  error,
  message,
  timestamp: new Date().toISOString(),
  path
})

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Request error', error)
  
  const response = createErrorResponse(
    'INTERNAL_SERVER_ERROR',
    error.message || 'An unexpected error occurred',
    req.url
  )
  
  res.status(500).json(response)
}

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response) => {
  const response = createErrorResponse(
    'NOT_FOUND',
    'The requested resource was not found',
    req.url
  )
  res.status(404).json(response)
}
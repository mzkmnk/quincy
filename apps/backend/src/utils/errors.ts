import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from './logger.ts'

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

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next()
  } catch (error) {
    logger.error('Request error', error)
    
    if (error instanceof HTTPException) {
      const response = createErrorResponse(
        'HTTP_ERROR',
        error.message,
        c.req.url
      )
      return c.json(response, error.status)
    }

    // Handle generic errors
    const response = createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      c.req.url
    )
    return c.json(response, 500)
  }
}

export const notFoundHandler = (c: Context) => {
  const response = createErrorResponse(
    'NOT_FOUND',
    'The requested resource was not found',
    c.req.url
  )
  return c.json(response, 404)
}
// Simple logger utility
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '')
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : '')
  }
}

// Middleware for request logging
export const loggerMiddleware = async (c: any, next: any) => {
  const start = Date.now()
  await next()
  const end = Date.now()
  logger.info(`${c.req.method} ${c.req.url} - ${c.res.status} - ${end - start}ms`)
}
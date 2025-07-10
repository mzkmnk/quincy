export interface HealthStatus {
  status: 'OK' | 'ERROR'
  timestamp: string
  uptime: number
  version?: string
}

export const getHealthStatus = (): HealthStatus => {
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
}
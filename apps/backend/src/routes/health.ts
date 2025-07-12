import { Router, Request, Response } from 'express'
import { getHealthStatus } from '../services/health'

const healthRoute = Router()

healthRoute.get('/', (_req: Request, res: Response) => {
  const healthStatus = getHealthStatus()
  res.status(200).json(healthStatus)
})

export { healthRoute }
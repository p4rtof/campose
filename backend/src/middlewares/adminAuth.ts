import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'
import { AppError } from '../lib/errors.js'

export function adminAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new AppError(401, 'UNAUTHORIZED', 'Token admin diperlukan')
  try {
    const payload = verifyToken(auth.slice(7))
    ;(req as any).admin = payload
    next()
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Token tidak valid atau kadaluwarsa')
  }
}

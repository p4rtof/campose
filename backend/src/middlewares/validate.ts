import type { RequestHandler } from 'express'
import type { ZodSchema } from 'zod'
import { AppError } from '../lib/errors.js'

type Source = 'body' | 'query'

export const validate =
  (schema: ZodSchema, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Input tidak valid', result.error.flatten().fieldErrors))
    }
    ;(req as any)[source] = result.data
    next()
  }

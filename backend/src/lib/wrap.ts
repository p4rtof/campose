import type { RequestHandler } from 'express'

// Meneruskan error dari handler async ke errorHandler (Express 4).
export const wrap =
  (fn: (...args: Parameters<RequestHandler>) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next)
  }

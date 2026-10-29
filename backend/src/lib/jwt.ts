import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'campose-secret-admin-2026'
const EXPIRES = '7d'

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES })
}

export function verifyToken(token: string): { adminId: number; role: string } {
  return jwt.verify(token, SECRET) as { adminId: number; role: string }
}

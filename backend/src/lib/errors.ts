// Kode error mengikuti docs/API-CONTRACT.md
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const ok = <T>(data: T) => ({ success: true as const, data })

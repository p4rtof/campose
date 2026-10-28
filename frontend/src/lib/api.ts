import axios from 'axios'

// Semua pemanggilan backend lewat instance ini.
// Saat dev, '/api' diteruskan ke backend (lihat vite.config.ts).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15000,
})

export type ApiError = { success: false; error: { code: string; message: string } }

export function apiErrorMessage(e: unknown): string {
  const data = (e as { response?: { data?: ApiError } })?.response?.data
  return data?.error?.message ?? 'Terjadi kesalahan. Coba lagi sebentar.'
}

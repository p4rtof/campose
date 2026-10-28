export const fmt = (n: number) => 'Rp' + n.toLocaleString('id-ID')
export const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export const dateLabel = (month: number, day: number) => `${DAYS[new Date(2026, month - 1, day).getDay()]}, ${day} ${MONTHS[month]} 2026`
export const endTime = (start: string, h: number) => `${String((parseInt(start) + h) % 24).padStart(2, '0')}.00`

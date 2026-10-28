// Jam di aplikasi memakai format "09.00".
export const hourOf = (t: string) => parseInt(t.split('.')[0], 10)
export const toTime = (h: number) => `${String(h % 24).padStart(2, '0')}.00`

// Jam mulai yang ditawarkan (sama dengan SLOTS di frontend).
export const START_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

export const dayRange = (date: string) => new Date(`${date}T00:00:00.000Z`)

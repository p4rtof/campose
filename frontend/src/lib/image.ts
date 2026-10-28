import { type CSSProperties } from 'react'

export function crop(src: string, W: number, H: number, x: number, y: number, w: number, h: number): CSSProperties {
  return { backgroundImage: `url(${src})`, backgroundRepeat: 'no-repeat', backgroundSize: `${(W / w) * 100}% auto`, backgroundPosition: `${W === w ? 0 : (x / (W - w)) * 100}% ${H === h ? 0 : (y / (H - h)) * 100}%`, aspectRatio: `${w} / ${h}` }
}
export const col = (x: number, y: number, w: number, h: number) => crop('/assets/collage.png', 1176, 651, x, y, w, h)
export const occ = (i: number): CSSProperties => ({ ...crop('/assets/occasion.png', 1176, 642, [0, 413, 840][i], 92, [398, 413, 336][i], 308), aspectRatio: '1.29 / 1' })

/** Aperture "o" cut from the official campose logo. */
export function Aperture({ size = 28, light = false }: { size?: number; light?: boolean }) {
  return <img src={light ? '/assets/icon-white.png' : '/assets/icon-blue.png'} width={size} height={size} alt="" style={{ display: 'inline-block' }} />
}
/** Official campose wordmark. `light` = white version (use on blue); default = blue version (use on white). */
export function Logo({ light = false, size = 32 }: { light?: boolean; size?: number }) {
  return <img src={light ? '/assets/logo-white.png' : '/assets/logo-blue.png'} alt="campose" style={{ height: size * 0.8, width: 'auto', display: 'block' }} />
}
export function SilkWaves({ dark = false }: { dark?: boolean }) {
  const c = dark ? '#ffffff' : '#1A76D2'
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 700" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`g${dark}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c} stopOpacity={dark ? 0.22 : 0.1} /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient>
      </defs>
      <path d="M380 0 C 620 180, 560 420, 900 700 L 1180 700 C 880 420, 900 160, 640 0Z" fill={`url(#g${dark})`} />
      <path d="M700 0 C 960 200, 900 440, 1240 700 L 1440 700 L 1440 0Z" fill={`url(#g${dark})`} opacity=".7" />
      <path d="M0 520 C 300 420, 520 640, 860 560 S 1240 480, 1440 560 L 1440 700 L 0 700Z" fill={`url(#g${dark})`} opacity=".6" />
    </svg>
  )
}

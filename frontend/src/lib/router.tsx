import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

export function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}
export function usePath() {
  const [p, setP] = useState(window.location.pathname)
  useEffect(() => {
    const f = () => setP(window.location.pathname)
    window.addEventListener('popstate', f)
    return () => window.removeEventListener('popstate', f)
  }, [])
  return p
}
export function Link({ to, children, className = '', style }: { to: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <a href={to} className={className} style={style} onClick={(e) => { e.preventDefault(); navigate(to) }}>
      {children}
    </a>
  )
}

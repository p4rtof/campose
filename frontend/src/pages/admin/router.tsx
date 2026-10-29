import { AnchorHTMLAttributes, createContext, useContext } from 'react'

export const NavCtx = createContext<{ loc: string; navigate: (to: string, replace?: boolean) => void }>({
  loc: '/admin',
  navigate: () => {},
})
export const useNav = () => useContext(NavCtx)

export function A({ to, children, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { navigate } = useNav()
  // Normalisasi path agar selalu berawalan /admin jika internal link
  const target = to.startsWith('http') || to.startsWith('//') || to.startsWith('#')
    ? to
    : to.startsWith('/admin')
      ? to
      : to === '/'
        ? '/admin'
        : `/admin${to}`

  return (
    <a
      href={target}
      {...rest}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || target.startsWith('http')) return
        e.preventDefault()
        navigate(target)
      }}
    >
      {children}
    </a>
  )
}

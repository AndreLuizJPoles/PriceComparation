import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SearchBar } from '@/components/SearchBar'
import { cn } from '@/lib/cn'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-brand-100 text-brand-800' : 'text-surface-700 hover:bg-surface-100 hover:text-surface-900',
  )

export function Header() {
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = () => {
    void logout()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-surface-200/80 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <BrandLogo />
        <div className="order-3 w-full lg:order-2 lg:max-w-md lg:flex-1 lg:px-6">
          <SearchBar variant="compact" placeholder="Buscar produtos…" />
        </div>
        <nav className="order-2 flex flex-wrap items-center gap-1 lg:order-3" aria-label="Principal">
          <NavLink to="/search" className={navLinkClass}>
            Busca
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/favorites" className={navLinkClass}>
                Favoritos
              </NavLink>
              <NavLink to="/alerts" className={navLinkClass}>
                Alertas
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Perfil
              </NavLink>
            </>
          )}
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Entrar
              </NavLink>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Criar conta
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm text-surface-700 hover:bg-surface-100"
              aria-label={user ? `Sair da conta de ${user.name}` : 'Sair'}
            >
              Sair
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

function BrandLogo() {
  return (
    <Link to="/" className="order-1 flex items-center gap-2">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-md"
        aria-hidden
      >
        ₢
      </span>
      <span className="text-lg font-semibold tracking-tight text-surface-900">
        Price<span className="text-brand-700">Comparator</span>
      </span>
    </Link>
  )
}
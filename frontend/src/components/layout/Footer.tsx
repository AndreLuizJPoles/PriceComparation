import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isDemoMode } from '@/lib/format'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-surface-200 bg-surface-900 text-surface-100">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-white">PriceComparator</p>
          <p className="mt-2 text-sm text-surface-200">
            Compare ofertas, acompanhe histórico de preços e receba alertas quando o valor cair.
          </p>
        </div>
        <FooterColumn title="Navegação">
          <FooterLink to="/search">Buscar produtos</FooterLink>
          <FooterLink to="/favorites">Favoritos</FooterLink>
          <FooterLink to="/alerts">Alertas de preço</FooterLink>
        </FooterColumn>
        <FooterColumn title="Conta">
          <FooterLink to="/login">Entrar</FooterLink>
          <FooterLink to="/register">Criar conta</FooterLink>
          <FooterLink to="/profile">Meu perfil</FooterLink>
        </FooterColumn>
      </div>
      <div className="border-t border-surface-800 px-4 py-4 text-center text-xs text-surface-300">
        © {new Date().getFullYear()} PriceComparator
        {isDemoMode && ' · Ambiente de demonstração'}
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-surface-200 transition hover:text-brand-300">
        {children}
      </Link>
    </li>
  )
}
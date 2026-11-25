import { isDemoMode } from '@/lib/format'

export function DemoBanner() {
  if (!isDemoMode) return null

  return (
    <div
      role="status"
      className="border-b border-brand-700/30 bg-gradient-to-r from-brand-800 via-brand-700 to-surface-800 px-4 py-2 text-center text-sm text-brand-50"
    >
      <span className="font-medium">Modo demonstração</span>
      <span className="hidden sm:inline">
        {' '}
        — preços e lojas são simulados para fins de teste. Integrações reais serão habilitadas com
        credenciais oficiais.
      </span>
    </div>
  )
}
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value
  if (Number.isNaN(numeric)) return '—'
  return currencyFormatter.format(numeric)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function parsePrice(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return Number.POSITIVE_INFINITY
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value
  return Number.isNaN(numeric) ? Number.POSITIVE_INFINITY : numeric
}

export function availabilityLabel(code: string): string {
  const map: Record<string, string> = {
    in_stock: 'Em estoque',
    out_of_stock: 'Indisponível',
    limited: 'Estoque limitado',
    preorder: 'Pré-venda',
  }
  return map[code] ?? code
}

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
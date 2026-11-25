import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProductSuggestions } from '@/services/products'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'

interface SearchBarProps {
  defaultQuery?: string
  variant?: 'hero' | 'compact'
  placeholder?: string
  autoFocus?: boolean
}

export function SearchBar({
  defaultQuery = '',
  variant = 'hero',
  placeholder = 'O que você está procurando?',
  autoFocus = false,
}: SearchBarProps) {
  const navigate = useNavigate()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(defaultQuery)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 350)

  const { data: suggestions = [], isFetching, isError } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => fetchProductSuggestions(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2 && isOpen,
    staleTime: 30_000,
  })

  useEffect(() => {
    setQuery(defaultQuery)
  }, [defaultQuery])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    setIsOpen(false)
    void navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSelect = (productId: string, name: string) => {
    setIsOpen(false)
    setQuery(name)
    void navigate(`/products/${productId}`)
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} role="search" className="relative">
        <label htmlFor={listId} className="sr-only">
          Buscar produtos
        </label>
        <input
          ref={inputRef}
          id={listId}
          type="search"
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 150)
          }}
          className={cn(
            'w-full rounded-2xl border border-surface-200 bg-white pr-28 text-surface-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200',
            variant === 'hero' ? 'px-5 py-4 text-base' : 'px-4 py-2.5 text-sm',
          )}
          aria-autocomplete="list"
          aria-controls={`${listId}-suggestions`}
          aria-expanded={isOpen && suggestions.length > 0}
        />
        <button
          type="submit"
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-brand-600 font-medium text-white transition hover:bg-brand-700',
            variant === 'hero' ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs',
          )}
        >
          Buscar
        </button>
      </form>

      {isOpen && debouncedQuery.trim().length >= 2 && (
        <ul
          id={`${listId}-suggestions`}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-surface-200 bg-white py-2 shadow-lg"
        >
          {isFetching && (
            <li className="px-4 py-2 text-sm text-surface-700">Buscando sugestões…</li>
          )}
          {!isFetching && isError && (
            <li className="px-4 py-2 text-sm text-red-600">
              Autocomplete indisponível no momento.
            </li>
          )}
          {!isFetching && !isError && suggestions.length === 0 && (
            <li className="px-4 py-2 text-sm text-surface-700">Nenhuma sugestão.</li>
          )}
          {suggestions.map((product) => (
            <li key={product.id} role="option">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-brand-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(product.id, product.name)}
              >
                <span className="line-clamp-1 font-medium text-surface-900">{product.name}</span>
                {product.min_total_price !== null && (
                  <span className="shrink-0 text-brand-700">
                    {formatCurrency(product.min_total_price)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
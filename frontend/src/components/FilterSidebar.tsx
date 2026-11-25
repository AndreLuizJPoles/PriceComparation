import type { SearchSort } from '@/types/api'

export interface FilterValues {
  category: string
  minPrice: string
  maxPrice: string
  store: string
  sort: SearchSort
}

interface FilterSidebarProps {
  values: FilterValues
  categories: { slug: string; name: string }[]
  stores: { slug: string; name: string }[]
  onChange: (values: FilterValues) => void
  onApply: () => void
}

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'Nome A–Z' },
]

export function FilterSidebar({
  values,
  categories,
  stores,
  onChange,
  onApply,
}: FilterSidebarProps) {
  const update = (partial: Partial<FilterValues>) => {
    onChange({ ...values, ...partial })
  }

  return (
    <aside
      className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm"
      aria-label="Filtros de busca"
    >
      <h2 className="text-base font-semibold text-surface-900">Filtros</h2>

      <label className="mt-4 block text-sm font-medium text-surface-800">
        Categoria
        <select
          value={values.category}
          onChange={(event) => update({ category: event.target.value })}
          className="mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-medium text-surface-800">
        Loja
        <select
          value={values.store}
          onChange={(event) => update({ store: event.target.value })}
          className="mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {stores.map((store) => (
            <option key={store.slug} value={store.slug}>
              {store.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-surface-800">Faixa de preço (R$)</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín."
            value={values.minPrice}
            onChange={(event) => update({ minPrice: event.target.value })}
            className="rounded-lg border border-surface-200 px-3 py-2 text-sm"
            aria-label="Preço mínimo"
          />
          <input
            type="number"
            min={0}
            placeholder="Máx."
            value={values.maxPrice}
            onChange={(event) => update({ maxPrice: event.target.value })}
            className="rounded-lg border border-surface-200 px-3 py-2 text-sm"
            aria-label="Preço máximo"
          />
        </div>
      </fieldset>

      <label className="mt-4 block text-sm font-medium text-surface-800">
        Ordenar por
        <select
          value={values.sort}
          onChange={(event) => update({ sort: event.target.value as SearchSort })}
          className="mt-1 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onApply}
        className="mt-6 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Aplicar filtros
      </button>
    </aside>
  )
}
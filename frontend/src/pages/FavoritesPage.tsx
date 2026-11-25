import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchFavorites, removeFavorite } from '@/services/favorites'
import { ProductCard } from '@/components/ProductCard'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import type { FavoriteItem } from '@/types/api'

export function FavoritesPage() {
  const queryClient = useQueryClient()

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  })

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeFavorite(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-surface-900">Favoritos</h1>
      <p className="mt-2 text-sm text-surface-700">
        Produtos que você salvou para comparar depois.
      </p>

      {favoritesQuery.isLoading && <LoadingState />}
      {favoritesQuery.isError && (
        <ErrorState error={favoritesQuery.error} onRetry={() => void favoritesQuery.refetch()} />
      )}

      {favoritesQuery.isSuccess && favoritesQuery.data.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-surface-200 bg-white p-10 text-center text-sm">
          Nenhum favorito ainda.{' '}
          <Link to="/search" className="font-medium text-brand-700 hover:underline">
            Buscar produtos
          </Link>
        </p>
      )}

      {favoritesQuery.isSuccess && favoritesQuery.data.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoritesQuery.data.map((item) => (
            <FavoriteCard
              key={item.id}
              item={item}
              onRemove={() => removeMutation.mutate(item.product_id ?? item.product.id)}
              isRemoving={removeMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FavoriteCard({
  item,
  onRemove,
  isRemoving,
}: {
  item: FavoriteItem
  onRemove: () => void
  isRemoving: boolean
}) {
  return (
    <div className="relative">
      <ProductCard product={item.product} />
      <button
        type="button"
        disabled={isRemoving}
        onClick={onRemove}
        className="absolute right-3 top-3 rounded-lg bg-white/95 px-2 py-1 text-xs font-medium text-red-700 shadow hover:bg-white"
        aria-label={`Remover ${item.product.name} dos favoritos`}
      >
        Remover
      </button>
    </div>
  )
}
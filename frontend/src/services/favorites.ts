import { apiRequest } from '@/services/api-client'
import type { FavoriteItem } from '@/types/api'

export async function fetchFavorites() {
  return apiRequest<FavoriteItem[]>('/favorites')
}

export async function addFavorite(productId: string) {
  return apiRequest<FavoriteItem>('/favorites', {
    method: 'POST',
    body: { product_id: productId },
  })
}

export async function removeFavorite(productId: string) {
  return apiRequest<{ ok: boolean }>(`/favorites/${productId}`, {
    method: 'DELETE',
  })
}
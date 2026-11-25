import { apiRequest } from '@/services/api-client'
import type { PriceAlertItem } from '@/types/api'

export interface CreateAlertPayload {
  product_id: string
  target_price: number
}

export interface UpdateAlertPayload {
  target_price?: number
  is_active?: boolean
}

export async function fetchAlerts() {
  return apiRequest<PriceAlertItem[]>('/alerts')
}

export async function createAlert(payload: CreateAlertPayload) {
  return apiRequest<PriceAlertItem>('/alerts', {
    method: 'POST',
    body: payload,
  })
}

export async function updateAlert(alertId: string, payload: UpdateAlertPayload) {
  return apiRequest<PriceAlertItem>(`/alerts/${alertId}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteAlert(alertId: string) {
  return apiRequest<{ ok: boolean }>(`/alerts/${alertId}`, {
    method: 'DELETE',
  })
}
import { apiRequest } from '@/services/api-client'
import type { UserProfile } from '@/types/api'

export interface UpdateProfilePayload {
  name?: string
  email?: string
}

export async function fetchCurrentUser() {
  return apiRequest<UserProfile>('/users/me')
}

export async function updateCurrentUser(payload: UpdateProfilePayload) {
  return apiRequest<UserProfile>('/users/me', {
    method: 'PATCH',
    body: payload,
  })
}
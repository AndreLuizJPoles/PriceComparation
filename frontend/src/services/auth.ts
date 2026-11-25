import { apiRequest } from '@/services/api-client'
import { setAccessToken } from '@/services/api-client'
import type { AuthLoginResponse, UserProfile } from '@/types/api'

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<UserProfile>('/auth/register', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  })
}

export async function loginUser(payload: LoginPayload) {
  const response = await apiRequest<AuthLoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  })
  setAccessToken(response.access_token)
  return response
}

export async function logoutUser() {
  try {
    await apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
  }
}

export async function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  })
}

export async function resetPassword(token: string, password: string) {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, password },
    skipAuth: true,
  })
}

export async function refreshSession() {
  const response = await apiRequest<AuthLoginResponse>('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  })
  setAccessToken(response.access_token)
  return response
}
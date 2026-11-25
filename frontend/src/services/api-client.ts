import type { ApiEnvelope } from '@/types/api'
import { ApiClientError, NetworkError } from '@/types/api'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

let accessToken: string | null = null
let refreshInFlight: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) return null
      const body = (await response.json()) as ApiEnvelope<{ access_token: string }>
      if (body.data?.access_token) {
        setAccessToken(body.data.access_token)
        return body.data.access_token
      }
      return null
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
  retryOnUnauthorized?: boolean
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, retryOnUnauthorized = true, headers, ...rest } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (!skipAuth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      credentials: 'include',
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new NetworkError()
  }

  if (response.status === 401 && !skipAuth && retryOnUnauthorized) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false })
    }
    setAccessToken(null)
  }

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiClientError(
      'Resposta inválida do servidor.',
      'invalid_response',
      response.status,
    )
  }

  if (!response.ok || envelope.error) {
    throw new ApiClientError(
      envelope.error?.message ?? 'Ocorreu um erro na requisição.',
      envelope.error?.code ?? 'request_failed',
      response.status,
    )
  }

  if (envelope.data === null) {
    throw new ApiClientError('Dados não encontrados.', 'not_found', response.status)
  }

  return envelope.data
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: T; meta?: ApiEnvelope<T>['meta'] }> {
  const { body, skipAuth = false, retryOnUnauthorized = true, headers, ...rest } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')
  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }
  if (!skipAuth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      credentials: 'include',
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new NetworkError()
  }

  if (response.status === 401 && !skipAuth && retryOnUnauthorized) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiRequestWithMeta<T>(path, { ...options, retryOnUnauthorized: false })
    }
    setAccessToken(null)
  }

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiClientError(
      'Resposta inválida do servidor.',
      'invalid_response',
      response.status,
    )
  }

  if (!response.ok || envelope.error) {
    throw new ApiClientError(
      envelope.error?.message ?? 'Ocorreu um erro na requisição.',
      envelope.error?.code ?? 'request_failed',
      response.status,
    )
  }

  if (envelope.data === null) {
    throw new ApiClientError('Dados não encontrados.', 'not_found', response.status)
  }

  return { data: envelope.data, meta: envelope.meta }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== false) {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
import i18n from '../i18n'

const API_BASE = '/api'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

class ApiClient {
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      const refreshed = await this.refreshTokens()
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        })
        return this.parseResponse<T>(retryResponse)
      }
      return { data: null, error: i18n.t('api.sessionExpired'), status: 401 }
    }

    return this.parseResponse<T>(response)
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status

    if (status === 204) {
      return { data: null, error: null, status }
    }

    let body: Record<string, unknown>
    try {
      body = await response.json()
    } catch {
      return { data: null, error: i18n.t('api.serverError', { status }), status }
    }

    if (response.ok) {
      return { data: body as T, error: null, status }
    }

    const error = (body.detail as string) || (body.message as string) || i18n.t('api.unexpectedError')
    return { data: null, error, status }
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) return false

      const body = await response.json()
      this.accessToken = body.access_token
      return true
    } catch {
      return false
    }
  }

  async post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' })
  }
}

export const apiClient = new ApiClient()
export default apiClient

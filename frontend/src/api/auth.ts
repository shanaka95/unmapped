import apiClient from './client'

export interface User {
  id: number
  name: string
  email: string
  is_verified: boolean
  role: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface MessageResponse {
  message: string
}

export async function register(name: string, email: string, password: string, confirm_password: string) {
  return apiClient.post<AuthResponse>('/auth/register', {
    name, email, password, confirm_password,
  })
}

export async function login(email: string, password: string) {
  return apiClient.post<AuthResponse>('/auth/login', { email, password })
}

export async function logout() {
  const result = await apiClient.post<MessageResponse>('/auth/logout', {})
  apiClient.setAccessToken(null)
  return result
}

export async function verifyEmail(token: string) {
  return apiClient.post<User>('/auth/verify-email', { token })
}

export async function forgotPassword(email: string) {
  return apiClient.post<MessageResponse>('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, new_password: string, confirm_password: string) {
  return apiClient.post<MessageResponse>('/auth/reset-password', {
    token, new_password, confirm_password,
  })
}

export async function getMe() {
  return apiClient.get<User>('/auth/me')
}

export interface AdminStats {
  total_users: number
  verified_users: number
  total_sectors: number
  total_occupations: number
  admin: User
}

export async function getAdminStats() {
  return apiClient.get<AdminStats>('/admin/stats')
}

export async function getAdminUsers() {
  return apiClient.get<User[]>('/admin/users')
}

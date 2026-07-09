import client from './client'
import type { ResponseSchema, TokenResponse, LoginRequest } from '../types'

export function login(data: LoginRequest): Promise<TokenResponse> {
  return client.post('/api/v1/auth/login', data)
}

import client from './client'
import type { ProviderCreate, ProviderRead, ProviderUpdate, TestConnectionResult, PageResult } from '../types'

export function createProvider(data: ProviderCreate): Promise<ProviderRead> {
  return client.post('/api/v1/providers', data)
}

export function listProviders(params: {
  page?: number
  page_size?: number
  keyword?: string
}): Promise<PageResult<ProviderRead>> {
  return client.get('/api/v1/providers', { params })
}

export function getProvider(providerId: number): Promise<ProviderRead> {
  return client.get(`/api/v1/providers/${providerId}`)
}

export function updateProvider(providerId: number, data: ProviderUpdate): Promise<ProviderRead> {
  return client.put(`/api/v1/providers/${providerId}`, data)
}

export function deleteProvider(providerId: number): Promise<null> {
  return client.delete(`/api/v1/providers/${providerId}`)
}

export function testProviderConnection(providerId: number): Promise<TestConnectionResult> {
  return client.post(`/api/v1/providers/${providerId}/test`)
}

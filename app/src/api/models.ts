import client from './client'
import type { ModelCreate, ModelRead, ModelUpdate, PageResult } from '../types'

export function createModel(data: ModelCreate): Promise<ModelRead> {
  return client.post('/api/v1/models', data)
}

export function listModels(params: {
  page?: number
  page_size?: number
  keyword?: string
  provider_id?: number
}): Promise<PageResult<ModelRead>> {
  return client.get('/api/v1/models', { params })
}

export function getModel(modelId: number): Promise<ModelRead> {
  return client.get(`/api/v1/models/${modelId}`)
}

export function updateModel(modelId: number, data: ModelUpdate): Promise<ModelRead> {
  return client.put(`/api/v1/models/${modelId}`, data)
}

export function deleteModel(modelId: number): Promise<null> {
  return client.delete(`/api/v1/models/${modelId}`)
}

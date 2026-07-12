import client from './client'
import type {
  PromptCreate, PromptRead, PromptUpdate, PromptVersionRead,
  PublishRequest, RollbackRequest, PageResult,
} from '../types'

export function createPrompt(data: PromptCreate): Promise<PromptRead> {
  return client.post('/api/v1/prompts', data)
}

export function listPrompts(params: {
  page?: number
  page_size?: number
  keyword?: string
}): Promise<PageResult<PromptRead>> {
  return client.get('/api/v1/prompts', { params })
}

export function getPrompt(promptId: number): Promise<PromptRead> {
  return client.get(`/api/v1/prompts/${promptId}`)
}

export function updatePrompt(promptId: number, data: PromptUpdate): Promise<PromptRead> {
  return client.put(`/api/v1/prompts/${promptId}`, data)
}

export function deletePrompt(promptId: number): Promise<null> {
  return client.delete(`/api/v1/prompts/${promptId}`)
}

export function publishPrompt(promptId: number, data: PublishRequest): Promise<PromptRead> {
  return client.post(`/api/v1/prompts/${promptId}/publish`, data)
}

export function getPromptVersions(promptId: number): Promise<PromptVersionRead[]> {
  return client.get(`/api/v1/prompts/${promptId}/versions`)
}

export function rollbackPrompt(promptId: number, data: RollbackRequest): Promise<PromptRead> {
  return client.post(`/api/v1/prompts/${promptId}/rollback`, data)
}

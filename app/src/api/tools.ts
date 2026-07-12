import client from './client'
import type { ToolCreate, ToolRead, ToolUpdate, ToolTestRequest, ToolTestResponse, PageResult } from '../types'

export function createTool(data: ToolCreate): Promise<ToolRead> {
  return client.post('/api/v1/tools', data)
}
export function listTools(params: { page?: number; page_size?: number; keyword?: string }): Promise<PageResult<ToolRead>> {
  return client.get('/api/v1/tools', { params })
}
export function getTool(toolId: number): Promise<ToolRead> {
  return client.get(`/api/v1/tools/${toolId}`)
}
export function updateTool(toolId: number, data: ToolUpdate): Promise<ToolRead> {
  return client.put(`/api/v1/tools/${toolId}`, data)
}
export function deleteTool(toolId: number): Promise<null> {
  return client.delete(`/api/v1/tools/${toolId}`)
}
export function enableTool(toolId: number): Promise<ToolRead> {
  return client.post(`/api/v1/tools/${toolId}/enable`)
}
export function disableTool(toolId: number): Promise<ToolRead> {
  return client.post(`/api/v1/tools/${toolId}/disable`)
}
export function testTool(toolId: number, data: ToolTestRequest): Promise<ToolTestResponse> {
  return client.post(`/api/v1/tools/${toolId}/test`, data)
}

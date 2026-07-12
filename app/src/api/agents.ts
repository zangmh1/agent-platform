import client from './client'
import type {
  AgentCreate, AgentRead, AgentUpdate, AgentVersionRead,
  PublishRequest, RollbackRequest, PageResult,
} from '../types'

export function createAgent(data: AgentCreate): Promise<AgentRead> {
  return client.post('/api/v1/agents', data)
}
export function listAgents(params: { page?: number; page_size?: number; keyword?: string }): Promise<PageResult<AgentRead>> {
  return client.get('/api/v1/agents', { params })
}
export function getAgent(agentId: number): Promise<AgentRead> {
  return client.get(`/api/v1/agents/${agentId}`)
}
export function updateAgent(agentId: number, data: AgentUpdate): Promise<AgentRead> {
  return client.put(`/api/v1/agents/${agentId}`, data)
}
export function deleteAgent(agentId: number): Promise<null> {
  return client.delete(`/api/v1/agents/${agentId}`)
}
export function startAgent(agentId: number): Promise<AgentRead> {
  return client.post(`/api/v1/agents/${agentId}/start`)
}
export function stopAgent(agentId: number): Promise<AgentRead> {
  return client.post(`/api/v1/agents/${agentId}/stop`)
}
export function publishAgent(agentId: number, data: PublishRequest): Promise<AgentRead> {
  return client.post(`/api/v1/agents/${agentId}/publish`, data)
}
export function getAgentVersions(agentId: number): Promise<AgentVersionRead[]> {
  return client.get(`/api/v1/agents/${agentId}/versions`)
}
export function rollbackAgent(agentId: number, data: RollbackRequest): Promise<AgentRead> {
  return client.post(`/api/v1/agents/${agentId}/rollback`, data)
}

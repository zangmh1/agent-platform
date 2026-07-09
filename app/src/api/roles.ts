import client from './client'
import type { RoleCreate, RoleRead, RoleUpdate, RoleAssignPermissions, PageResult } from '../types'

export function createRole(data: RoleCreate): Promise<RoleRead> {
  return client.post('/api/v1/roles', data)
}

export function listRoles(params: {
  page?: number
  page_size?: number
  keyword?: string
}): Promise<PageResult<RoleRead>> {
  return client.get('/api/v1/roles', { params })
}

export function listAllRoles(): Promise<RoleRead[]> {
  return client.get('/api/v1/roles/')
}

export function getRole(roleId: number): Promise<RoleRead> {
  return client.get(`/api/v1/roles/${roleId}`)
}

export function updateRole(roleId: number, data: RoleUpdate): Promise<RoleRead> {
  return client.put(`/api/v1/roles/${roleId}`, data)
}

export function deleteRole(roleId: number): Promise<null> {
  return client.delete(`/api/v1/roles/${roleId}`)
}

export function assignRolePermissions(roleId: number, data: RoleAssignPermissions): Promise<RoleRead> {
  return client.put(`/api/v1/roles/${roleId}/permissions`, data)
}

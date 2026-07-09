import client from './client'
import type { PermissionCreate, PermissionRead, PermissionUpdate, PageResult } from '../types'

export function createPermission(data: PermissionCreate): Promise<PermissionRead> {
  return client.post('/api/v1/permissions/', data)
}

export function listPermissions(params: {
  page?: number
  page_size?: number
  keyword?: string
}): Promise<PageResult<PermissionRead>> {
  return client.get('/api/v1/permissions', { params })
}

export function listAllPermissions(): Promise<PermissionRead[]> {
  return client.get('/api/v1/permissions/')
}

export function getPermission(permissionId: number): Promise<PermissionRead> {
  return client.get(`/api/v1/permissions/${permissionId}`)
}

export function updatePermission(permissionId: number, data: PermissionUpdate): Promise<PermissionRead> {
  return client.put(`/api/v1/permissions/${permissionId}`, data)
}

export function deletePermission(permissionId: number): Promise<null> {
  return client.delete(`/api/v1/permissions/${permissionId}`)
}

import client from './client'
import type { UserCreate, UserRead, UserWithRolesRead, PageResult } from '../types'

export function createUser(data: UserCreate): Promise<UserRead> {
  return client.post('/users', data)
}

export function listUsers(params: {
  page?: number
  page_size?: number
  keyword?: string
}): Promise<PageResult<UserRead>> {
  return client.get('/users', { params })
}

export function getCurrentUser(): Promise<UserRead> {
  return client.get('/users/me')
}

export function getUser(userId: number): Promise<UserRead> {
  return client.get(`/users/${userId}`)
}

export function getUserRoles(userId: number): Promise<UserWithRolesRead[]> {
  return client.get(`/users/${userId}/roles`)
}

export function deleteUser(userId: number): Promise<null> {
  return client.delete(`/users/${userId}`)
}

export function assignUserRoles(userId: number, roleIds: number[]): Promise<UserRead> {
  return client.put(`/users/${userId}/roles`, roleIds)
}

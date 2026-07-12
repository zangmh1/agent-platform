import client from './client'
import type {
  KnowledgeBaseCreate, KnowledgeBaseRead, KnowledgeBaseUpdate,
  DocumentRead, SegmentRead, SegmentUpdate, PageResult,
} from '../types'

// ===== 知识库 CRUD =====
export function createKnowledgeBase(data: KnowledgeBaseCreate): Promise<KnowledgeBaseRead> {
  return client.post('/api/v1/knowledge-bases', data)
}
export function listKnowledgeBases(params: { page?: number; page_size?: number; keyword?: string }): Promise<PageResult<KnowledgeBaseRead>> {
  return client.get('/api/v1/knowledge-bases', { params })
}
export function getKnowledgeBase(kbId: number): Promise<KnowledgeBaseRead> {
  return client.get(`/api/v1/knowledge-bases/${kbId}`)
}
export function updateKnowledgeBase(kbId: number, data: KnowledgeBaseUpdate): Promise<KnowledgeBaseRead> {
  return client.put(`/api/v1/knowledge-bases/${kbId}`, data)
}
export function deleteKnowledgeBase(kbId: number): Promise<null> {
  return client.delete(`/api/v1/knowledge-bases/${kbId}`)
}

// ===== 文档管理 =====
export function uploadDocument(kbId: number, file: File): Promise<DocumentRead> {
  const formData = new FormData()
  formData.append('file', file)
  return client.post(`/api/v1/knowledge-bases/${kbId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export function listDocuments(kbId: number, params: { page?: number; page_size?: number; keyword?: string }): Promise<PageResult<DocumentRead>> {
  return client.get(`/api/v1/knowledge-bases/${kbId}/documents`, { params })
}
export function deleteDocument(kbId: number, docId: number): Promise<null> {
  return client.delete(`/api/v1/knowledge-bases/${kbId}/documents/${docId}`)
}

// ===== 分段管理 =====
export function listSegments(kbId: number, params: { page?: number; page_size?: number; keyword?: string }): Promise<PageResult<SegmentRead>> {
  return client.get(`/api/v1/knowledge-bases/${kbId}/segments`, { params })
}
export function updateSegment(kbId: number, segId: number, data: SegmentUpdate): Promise<SegmentRead> {
  return client.put(`/api/v1/knowledge-bases/${kbId}/segments/${segId}`, data)
}
export function deleteSegment(kbId: number, segId: number): Promise<null> {
  return client.delete(`/api/v1/knowledge-bases/${kbId}/segments/${segId}`)
}

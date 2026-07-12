// ============ API Response Wrappers ============

export interface ResponseSchema<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ============ Auth ============

export interface LoginRequest {
  username: string
  password: string
  captcha_key: string
  captcha_code: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

// ============ Captcha ============

export interface CaptchaRead {
  key: string
  image: string
}

export interface CaptchaVerifyRequest {
  key: string
  code: string
}

// ============ User ============

export interface UserRead {
  id: number
  username: string
  email: string
  is_active: boolean
}

export interface UserCreate {
  username: string
  email: string
  password: string
}

export interface UserWithRolesRead extends UserRead {
  roles: RoleRead[]
}

// ============ Role ============

export interface RoleRead {
  id: number
  code: string
  name: string
  description: string | null
  permissions?: PermissionRead[]
}

export interface RoleCreate {
  code: string
  name: string
  description?: string | null
}

export interface RoleUpdate {
  name?: string | null
  description?: string | null
}

export interface RoleAssignPermissions {
  permission_ids: number[]
}

// ============ Permission ============

export interface PermissionRead {
  id: number
  code: string
  name: string
  description: string | null
}

export interface PermissionCreate {
  code: string
  name: string
  description?: string | null
}

export interface PermissionUpdate {
  name?: string | null
  description?: string | null
}

// ============ Provider (模型供应商) ============

export interface ProviderRead {
  id: number
  name: string
  type: string
  status: string  // connected | disconnected | error
  endpoint: string
  description: string | null
  model_count: number
}

export interface ProviderCreate {
  name: string
  type: string
  endpoint: string
  api_key?: string | null
  description?: string | null
}

export interface ProviderUpdate {
  name?: string | null
  type?: string | null
  endpoint?: string | null
  api_key?: string | null
  description?: string | null
}

export interface TestConnectionResult {
  success: boolean
  message: string
  latency_ms?: number
}

// ============ Model (模型管理) ============

export interface ModelRead {
  id: number
  name: string
  model_id: string
  provider_id: number
  provider_name: string
  capabilities: string[]
  context_length: number
  status: string          // available | unavailable | rate_limited
  input_price: number
  output_price: number
  currency: string
  is_default: boolean
  description: string | null
}

export interface ModelCreate {
  name: string
  model_id: string
  provider_id: number
  capabilities?: string[]
  context_length?: number
  input_price?: number
  output_price?: number
  currency?: string
  is_default?: boolean
  description?: string | null
}

export interface ModelUpdate {
  name?: string | null
  capabilities?: string[] | null
  context_length?: number | null
  status?: string | null
  input_price?: number | null
  output_price?: number | null
  currency?: string | null
  is_default?: boolean | null
  description?: string | null
}

// ============ Prompt (Prompt管理) ============

export interface PromptVariableSchema {
  name: string
  type: string           // string | number | boolean | text
  description?: string
  default_value?: string | null
  required?: boolean
}

export interface PromptRead {
  id: number
  name: string
  description: string | null
  category: string
  tags: string[]
  content: string
  variables: PromptVariableSchema[]
  version: string
  status: string          // draft | published
  created_by: string | null
}

export interface PromptCreate {
  name: string
  description?: string | null
  category?: string
  tags?: string[]
  content: string
  variables?: PromptVariableSchema[]
}

export interface PromptUpdate {
  name?: string | null
  description?: string | null
  category?: string | null
  tags?: string[] | null
  content?: string | null
  variables?: PromptVariableSchema[] | null
}

export interface PromptVersionRead {
  id: number
  prompt_id: number
  version: string
  content: string
  changelog: string | null
  is_current: boolean
  published_by: string | null
  published_at: string | null
}

export interface PublishRequest {
  changelog?: string
}

export interface RollbackRequest {
  version_id: number
}

// ============ Knowledge Base (知识库管理) ============

export interface KnowledgeBaseRead {
  id: number
  name: string
  description: string | null
  status: string            // ready | indexing | error | empty
  document_count: number
  segment_count: number
  embedding_model: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface KnowledgeBaseCreate {
  name: string
  description?: string | null
  embedding_model?: string
}

export interface KnowledgeBaseUpdate {
  name?: string | null
  description?: string | null
  embedding_model?: string | null
}

export interface DocumentRead {
  id: number
  knowledge_base_id: number
  file_name: string
  file_type: string        // pdf | docx | md | txt | html | csv
  file_size: string | null
  status: string           // pending | processing | completed | failed
  segment_count: number
  word_count: number
  error_message: string | null
  uploaded_by: string | null
  created_at: string
}

export interface SegmentRead {
  id: number
  knowledge_base_id: number
  document_id: number
  position: number
  content: string
  word_count: number
  token_count: number
  keywords: string[] | null
  hit_count: number
  created_at: string
}

export interface SegmentUpdate {
  content?: string | null
  keywords?: string[] | null
}

// ============ Tool (工具管理) ============

export interface FunctionDefinitionSchema {
  name: string
  description: string
  parameters: Record<string, unknown>    // JSON Schema
}

export interface ToolRead {
  id: number
  name: string
  description: string | null
  type: string              // builtin | http_api | custom_function
  status: string            // enabled | disabled | error
  config: Record<string, unknown> | null
  function_definition: Record<string, unknown> | null
  call_count_7d: number
  success_rate: number
  avg_latency: number
  created_by: string | null
}

export interface ToolCreate {
  name: string
  description?: string | null
  type: string
  config?: Record<string, unknown> | null
  function_definition?: FunctionDefinitionSchema | null
}

export interface ToolUpdate {
  name?: string | null
  description?: string | null
  config?: Record<string, unknown> | null
  function_definition?: FunctionDefinitionSchema | null
}

export interface ToolTestRequest {
  input: Record<string, unknown>
}

export interface ToolTestResponse {
  success: boolean
  output: Record<string, unknown> | null
  error: string | null
  latency_ms: number
}

// ============ Agent (Agent管理) ============

export interface AgentConfigSchema {
  model?: Record<string, unknown> | null
  prompt?: Record<string, unknown> | null
  rag?: Record<string, unknown> | null
  tools?: Record<string, unknown> | null
  advanced?: Record<string, unknown> | null
}

export interface AgentRead {
  id: number
  name: string
  description: string | null
  type: string              // conversation | tool | analysis | creative | workflow
  status: string            // active | inactive | error | draft
  model_id: number | null
  config: Record<string, unknown> | null
  success_rate: number
  call_count_7d: number
  version: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AgentCreate {
  name: string
  description?: string | null
  type: string
  model_id?: number | null
  config?: AgentConfigSchema | null
}

export interface AgentUpdate {
  name?: string | null
  description?: string | null
  type?: string | null
  model_id?: number | null
  config?: AgentConfigSchema | null
}

export interface AgentVersionRead {
  id: number
  agent_id: number
  version: string
  config: Record<string, unknown> | null
  changelog: string | null
  is_current: boolean
  published_by: string | null
  published_at: string | null
}

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Select, Tag, message, Typography, Popconfirm, Descriptions,
  Card, Statistic, Row, Col, Badge,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  ApiOutlined, LinkOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  CloudServerOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listProviders, createProvider, updateProvider, deleteProvider, testProviderConnection } from '../../api/providers'
import type { ProviderRead, ProviderCreate, ProviderUpdate, TestConnectionResult } from '../../types'

const { Title, Text } = Typography
const { Option } = Select

const PROVIDER_TYPES: Record<string, string> = {
  openai: 'OpenAI', anthropic: 'Anthropic', aliyun: '阿里云', azure: 'Azure', local: '本地模型', custom: '自定义',
}

const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  connected: { color: 'success', label: '已连接', icon: <CheckCircleOutlined /> },
  disconnected: { color: 'default', label: '未连接', icon: <CloseCircleOutlined /> },
  error: { color: 'error', label: '连接失败', icon: <WarningOutlined /> },
}

export default function ProviderListPage() {
  const [providers, setProviders] = useState<ProviderRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ProviderRead | null>(null)
  const [providerForm] = Form.useForm()

  const [testLoading, setTestLoading] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null)
  const [testResultOpen, setTestResultOpen] = useState(false)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listProviders({ page, page_size: pageSize, keyword: keyword || undefined })
      setProviders(result.items)
      setTotal(result.total)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  const connectedCount = useMemo(() => providers.filter((p) => p.status === 'connected').length, [providers])
  const errorCount = useMemo(() => providers.filter((p) => p.status === 'error').length, [providers])
  const totalModels = useMemo(() => providers.reduce((s, p) => s + (p.model_count || 0), 0), [providers])

  const openCreate = () => { setEditingProvider(null); providerForm.resetFields(); setFormOpen(true) }
  const openEdit = (p: ProviderRead) => {
    setEditingProvider(p)
    providerForm.setFieldsValue({ name: p.name, type: p.type, endpoint: p.endpoint, api_key: '', description: p.description })
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await providerForm.validateFields(); setFormLoading(true)
      const payload: ProviderCreate | ProviderUpdate = { ...values, api_key: values.api_key || undefined }
      if (editingProvider && !values.api_key) delete payload.api_key
      if (editingProvider) { await updateProvider(editingProvider.id, payload as ProviderUpdate); message.success('供应商更新成功') }
      else { await createProvider(payload as ProviderCreate); message.success('供应商创建成功') }
      setFormOpen(false); providerForm.resetFields(); fetchProviders()
    } catch (err: unknown) { if (err && typeof err === 'object' && 'errorFields' in err) return } finally { setFormLoading(false) }
  }

  const handleDelete = async (p: ProviderRead) => {
    try { await deleteProvider(p.id); message.success('供应商已删除'); fetchProviders() } catch { /* handled */ }
  }

  const handleTest = async (p: ProviderRead) => {
    setTestLoading(p.id)
    try { const r = await testProviderConnection(p.id); setTestResult(r); setTestResultOpen(true); fetchProviders() }
    catch { /* handled */ } finally { setTestLoading(null) }
  }

  const columns: ColumnsType<ProviderRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 65, render: (v: number) => <Text type="secondary">#{v}</Text> },
    { title: '名称', dataIndex: 'name', key: 'name', width: 150, render: (v: string) => <Text strong>{v}</Text> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (v: string) => <Tag>{PROVIDER_TYPES[v] || v}</Tag> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => {
        const s = STATUS_MAP[v] || { color: 'default', label: v, icon: null }
        return <Tag color={s.color} icon={s.icon}>{s.label}</Tag>
      },
    },
    {
      title: 'API 端点', dataIndex: 'endpoint', key: 'endpoint', ellipsis: true,
      render: (v: string) => <Text copyable style={{ fontSize: 12 }}>{v}</Text>,
    },
    { title: '模型数', dataIndex: 'model_count', key: 'model_count', width: 80, align: 'center',
      render: (v: number) => <Tag color={v > 0 ? 'blue' : 'default'}>{v}</Tag>,
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 140,
      render: (v: string | null) => v || <Text type="secondary">—</Text>,
    },
    {
      title: '操作', key: 'actions', width: 250, fixed: 'right',
      render: (_: unknown, r: ProviderRead) => (
        <Space>
          <Button icon={<LinkOutlined />} size="small" loading={testLoading === r.id} onClick={() => handleTest(r)}>测试</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除此供应商？" onConfirm={() => handleDelete(r)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* ===== 页面头部 ===== */}
      <div style={{ background: 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><ApiOutlined style={{ marginRight: 8 }} />模型供应商</Title>
            <Text type="secondary">管理大模型 API 供应商，测试连接状态，为模型管理提供供应商基础数据</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>创建供应商</Button>
        </div>
      </div>

      {/* ===== 统计卡片 ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="供应商总数" value={total} prefix={<CloudServerOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="已连接" value={connectedCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }}
              suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {total}</Text>} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="连接异常" value={errorCount} prefix={<WarningOutlined />} valueStyle={{ color: errorCount > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="关联模型" value={totalModels} prefix={<ApiOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* ===== 搜索 + 表格卡片 ===== */}
      <Card title={<Space><SearchOutlined />筛选查询</Space>} extra={<Button icon={<ReloadOutlined />} onClick={fetchProviders}>刷新</Button>}>
        <Input.Search placeholder="搜索供应商名称或类型..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ maxWidth: 360, marginBottom: 16 }} enterButton />
        <Table columns={columns} dataSource={providers} rowKey="id" loading={loading} scroll={{ x: 1100 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 个供应商`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* ===== CRUD Modal ===== */}
      <Modal title={editingProvider ? '编辑供应商' : '创建供应商'} open={formOpen} onOk={handleFormSubmit}
        onCancel={() => { setFormOpen(false); providerForm.resetFields() }} confirmLoading={formLoading} destroyOnClose width={560}>
        <Form form={providerForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}><Input placeholder="如 OpenAI、阿里云" /></Form.Item>
          <Form.Item name="type" label="供应商类型" rules={[{ required: true }]}>
            <Select placeholder="请选择类型">{Object.entries(PROVIDER_TYPES).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}</Select>
          </Form.Item>
          <Form.Item name="endpoint" label="API 端点" rules={[{ required: true }, { type: 'url' }]}>
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item name="api_key" label="API 密钥" extra={editingProvider ? '留空则不修改已有密钥' : ''}>
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} placeholder="供应商描述（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* ===== Test Result Modal ===== */}
      <Modal title={<Space><LinkOutlined />连接测试结果</Space>} open={testResultOpen}
        onCancel={() => setTestResultOpen(false)} footer={<Button onClick={() => setTestResultOpen(false)}>关闭</Button>} width={480}>
        {testResult && (
          <Descriptions column={1} style={{ marginTop: 16 }} bordered size="small">
            <Descriptions.Item label="结果">
              <Tag color={testResult.success ? 'success' : 'error'} icon={testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                {testResult.success ? '连接成功' : '连接失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="详情">{testResult.message}</Descriptions.Item>
            {testResult.latency_ms !== undefined && <Descriptions.Item label="延迟">{testResult.latency_ms} ms</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

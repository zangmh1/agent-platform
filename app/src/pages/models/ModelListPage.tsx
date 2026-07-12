import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Select, Tag, message, Typography, Popconfirm,
  InputNumber, Checkbox, Row, Col, Switch, Card, Statistic, Tooltip,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, StarFilled,
  BlockOutlined, ThunderboltOutlined, DollarOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listModels, createModel, updateModel, deleteModel } from '../../api/models'
import { listProviders } from '../../api/providers'
import type { ModelRead, ModelCreate, ModelUpdate, ProviderRead } from '../../types'

const { Title, Text } = Typography
const { Option } = Select

const CAPABILITIES_OPTIONS = [
  { value: 'function_call', label: 'Function Call', color: 'blue' },
  { value: 'vision', label: 'Vision', color: 'purple' },
  { value: 'streaming', label: 'Streaming', color: 'cyan' },
]
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  available: { color: 'success', label: '可用', icon: <CheckCircleOutlined /> },
  unavailable: { color: 'default', label: '不可用', icon: <StopOutlined /> },
  rate_limited: { color: 'warning', label: '限速', icon: <ThunderboltOutlined /> },
}

export default function ModelListPage() {
  const [models, setModels] = useState<ModelRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [providerFilter, setProviderFilter] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<ProviderRead[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelRead | null>(null)
  const [modelForm] = Form.useForm()

  const fetchModels = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize }
      if (keyword) params.keyword = keyword
      if (providerFilter) params.provider_id = providerFilter
      const result = await listModels(params as Parameters<typeof listModels>[0])
      setModels(result.items); setTotal(result.total)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [page, pageSize, keyword, providerFilter])

  const fetchProviders = useCallback(async () => {
    try { const r = await listProviders({ page: 1, page_size: 100 }); setProviders(r.items) } catch { /* handled */ }
  }, [])

  useEffect(() => { fetchModels() }, [fetchModels])
  useEffect(() => { fetchProviders() }, [fetchProviders])

  const defaultModel = useMemo(() => models.find((m) => m.is_default), [models])
  const availableCount = useMemo(() => models.filter((m) => m.status === 'available').length, [models])
  const totalCapabilities = useMemo(() => [...new Set(models.flatMap((m) => m.capabilities))], [models])

  const openCreate = () => { setEditingModel(null); modelForm.resetFields(); setFormOpen(true) }
  const openEdit = (m: ModelRead) => {
    setEditingModel(m)
    modelForm.setFieldsValue({ ...m, capabilities: m.capabilities })
    setFormOpen(true)
  }
  const handleFormSubmit = async () => {
    try {
      const values = await modelForm.validateFields(); setFormLoading(true)
      if (editingModel) { await updateModel(editingModel.id, values as ModelUpdate); message.success('模型更新成功') }
      else { await createModel(values as ModelCreate); message.success('模型添加成功') }
      setFormOpen(false); modelForm.resetFields(); fetchModels()
    } catch (err: unknown) { if (err && typeof err === 'object' && 'errorFields' in err) return } finally { setFormLoading(false) }
  }
  const handleDelete = async (m: ModelRead) => {
    try { await deleteModel(m.id); message.success('模型已删除'); fetchModels() } catch { /* handled */ }
  }

  const columns: ColumnsType<ModelRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60, render: (v: number) => <Text type="secondary">#{v}</Text> },
    {
      title: '名称', dataIndex: 'name', key: 'name', width: 150,
      render: (v: string, r: ModelRead) => (
        <Space>{r.is_default && <StarFilled style={{ color: '#faad14' }} />}<Text strong>{v}</Text></Space>
      ),
    },
    { title: '模型标识', dataIndex: 'model_id', key: 'model_id', width: 130, render: (v: string) => <Tag color="blue" style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: '供应商', dataIndex: 'provider_name', key: 'provider_name', width: 100, render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => { const s = STATUS_MAP[v] || { color: 'default', label: v, icon: null }; return <Tag color={s.color} icon={s.icon}>{s.label}</Tag> },
    },
    {
      title: '能力', dataIndex: 'capabilities', key: 'capabilities', width: 170,
      render: (caps: string[]) => (
        <Space size={4} wrap>{caps.length === 0 && <Text type="secondary">—</Text>}
          {caps.map((c) => <Tag key={c} color="geekblue" style={{ fontSize: 11 }}>{c}</Tag>)}
        </Space>
      ),
    },
    { title: '上下文', dataIndex: 'context_length', key: 'context_length', width: 80, render: (v: number) => v.toLocaleString() },
    {
      title: '价格', key: 'pricing', width: 160,
      render: (_: unknown, r: ModelRead) => (
        <Tooltip title={`输入: $${r.input_price} / 输出: $${r.output_price} per 1K tokens (${r.currency})`}>
          <Space size={4}>
            <Tag color="green" style={{ fontSize: 11 }}>${r.input_price}</Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>/</Text>
            <Tag color="orange" style={{ fontSize: 11 }}>${r.output_price}</Tag>
          </Space>
        </Tooltip>
      ),
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 140, render: (v: string | null) => v || <Text type="secondary">—</Text> },
    {
      title: '操作', key: 'actions', width: 170, fixed: 'right',
      render: (_: unknown, r: ModelRead) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除此模型？" onConfirm={() => handleDelete(r)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* ===== 页面头部 ===== */}
      <div style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><BlockOutlined style={{ marginRight: 8 }} />模型管理</Title>
            <Text type="secondary">管理已接入的大语言模型，配置能力、价格、上下文长度等参数</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>添加模型</Button>
        </div>
      </div>

      {/* ===== 统计卡片 ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="模型总数" value={total} prefix={<BlockOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="可用模型" value={availableCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {total}</Text>} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="默认模型" value={defaultModel?.name || '未设置'} prefix={<StarFilled style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: defaultModel ? 18 : 14 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="能力标签" value={totalCapabilities.length} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* ===== 搜索 + 表格卡片 ===== */}
      <Card title={<Space><SearchOutlined />筛选查询</Space>}
        extra={<Button icon={<ReloadOutlined />} onClick={fetchModels}>刷新</Button>}>
        <Space wrap style={{ marginBottom: 16, width: '100%' }}>
          <Select placeholder="按供应商筛选" allowClear style={{ width: 180 }} value={providerFilter}
            onChange={(v) => { setProviderFilter(v); setPage(1) }}>
            {providers.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
          </Select>
          <Input.Search placeholder="搜索名称或标识..." value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ width: 280 }} enterButton />
        </Space>
        <Table columns={columns} dataSource={models} rowKey="id" loading={loading} scroll={{ x: 1250 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 个模型`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* ===== Create/Edit Modal ===== */}
      <Modal title={editingModel ? '编辑模型' : '添加模型'} open={formOpen} onOk={handleFormSubmit}
        onCancel={() => { setFormOpen(false); modelForm.resetFields() }} confirmLoading={formLoading} destroyOnClose width={640}>
        <Form form={modelForm} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ capabilities: [], context_length: 4096, currency: 'USD', is_default: false }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="模型名称" rules={[{ required: true }]}><Input placeholder="如 GPT-4o" /></Form.Item></Col>
            <Col span={12}><Form.Item name="model_id" label="模型标识" rules={[{ required: true }]}><Input placeholder="gpt-4o" disabled={!!editingModel} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="provider_id" label="供应商" rules={[{ required: true }]}>
                <Select placeholder="请选择供应商" disabled={!!editingModel}>
                  {providers.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="context_length" label="上下文长度"><InputNumber min={512} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          {editingModel && (
            <Form.Item name="status" label="状态">
              <Select>{Object.entries(STATUS_MAP).map(([v, { label }]) => <Option key={v} value={v}>{label}</Option>)}</Select>
            </Form.Item>
          )}
          <Form.Item name="capabilities" label="能力标签">
            <Checkbox.Group options={CAPABILITIES_OPTIONS} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="input_price" label="输入价格 /1K tokens"><InputNumber min={0} step={0.001} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="output_price" label="输出价格 /1K tokens"><InputNumber min={0} step={0.001} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="currency" label="货币"><Select><Option value="USD">USD</Option><Option value="CNY">CNY</Option><Option value="EUR">EUR</Option></Select></Form.Item></Col>
          </Row>
          <Form.Item name="is_default" label="默认模型" valuePropName="checked"><Switch checkedChildren="是" unCheckedChildren="否" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} placeholder="模型描述（可选）" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

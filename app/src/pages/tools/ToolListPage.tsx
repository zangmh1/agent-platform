import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Select, Tag, message, Typography, Popconfirm,
  Card, Statistic, Row, Col, Descriptions, Tooltip, Switch,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  ToolOutlined, PlayCircleOutlined, PauseCircleOutlined, ApiOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ThunderboltOutlined, CodeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listTools, createTool, updateTool, deleteTool, enableTool, disableTool, testTool } from '../../api/tools'
import type { ToolRead, ToolCreate, ToolUpdate, ToolTestResponse } from '../../types'

const { Title, Text } = Typography; const { Option } = Select

const TOOL_TYPES: Record<string, string> = { builtin: '内置工具', http_api: 'HTTP API', custom_function: '自定义函数' }
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  enabled: { color: 'success', label: '已启用', icon: <CheckCircleOutlined /> },
  disabled: { color: 'default', label: '已禁用', icon: <CloseCircleOutlined /> },
  error: { color: 'error', label: '异常', icon: <CloseCircleOutlined /> },
}

export default function ToolListPage() {
  const [tools, setTools] = useState<ToolRead[]>([])
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState(''); const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false); const [formLoading, setFormLoading] = useState(false)
  const [editingTool, setEditingTool] = useState<ToolRead | null>(null); const [toolForm] = Form.useForm()

  const [testOpen, setTestOpen] = useState(false); const [testLoading, setTestLoading] = useState(false)
  const [testingTool, setTestingTool] = useState<ToolRead | null>(null)
  const [testResult, setTestResult] = useState<ToolTestResponse | null>(null)
  const [testForm] = Form.useForm()

  const fetchTools = useCallback(async () => {
    setLoading(true)
    try { const r = await listTools({ page, page_size: pageSize, keyword: keyword || undefined }); setTools(r.items); setTotal(r.total) } catch { /* */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])
  useEffect(() => { fetchTools() }, [fetchTools])

  const enabledCount = useMemo(() => tools.filter((t) => t.status === 'enabled').length, [tools])
  const totalCalls = useMemo(() => tools.reduce((s, t) => s + t.call_count_7d, 0), [tools])
  const avgSuccess = useMemo(() => tools.length > 0 ? (tools.reduce((s, t) => s + t.success_rate, 0) / tools.length).toFixed(1) : 0, [tools])

  const openCreate = () => { setEditingTool(null); toolForm.resetFields(); setFormOpen(true) }
  const openEdit = (t: ToolRead) => {
    setEditingTool(t)
    const fdStr = t.function_definition ? JSON.stringify(t.function_definition, null, 2) : ''
    const cfgStr = t.config ? JSON.stringify(t.config, null, 2) : ''
    toolForm.setFieldsValue({ ...t, function_definition_str: fdStr, config_str: cfgStr })
    setFormOpen(true)
  }
  const handleFormSubmit = async () => {
    try { const v = await toolForm.validateFields(); setFormLoading(true)
      let fd = null; let cfg = null
      try { if (v.function_definition_str) fd = JSON.parse(v.function_definition_str) } catch { message.error('Function Definition JSON 格式错误'); setFormLoading(false); return }
      try { if (v.config_str) cfg = JSON.parse(v.config_str) } catch { message.error('配置 JSON 格式错误'); setFormLoading(false); return }
      const payload: ToolCreate | ToolUpdate = { name: v.name, description: v.description, type: v.type, config: cfg, function_definition: fd }
      if (editingTool) { await updateTool(editingTool.id, payload); message.success('工具更新成功') }
      else { await createTool(payload as ToolCreate); message.success('工具创建成功') }
      setFormOpen(false); toolForm.resetFields(); fetchTools()
    } catch (e: unknown) { if (e && typeof e === 'object' && 'errorFields' in e) return } finally { setFormLoading(false) }
  }
  const handleDelete = async (t: ToolRead) => { try { await deleteTool(t.id); message.success('已删除'); fetchTools() } catch { /* */ } }
  const handleToggle = async (t: ToolRead) => {
    try {
      if (t.status === 'enabled') { await disableTool(t.id); message.success('已禁用') } else { await enableTool(t.id); message.success('已启用') }
      fetchTools()
    } catch { /* */ }
  }

  const openTest = (t: ToolRead) => { setTestingTool(t); testForm.resetFields(); setTestResult(null); setTestOpen(true) }
  const handleTest = async () => {
    if (!testingTool) return
    try { const v = await testForm.validateFields(); setTestLoading(true)
      let input: Record<string, unknown> = {}
      try { input = JSON.parse(v.input_json) } catch { message.error('测试参数 JSON 格式错误'); setTestLoading(false); return }
      const r = await testTool(testingTool.id, { input }); setTestResult(r)
    } catch (e: unknown) { if (e && typeof e === 'object' && 'errorFields' in e) return } finally { setTestLoading(false) }
  }

  const columns: ColumnsType<ToolRead> = [
    { title: 'ID', dataIndex: 'id', width: 60, render: (v: number) => <Text type="secondary">#{v}</Text> },
    { title: '名称', dataIndex: 'name', width: 160, render: (v: string) => <Text strong>{v}</Text> },
    { title: '类型', dataIndex: 'type', width: 110, render: (v: string) => <Tag color="blue">{TOOL_TYPES[v] || v}</Tag> },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string) => { const s = STATUS_MAP[v] || { color: 'default', label: v, icon: null }; return <Tag color={s.color} icon={s.icon}>{s.label}</Tag> },
    },
    {
      title: '启用', key: 'toggle', width: 70,
      render: (_: unknown, r: ToolRead) => <Switch size="small" checked={r.status === 'enabled'} onChange={() => handleToggle(r)} loading={loading} />,
    },
    {
      title: '7天调用', dataIndex: 'call_count_7d', width: 90,
      render: (v: number) => <Text style={{ fontFamily: 'monospace' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '成功率', dataIndex: 'success_rate', width: 80,
      render: (v: number) => <Text style={{ color: v >= 95 ? '#52c41a' : v >= 80 ? '#faad14' : '#ff4d4f' }}>{v}%</Text>,
    },
    { title: '延迟', dataIndex: 'avg_latency', width: 80, render: (v: number) => <span>{v}ms</span> },
    { title: '描述', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v || <Text type="secondary">—</Text> },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_: unknown, r: ToolRead) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Button icon={<PlayCircleOutlined />} size="small" onClick={() => openTest(r)}>测试</Button>
          <Popconfirm title="确定删除此工具？" onConfirm={() => handleDelete(r)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><ToolOutlined style={{ marginRight: 8 }} />工具管理</Title>
            <Text type="secondary">注册和管理 Agent 可调用的工具，支持 OpenAI Function Calling 格式定义</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>注册工具</Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="工具总数" value={total} prefix={<ToolOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="已启用" value={enabledCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {total}</Text>} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="7天调用" value={totalCalls} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="平均成功率" value={avgSuccess} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#722ed1' }} suffix="%" /></Card></Col>
      </Row>

      {/* Table */}
      <Card title={<Space><SearchOutlined />工具列表</Space>} extra={<Button icon={<ReloadOutlined />} onClick={fetchTools}>刷新</Button>}>
        <Input.Search placeholder="搜索工具名称或描述..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ maxWidth: 360, marginBottom: 16 }} enterButton />
        <Table columns={columns} dataSource={tools} rowKey="id" loading={loading} scroll={{ x: 1150 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 个工具`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal title={editingTool ? '编辑工具' : '注册工具'} open={formOpen} onOk={handleFormSubmit}
        onCancel={() => { setFormOpen(false); toolForm.resetFields() }} confirmLoading={formLoading} destroyOnClose width={700}>
        <Form form={toolForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={14}><Form.Item name="name" label="工具名称" rules={[{ required: true }]}><Input placeholder="如 web_search" /></Form.Item></Col>
            <Col span={10}><Form.Item name="type" label="工具类型" rules={[{ required: true }]}>
              <Select>{Object.entries(TOOL_TYPES).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}</Select>
            </Form.Item></Col>
          </Row>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} placeholder="工具描述（可选）" /></Form.Item>
          <Form.Item name="function_definition_str" label={<span><CodeOutlined /> Function Calling 定义 <Text type="secondary">(JSON)</Text></span>}
            extra="OpenAI Function Calling 格式的 JSON Schema">
            <Input.TextArea rows={8} placeholder='{"name": "search", "description": "...", "parameters": {"type": "object", "properties": {...}}}' style={{ fontFamily: 'monospace', fontSize: 12 }} />
          </Form.Item>
          <Form.Item name="config_str" label={<span><ApiOutlined /> 工具配置 <Text type="secondary">(JSON)</Text></span>}
            extra="工具类型相关的配置，如 HTTP API 的 URL、Headers 等">
            <Input.TextArea rows={4} placeholder='{"url": "https://...", "method": "POST", "headers": {...}}' style={{ fontFamily: 'monospace', fontSize: 12 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Test Modal */}
      <Modal title={<Space><PlayCircleOutlined />测试工具 {testingTool && `— ${testingTool.name}`}</Space>} open={testOpen}
        onOk={handleTest} onCancel={() => setTestOpen(false)} confirmLoading={testLoading} destroyOnClose width={560}>
        <Form form={testForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="input_json" label="测试输入参数 (JSON)" rules={[{ required: true }]}
            extra="输入 JSON 格式的测试参数">
            <Input.TextArea rows={6} placeholder='{"query": "Hello World"}' style={{ fontFamily: 'monospace', fontSize: 12 }} />
          </Form.Item>
        </Form>
        {testResult && (
          <Descriptions column={1} size="small" bordered style={{ marginTop: 16 }}>
            <Descriptions.Item label="结果">
              <Tag color={testResult.success ? 'success' : 'error'} icon={testResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                {testResult.success ? '执行成功' : '执行失败'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="延迟">{testResult.latency_ms} ms</Descriptions.Item>
            {testResult.success && testResult.output && (
              <Descriptions.Item label="输出">
                <pre style={{ fontFamily: 'monospace', fontSize: 11, maxHeight: 200, overflow: 'auto', margin: 0 }}>
                  {JSON.stringify(testResult.output, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {testResult.error && <Descriptions.Item label="错误信息"><Text type="danger">{testResult.error}</Text></Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

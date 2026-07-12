import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Select, Tag, message, Typography, Popconfirm,
  Card, Statistic, Row, Col, Descriptions, Tabs, Empty, Divider, Tooltip,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  RobotOutlined, PlayCircleOutlined, PauseCircleOutlined, SendOutlined,
  HistoryOutlined, RollbackOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, ApiOutlined, FileTextOutlined, SettingOutlined,
  SafetyCertificateOutlined, ThunderboltOutlined, EyeOutlined, ToolOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listAgents, createAgent, updateAgent, deleteAgent, startAgent, stopAgent,
  publishAgent, getAgentVersions, rollbackAgent } from '../../api/agents'
import { listModels } from '../../api/models'
import type { AgentRead, AgentCreate, AgentUpdate, AgentVersionRead, ModelRead } from '../../types'

const { Title, Text, Paragraph } = Typography; const { Option } = Select

const AGENT_TYPES: Record<string, string> = {
  conversation: '对话型', tool: '工具型', analysis: '分析型', creative: '创作型', workflow: '工作流',
}
const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  active: { color: 'success', label: '运行中', icon: <PlayCircleOutlined /> },
  inactive: { color: 'default', label: '已停止', icon: <PauseCircleOutlined /> },
  error: { color: 'error', label: '异常', icon: <ExclamationCircleOutlined /> },
  draft: { color: 'warning', label: '草稿', icon: <ClockCircleOutlined /> },
}

export default function AgentListPage() {
  const [agents, setAgents] = useState<AgentRead[]>([])
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState(''); const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<ModelRead[]>([])

  // Agent form
  const [formOpen, setFormOpen] = useState(false); const [formLoading, setFormLoading] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentRead | null>(null)
  const [agentForm] = Form.useForm(); const [configTab, setConfigTab] = useState('model')

  // Publish modal
  const [publishOpen, setPublishOpen] = useState(false); const [publishLoading, setPublishLoading] = useState(false)
  const [publishingAgent, setPublishingAgent] = useState<AgentRead | null>(null); const [publishForm] = Form.useForm()

  // Version / Rollback
  const [versionsOpen, setVersionsOpen] = useState(false); const [versions, setVersions] = useState<AgentVersionRead[]>([])
  const [versionsAgentId, setVersionsAgentId] = useState<number | null>(null)

  // View config
  const [configOpen, setConfigOpen] = useState(false); const [viewingAgent, setViewingAgent] = useState<AgentRead | null>(null)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try { const r = await listAgents({ page, page_size: pageSize, keyword: keyword || undefined }); setAgents(r.items); setTotal(r.total) } catch { /* */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])
  useEffect(() => { fetchAgents() }, [fetchAgents])
  useEffect(() => { listModels({ page: 1, page_size: 100 }).then((r) => setModels(r.items)).catch(() => {}) }, [])

  const activeCount = useMemo(() => agents.filter((a) => a.status === 'active').length, [agents])
  const totalCalls = useMemo(() => agents.reduce((s, a) => s + a.call_count_7d, 0), [agents])
  const avgSuccess = useMemo(() => agents.length > 0 ? (agents.reduce((s, a) => s + a.success_rate, 0) / agents.length).toFixed(1) : 0, [agents])

  // CRUD
  const openCreate = () => { setEditingAgent(null); agentForm.resetFields(); setConfigTab('model'); setFormOpen(true) }
  const openEdit = (a: AgentRead) => {
    setEditingAgent(a)
    agentForm.setFieldsValue({ name: a.name, description: a.description, type: a.type, model_id: a.model_id,
      model_cfg: a.config?.model ? JSON.stringify(a.config.model, null, 2) : '',
      prompt_cfg: a.config?.prompt ? JSON.stringify(a.config.prompt, null, 2) : '',
      rag_cfg: a.config?.rag ? JSON.stringify(a.config.rag, null, 2) : '',
      tools_cfg: a.config?.tools ? JSON.stringify(a.config.tools, null, 2) : '',
      advanced_cfg: a.config?.advanced ? JSON.stringify(a.config.advanced, null, 2) : '',
    })
    setConfigTab('model'); setFormOpen(true)
  }
  const handleFormSubmit = async () => {
    try { const v = await agentForm.validateFields(); setFormLoading(true)
      const config: Record<string, unknown> = {}
      for (const key of ['model', 'prompt', 'rag', 'tools', 'advanced']) {
        if (v[`${key}_cfg`]) { try { config[key] = JSON.parse(v[`${key}_cfg`]) } catch { message.error(`${key} 配置 JSON 格式错误`); setFormLoading(false); return } }
      }
      const payload: AgentCreate | AgentUpdate = { name: v.name, description: v.description, type: v.type, model_id: v.model_id, config: Object.keys(config).length > 0 ? config : null }
      if (editingAgent) { await updateAgent(editingAgent.id, payload as AgentUpdate); message.success('更新成功') }
      else { await createAgent(payload as AgentCreate); message.success('创建成功') }
      setFormOpen(false); agentForm.resetFields(); fetchAgents()
    } catch (e: unknown) { if (e && typeof e === 'object' && 'errorFields' in e) return } finally { setFormLoading(false) }
  }
  const handleDelete = async (a: AgentRead) => { try { await deleteAgent(a.id); message.success('已删除'); fetchAgents() } catch { /* */ } }

  // Lifecycle
  const handleStart = async (a: AgentRead) => { try { await startAgent(a.id); message.success(`"${a.name}" 已启动`); fetchAgents() } catch { /* */ } }
  const handleStop = async (a: AgentRead) => { try { await stopAgent(a.id); message.success(`"${a.name}" 已停止`); fetchAgents() } catch { /* */ } }

  // Publish
  const openPublish = (a: AgentRead) => { setPublishingAgent(a); publishForm.resetFields(); setPublishOpen(true) }
  const handlePublish = async () => {
    if (!publishingAgent) return
    try { const v = await publishForm.validateFields(); setPublishLoading(true)
      await publishAgent(publishingAgent.id, { changelog: v.changelog }); message.success('发布成功'); setPublishOpen(false); fetchAgents()
    } catch (e: unknown) { if (e && typeof e === 'object' && 'errorFields' in e) return } finally { setPublishLoading(false) }
  }

  // Versions
  const openVersions = async (a: AgentRead) => { setVersionsAgentId(a.id); try { setVersions(await getAgentVersions(a.id)) } catch { /* */ }; setVersionsOpen(true) }
  const handleRollback = async (v: AgentVersionRead) => {
    if (!versionsAgentId) return
    try { await rollbackAgent(versionsAgentId, { version_id: v.id }); message.success(`已回滚到 ${v.version}`); setVersionsOpen(false); fetchAgents() } catch { /* */ }
  }

  const columns: ColumnsType<AgentRead> = [
    { title: 'ID', dataIndex: 'id', width: 60, render: (v: number) => <Text type="secondary">#{v}</Text> },
    { title: '名称', dataIndex: 'name', width: 170, render: (v: string) => <Text strong>{v}</Text> },
    { title: '类型', dataIndex: 'type', width: 100, render: (v: string) => <Tag color="blue">{AGENT_TYPES[v] || v}</Tag> },
    { title: '状态', dataIndex: 'status', width: 100, render: (v: string) => { const s = STATUS_MAP[v] || { color: 'default', label: v, icon: null }; return <Tag color={s.color} icon={s.icon}>{s.label}</Tag> } },
    { title: '模型', dataIndex: 'model_id', width: 60, render: (v: number | null) => v ? <Tag color="purple">#{v}</Tag> : <Text type="secondary">—</Text> },
    {
      title: '成功率', dataIndex: 'success_rate', width: 80,
      render: (v: number) => <Text style={{ color: v >= 95 ? '#52c41a' : v >= 80 ? '#faad14' : '#ff4d4f' }}>{v}%</Text>,
    },
    { title: '7天调用', dataIndex: 'call_count_7d', width: 80, render: (v: number) => v.toLocaleString() },
    { title: '版本', dataIndex: 'version', width: 70, render: (v: string) => <Tag color="geekblue">{v}</Tag> },
    { title: '创建者', dataIndex: 'created_by', width: 80, render: (v: string | null) => v || '—' },
    {
      title: '操作', width: 340, fixed: 'right',
      render: (_: unknown, a: AgentRead) => (
        <Space wrap size={4}>
          {a.status === 'active' ? (
            <Button icon={<PauseCircleOutlined />} size="small" onClick={() => handleStop(a)}>停止</Button>
          ) : (
            <Button icon={<PlayCircleOutlined />} size="small" type="primary" ghost onClick={() => handleStart(a)}
              disabled={a.status === 'draft'}>启动</Button>
          )}
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(a)}>编辑</Button>
          <Button icon={<SendOutlined />} size="small" onClick={() => openPublish(a)}>发布</Button>
          <Button icon={<HistoryOutlined />} size="small" onClick={() => openVersions(a)}>版本</Button>
          <Button icon={<EyeOutlined />} size="small" onClick={() => { setViewingAgent(a); setConfigOpen(true) }}>配置</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(a)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><RobotOutlined style={{ marginRight: 8 }} />Agent 管理</Title>
            <Text type="secondary">管理智能体 Agent 的全生命周期：创建、配置、发布、启停与版本回滚</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>创建 Agent</Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Agent 总数" value={total} prefix={<RobotOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="运行中" value={activeCount} prefix={<PlayCircleOutlined />} valueStyle={{ color: '#52c41a' }} suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {total}</Text>} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="7天调用" value={totalCalls} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="平均成功率" value={avgSuccess} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#722ed1' }} suffix="%" /></Card></Col>
      </Row>

      {/* Table */}
      <Card title={<Space><SearchOutlined />Agent 列表</Space>} extra={<Button icon={<ReloadOutlined />} onClick={fetchAgents}>刷新</Button>}>
        <Input.Search placeholder="搜索名称或描述..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ maxWidth: 360, marginBottom: 16 }} enterButton />
        <Table columns={columns} dataSource={agents} rowKey="id" loading={loading} scroll={{ x: 1300 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 个 Agent`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* Create/Edit Modal with Config Tabs */}
      <Modal title={editingAgent ? '编辑 Agent' : '创建 Agent'} open={formOpen} onOk={handleFormSubmit}
        onCancel={() => { setFormOpen(false); agentForm.resetFields() }} confirmLoading={formLoading} destroyOnClose width={760}>
        <Form form={agentForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}><Form.Item name="name" label="Agent 名称" rules={[{ required: true }]}><Input placeholder="如 客服助手" /></Form.Item></Col>
            <Col span={8}><Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select>{Object.entries(AGENT_TYPES).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}</Select>
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="model_id" label="关联模型">
                <Select allowClear placeholder="选择模型（可选）">
                  {models.map((m) => <Option key={m.id} value={m.id}>{m.name} ({m.model_id})</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} placeholder="描述（可选）" /></Form.Item>

          <Divider style={{ margin: '12px 0' }} />
          <Text strong style={{ display: 'block', marginBottom: 12 }}><SettingOutlined /> Agent 配置 <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>每项配置为 JSON 格式</Text></Text>

          <Tabs activeKey={configTab} onChange={setConfigTab} size="small"
            items={[
              { key: 'model', label: <span><ApiOutlined /> 模型</span>, children: <Form.Item name="model_cfg"><Input.TextArea rows={4} placeholder='{"modelId": 1, "temperature": 0.7, "maxTokens": 2048, "topP": 0.9}' style={{ fontFamily: 'monospace', fontSize: 12 }} /></Form.Item> },
              { key: 'prompt', label: <span><FileTextOutlined /> 提示词</span>, children: <Form.Item name="prompt_cfg"><Input.TextArea rows={4} placeholder='{"systemPrompt": "You are...", "promptTemplateId": 1}' style={{ fontFamily: 'monospace', fontSize: 12 }} /></Form.Item> },
              { key: 'rag', label: <span><SettingOutlined /> RAG</span>, children: <Form.Item name="rag_cfg"><Input.TextArea rows={4} placeholder='{"enabled": true, "knowledgeBaseIds": [1, 2]}' style={{ fontFamily: 'monospace', fontSize: 12 }} /></Form.Item> },
              { key: 'tools', label: <span><ToolOutlined /> 工具</span>, children: <Form.Item name="tools_cfg"><Input.TextArea rows={4} placeholder='{"enabled": true, "toolIds": [1]}' style={{ fontFamily: 'monospace', fontSize: 12 }} /></Form.Item> },
              { key: 'advanced', label: <span><SafetyCertificateOutlined /> 高级</span>, children: <Form.Item name="advanced_cfg"><Input.TextArea rows={4} placeholder='{"welcomeMessage": "Hello!", "suggestedQuestions": [...]}' style={{ fontFamily: 'monospace', fontSize: 12 }} /></Form.Item> },
            ]}
          />
        </Form>
      </Modal>

      {/* Publish Modal */}
      <Modal title={<Space><SendOutlined />发布 Agent {publishingAgent && `— ${publishingAgent.name}`}</Space>} open={publishOpen}
        onOk={handlePublish} onCancel={() => setPublishOpen(false)} confirmLoading={publishLoading} destroyOnClose width={480}>
        <Form form={publishForm} layout="vertical" style={{ marginTop: 16 }}>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="当前版本"><Tag color="geekblue">{publishingAgent?.version}</Tag></Descriptions.Item>
            <Descriptions.Item label="状态">{publishingAgent?.status && STATUS_MAP[publishingAgent.status] ? <Tag color={STATUS_MAP[publishingAgent.status].color}>{STATUS_MAP[publishingAgent.status].label}</Tag> : publishingAgent?.status}</Descriptions.Item>
          </Descriptions>
          <Form.Item name="changelog" label="变更说明"><Input.TextArea rows={3} placeholder="描述本次变更内容（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* Versions Modal */}
      <Modal title={<Space><HistoryOutlined />版本历史</Space>} open={versionsOpen} onCancel={() => setVersionsOpen(false)}
        footer={null} width={820} destroyOnClose>
        <Table dataSource={versions} rowKey="id" pagination={false} size="small" style={{ marginTop: 8 }}
          columns={[
            { title: '版本', dataIndex: 'version', width: 90, render: (v: string, r: AgentVersionRead) => <Space>{v}{r.is_current && <Tag color="blue">当前</Tag>}</Space> },
            { title: '变更说明', dataIndex: 'changelog', ellipsis: true, render: (v: string | null) => v || '—' },
            { title: '发布者', dataIndex: 'published_by', width: 100, render: (v: string | null) => v || '—' },
            { title: '发布时间', dataIndex: 'published_at', width: 170, render: (v: string | null) => v ? new Date(v).toLocaleString() : '—' },
            { title: '操作', key: 'act', width: 150,
              render: (_: unknown, r: AgentVersionRead) => (
                <Space>
                  <Button icon={<EyeOutlined />} size="small" type="link"
                    onClick={() => { setViewingAgent({ config: r.config } as AgentRead); setConfigOpen(true) }}>配置</Button>
                  {!r.is_current && (
                    <Popconfirm title={`回滚到 ${r.version}？`} onConfirm={() => handleRollback(r)}>
                      <Button icon={<RollbackOutlined />} size="small" danger>回滚</Button>
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
          locale={{ emptyText: <Empty description="暂无版本记录，请先发布" /> }}
        />
      </Modal>

      {/* View Config Modal */}
      <Modal title={<Space><EyeOutlined />配置详情 {viewingAgent && <Tag>Agent 配置</Tag>}</Space>} open={configOpen}
        onCancel={() => setConfigOpen(false)} footer={<Button onClick={() => setConfigOpen(false)}>关闭</Button>} width={720} destroyOnClose>
        {viewingAgent?.config ? (
          <Tabs size="small" style={{ marginTop: 8 }}
            items={Object.entries(viewingAgent.config).map(([key, val]) => ({
              key, label: <span style={{ textTransform: 'capitalize' }}>{key}</span>,
              children: (
                <div style={{ background: '#1e1e1e', borderRadius: 8, padding: '16px 20px', maxHeight: 400, overflow: 'auto' }}>
                  <Typography.Paragraph copyable={{ text: JSON.stringify(val, null, 2) }} style={{ margin: 0 }}>
                    <pre style={{ color: '#d4d4d4', fontFamily: "'SF Mono', 'Consolas', monospace", fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(val, null, 2)}</pre>
                  </Typography.Paragraph>
                </div>
              ),
            }))}
          />
        ) : (
          <Empty description="暂无配置数据" style={{ padding: 40 }} />
        )}
      </Modal>
    </div>
  )
}

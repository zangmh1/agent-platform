import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Select, Tag, message, Typography, Popconfirm,
  Row, Col, Switch, Descriptions, Card, Statistic, Tooltip, Empty,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  SendOutlined, HistoryOutlined, RollbackOutlined, MinusCircleOutlined, PlusCircleOutlined,
  FileTextOutlined, TagOutlined, CodeOutlined, ClockCircleOutlined, EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  listPrompts, createPrompt, updatePrompt, deletePrompt,
  publishPrompt, getPromptVersions, rollbackPrompt,
} from '../../api/prompts'
import type { PromptRead, PromptCreate, PromptUpdate, PromptVersionRead } from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const CATEGORY_OPTIONS = ['general', 'chat', 'code', 'analysis', 'creative', 'system']
const VARIABLE_TYPES = ['string', 'number', 'boolean', 'text']
const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' }, published: { color: 'success', label: '已发布' },
}

export default function PromptListPage() {
  const [prompts, setPrompts] = useState<PromptRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptRead | null>(null)
  const [promptForm] = Form.useForm()

  const [publishOpen, setPublishOpen] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [publishingPrompt, setPublishingPrompt] = useState<PromptRead | null>(null)
  const [publishForm] = Form.useForm()

  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versions, setVersions] = useState<PromptVersionRead[]>([])
  const [versionsPromptId, setVersionsPromptId] = useState<number | null>(null)

  // View version content
  const [viewVersion, setViewVersion] = useState<PromptVersionRead | null>(null)
  const [viewVersionOpen, setViewVersionOpen] = useState(false)

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      const r = await listPrompts({ page, page_size: pageSize, keyword: keyword || undefined })
      setPrompts(r.items); setTotal(r.total)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])

  useEffect(() => { fetchPrompts() }, [fetchPrompts])

  const publishedCount = useMemo(() => prompts.filter((p) => p.status === 'published').length, [prompts])
  const draftCount = useMemo(() => prompts.filter((p) => p.status === 'draft').length, [prompts])
  const categoryStats = useMemo(() => {
    const m: Record<string, number> = {}
    prompts.forEach((p) => { m[p.category] = (m[p.category] || 0) + 1 })
    return m
  }, [prompts])
  const totalVariables = useMemo(() => prompts.reduce((s, p) => s + (p.variables?.length || 0), 0), [prompts])

  const openCreate = () => { setEditingPrompt(null); promptForm.resetFields(); setFormOpen(true) }
  const openEdit = (p: PromptRead) => {
    setEditingPrompt(p)
    promptForm.setFieldsValue({ ...p })
    setFormOpen(true)
  }
  const handleFormSubmit = async () => {
    try {
      const values = await promptForm.validateFields(); setFormLoading(true)
      if (editingPrompt) { await updatePrompt(editingPrompt.id, values as PromptUpdate); message.success('Prompt 更新成功') }
      else { await createPrompt(values as PromptCreate); message.success('Prompt 创建成功') }
      setFormOpen(false); promptForm.resetFields(); fetchPrompts()
    } catch (err: unknown) { if (err && typeof err === 'object' && 'errorFields' in err) return } finally { setFormLoading(false) }
  }
  const handleDelete = async (p: PromptRead) => {
    try { await deletePrompt(p.id); message.success('Prompt 已删除'); fetchPrompts() } catch { /* handled */ }
  }
  const openPublish = (p: PromptRead) => { setPublishingPrompt(p); publishForm.resetFields(); setPublishOpen(true) }
  const handlePublish = async () => {
    if (!publishingPrompt) return
    try { const v = await publishForm.validateFields(); setPublishLoading(true); await publishPrompt(publishingPrompt.id, { changelog: v.changelog }); message.success('发布成功'); setPublishOpen(false); fetchPrompts() }
    catch (err: unknown) { if (err && typeof err === 'object' && 'errorFields' in err) return } finally { setPublishLoading(false) }
  }
  const openVersions = async (p: PromptRead) => {
    setVersionsPromptId(p.id)
    try { setVersions(await getPromptVersions(p.id)) } catch { /* handled */ }
    setVersionsOpen(true)
  }
  const handleRollback = async (v: PromptVersionRead) => {
    if (!versionsPromptId) return
    try { await rollbackPrompt(versionsPromptId, { version_id: v.id }); message.success(`已回滚到版本 ${v.version}`); setVersionsOpen(false); fetchPrompts() } catch { /* handled */ }
  }

  const columns: ColumnsType<PromptRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60, render: (v: number) => <Text type="secondary">#{v}</Text> },
    { title: '名称', dataIndex: 'name', key: 'name', width: 170, ellipsis: true, render: (v: string) => <Text strong>{v}</Text> },
    { title: '分类', dataIndex: 'category', key: 'category', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '标签', dataIndex: 'tags', key: 'tags', width: 150,
      render: (tags: string[]) => <Space size={4} wrap>{tags.map((t) => <Tag key={t} color="purple">{t}</Tag>)}</Space>,
    },
    { title: '变量', key: 'varCount', width: 70, render: (_: unknown, r: PromptRead) => (
      <Tooltip title={(r.variables ?? []).map((v) => `${v.name} (${v.type})`).join(', ')}>
        <Tag color="cyan">{r.variables?.length || 0}</Tag>
      </Tooltip>
    )},
    { title: '版本', dataIndex: 'version', key: 'version', width: 70, render: (v: string) => <Tag color="geekblue">{v}</Tag> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v: string) => { const s = STATUS_MAP[v] || { color: 'default', label: v }; return <Tag color={s.color}>{s.label}</Tag> },
    },
    { title: '创建者', dataIndex: 'created_by', key: 'created_by', width: 90, render: (v: string | null) => v || <Text type="secondary">—</Text> },
    {
      title: '操作', key: 'actions', width: 250, fixed: 'right',
      render: (_: unknown, r: PromptRead) => (
        <Space wrap size={4}>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Button icon={<SendOutlined />} size="small" type="primary" ghost onClick={() => openPublish(r)}>发布</Button>
          <Button icon={<HistoryOutlined />} size="small" onClick={() => openVersions(r)}>版本</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* ===== 页面头部 ===== */}
      <div style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><FileTextOutlined style={{ marginRight: 8 }} />Prompt 管理</Title>
            <Text type="secondary">管理 Prompt 模板，支持变量定义、版本快照、发布与回滚流程</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>创建 Prompt</Button>
        </div>
      </div>

      {/* ===== 统计卡片 ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="总数" value={total} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="已发布" value={publishedCount} prefix={<SendOutlined />} valueStyle={{ color: '#52c41a' }}
              suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {total}</Text>} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="草稿" value={draftCount} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="总变量" value={totalVariables} prefix={<CodeOutlined />} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
      </Row>

      {/* ===== 分类分布 ===== */}
      {Object.keys(categoryStats).length > 0 && (
        <Card size="small" style={{ marginBottom: 20 }} title={<Space><TagOutlined />分类分布</Space>}>
          <Space wrap>
            {Object.entries(categoryStats).map(([cat, count]) => (
              <Tag key={cat} color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
                {cat}: {count}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* ===== 搜索 + 表格卡片 ===== */}
      <Card title={<Space><SearchOutlined />筛选查询</Space>} extra={<Button icon={<ReloadOutlined />} onClick={fetchPrompts}>刷新</Button>}>
        <Input.Search placeholder="搜索名称或分类..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ maxWidth: 360, marginBottom: 16 }} enterButton />
        <Table columns={columns} dataSource={prompts} rowKey="id" loading={loading} scroll={{ x: 1150 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 个 Prompt`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* ===== Create/Edit Modal ===== */}
      <Modal title={editingPrompt ? '编辑 Prompt' : '创建 Prompt'} open={formOpen} onOk={handleFormSubmit}
        onCancel={() => { setFormOpen(false); promptForm.resetFields() }} confirmLoading={formLoading} destroyOnClose width={740}>
        <Form form={promptForm} layout="vertical" style={{ marginTop: 16 }} initialValues={{ category: 'general', tags: [], variables: [] }}>
          <Row gutter={16}>
            <Col span={14}><Form.Item name="name" label="名称" rules={[{ required: true }]}><Input placeholder="如 对话摘要助手" /></Form.Item></Col>
            <Col span={10}><Form.Item name="category" label="分类">
              <Select>{CATEGORY_OPTIONS.map((c) => <Option key={c} value={c}>{c}</Option>)}</Select>
            </Form.Item></Col>
          </Row>
          <Form.Item name="tags" label="标签"><Select mode="tags" placeholder="输入标签后回车" /></Form.Item>
          <Form.Item name="content" label="Prompt 内容" rules={[{ required: true }]}>
            <Input.TextArea rows={7} placeholder="编写 Prompt 模板内容，使用 {{variable_name}} 语法插入变量" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>变量定义 <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>使用 {`{{变量名}}`} 在正文中引用</Text></Text>
          <Form.List name="variables">
            {(fields, { add, remove }) => (
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: '12px 16px 0', maxHeight: 260, overflow: 'auto', background: '#fafafa' }}>
                {fields.length === 0 && <div style={{ textAlign: 'center', padding: 16 }}><Empty description="暂无变量" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>}
                {fields.map(({ key, name, ...rest }) => (
                  <Row gutter={10} key={key} align="top" style={{ marginBottom: 10 }}>
                    <Col span={5}><Form.Item {...rest} name={[name, 'name']} style={{ marginBottom: 0 }} rules={[{ required: true }]}><Input placeholder="变量名" size="small" /></Form.Item></Col>
                    <Col span={3}><Form.Item {...rest} name={[name, 'type']} initialValue="string" style={{ marginBottom: 0 }}><Select size="small">{VARIABLE_TYPES.map((t) => <Option key={t} value={t}>{t}</Option>)}</Select></Form.Item></Col>
                    <Col span={6}><Form.Item {...rest} name={[name, 'description']} style={{ marginBottom: 0 }}><Input placeholder="描述" size="small" /></Form.Item></Col>
                    <Col span={4}><Form.Item {...rest} name={[name, 'default_value']} style={{ marginBottom: 0 }}><Input placeholder="默认值" size="small" /></Form.Item></Col>
                    <Col span={4}><Form.Item {...rest} name={[name, 'required']} valuePropName="checked" initialValue={true} style={{ marginBottom: 0 }}><Switch size="small" checkedChildren="必填" unCheckedChildren="可选" /></Form.Item></Col>
                    <Col span={2} style={{ textAlign: 'center', paddingTop: 2 }}><Button type="text" danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} /></Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add({ name: '', type: 'string', description: '', default_value: '', required: true })} block size="small" icon={<PlusCircleOutlined />} style={{ marginBottom: 12 }}>添加变量</Button>
              </div>
            )}
          </Form.List>
          <Form.Item name="description" label="描述" style={{ marginTop: 16 }}><Input.TextArea rows={2} placeholder="描述（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* ===== Publish Modal ===== */}
      <Modal title={<Space><SendOutlined />发布 Prompt {publishingPrompt && `— ${publishingPrompt.name}`}</Space>} open={publishOpen}
        onOk={handlePublish} onCancel={() => setPublishOpen(false)} confirmLoading={publishLoading} destroyOnClose width={480}>
        <Form form={publishForm} layout="vertical" style={{ marginTop: 16 }}>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="当前版本"><Tag color="geekblue">{publishingPrompt?.version}</Tag></Descriptions.Item>
            <Descriptions.Item label="状态"><Tag>{publishingPrompt?.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="变量数">{publishingPrompt?.variables?.length || 0}</Descriptions.Item>
          </Descriptions>
          <Form.Item name="changelog" label="变更说明"><Input.TextArea rows={3} placeholder="描述本次发布变更内容（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* ===== Version History Modal ===== */}
      <Modal title={<Space><HistoryOutlined />版本历史</Space>} open={versionsOpen} onCancel={() => setVersionsOpen(false)}
        footer={null} width={820} destroyOnClose>
        <Table dataSource={versions} rowKey="id" pagination={false} size="small" style={{ marginTop: 8 }}
          columns={[
            { title: '版本', dataIndex: 'version', key: 'version', width: 90, render: (v: string, r: PromptVersionRead) => (
              <Space>{v}{r.is_current && <Tag color="blue">当前</Tag>}</Space>
            )},
            { title: '变更说明', dataIndex: 'changelog', key: 'changelog', ellipsis: true, render: (v: string | null) => v || <Text type="secondary">—</Text> },
            { title: '发布者', dataIndex: 'published_by', key: 'published_by', width: 100, render: (v: string | null) => v || '—' },
            { title: '发布时间', dataIndex: 'published_at', key: 'published_at', width: 170, render: (v: string | null) => v ? new Date(v).toLocaleString() : '—' },
            { title: '操作', key: 'act', width: 150,
              render: (_: unknown, r: PromptVersionRead) => (
                <Space>
                  <Button icon={<EyeOutlined />} size="small" type="link"
                    onClick={() => { setViewVersion(r); setViewVersionOpen(true) }}>
                    查看
                  </Button>
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

      {/* ===== View Version Content Modal ===== */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            版本详情
            {viewVersion && (
              <>
                <Tag color="geekblue">{viewVersion.version}</Tag>
                {viewVersion.is_current && <Tag color="blue">当前版本</Tag>}
              </>
            )}
          </Space>
        }
        open={viewVersionOpen}
        onCancel={() => setViewVersionOpen(false)}
        footer={<Button onClick={() => setViewVersionOpen(false)}>关闭</Button>}
        width={760}
        destroyOnClose
      >
        {viewVersion && (
          <div style={{ marginTop: 8 }}>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="版本号">
                <Tag color="geekblue">{viewVersion.version}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {viewVersion.is_current ? <Tag color="blue">当前</Tag> : <Tag>历史</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="变更说明" span={2}>
                {viewVersion.changelog || <Text type="secondary">无</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="发布者">
                {viewVersion.published_by || <Text type="secondary">—</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {viewVersion.published_at ? new Date(viewVersion.published_at).toLocaleString() : <Text type="secondary">—</Text>}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 14 }}><CodeOutlined /> Prompt 内容</Text>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                {viewVersion.content.length} 字符
              </Text>
            </div>
            <div style={{
              background: '#1e1e1e',
              borderRadius: 8,
              padding: '16px 20px',
              maxHeight: 400,
              overflow: 'auto',
              position: 'relative',
            }}>
              <Typography.Paragraph
                copyable={{ text: viewVersion.content }}
                style={{ marginBottom: 0 }}
              >
                <pre style={{
                  color: '#d4d4d4',
                  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                  fontSize: 13,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}>
                  {viewVersion.content}
                </pre>
              </Typography.Paragraph>
            </div>

            {/* Variable highlighting */}
            {(() => {
              const varMatches = viewVersion.content.match(/\{\{(\w+)\}\}/g)
              if (varMatches && varMatches.length > 0) {
                const varNames = [...new Set(varMatches.map((m) => m.replace(/[{}]/g, '')))]
                return (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      检测到 {varNames.length} 个变量引用：
                    </Text>
                    <Space size={4} wrap style={{ marginTop: 4 }}>
                      {varNames.map((v) => (
                        <Tag key={v} color="cyan" style={{ fontFamily: 'monospace' }}>{`{{${v}}}`}</Tag>
                      ))}
                    </Space>
                  </div>
                )
              }
              return null
            })()}
          </div>
        )}
      </Modal>
    </div>
  )
}

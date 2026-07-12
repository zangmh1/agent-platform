import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Tag, message, Typography, Popconfirm,
  Card, Statistic, Row, Col, Drawer, Tabs, Upload, Tooltip, Descriptions, Empty,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  DatabaseOutlined, FileTextOutlined, UploadOutlined, InboxOutlined,
  EyeOutlined, NumberOutlined, ThunderboltOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, FileOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listKnowledgeBases, createKnowledgeBase, updateKnowledgeBase, deleteKnowledgeBase,
  listDocuments, uploadDocument, deleteDocument, listSegments, updateSegment, deleteSegment,
} from '../../api/knowledge'
import type { KnowledgeBaseRead, KnowledgeBaseCreate, KnowledgeBaseUpdate, DocumentRead, SegmentRead, SegmentUpdate } from '../../types'

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

const KB_STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  ready: { color: 'success', label: '就绪', icon: <CheckCircleOutlined /> },
  indexing: { color: 'processing', label: '索引中', icon: <ThunderboltOutlined /> },
  error: { color: 'error', label: '异常', icon: <ExclamationCircleOutlined /> },
  empty: { color: 'default', label: '空', icon: <InboxOutlined /> },
}
const DOC_STATUS_MAP: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待处理' },
  processing: { color: 'processing', label: '处理中' },
  completed: { color: 'success', label: '已完成' },
  failed: { color: 'error', label: '失败' },
}
const FILE_TYPE_COLORS: Record<string, string> = { pdf: 'red', docx: 'blue', md: 'green', txt: 'default', html: 'orange', csv: 'purple' }

export default function KnowledgeBaseListPage() {
  const [kbs, setKbs] = useState<KnowledgeBaseRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState(''); const [loading, setLoading] = useState(false)

  // KB form
  const [formOpen, setFormOpen] = useState(false); const [formLoading, setFormLoading] = useState(false)
  const [editingKb, setEditingKb] = useState<KnowledgeBaseRead | null>(null); const [kbForm] = Form.useForm()

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false); const [selectedKb, setSelectedKb] = useState<KnowledgeBaseRead | null>(null)
  const [docs, setDocs] = useState<DocumentRead[]>([]); const [docsTotal, setDocsTotal] = useState(0)
  const [docsPage, setDocsPage] = useState(1); const [docsLoading, setDocsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Segments
  const [segs, setSegs] = useState<SegmentRead[]>([]); const [segsTotal, setSegsTotal] = useState(0)
  const [segsPage, setSegsPage] = useState(1); const [segsLoading, setSegsLoading] = useState(false); const [segsKeyword, setSegsKeyword] = useState('')

  // Segment edit
  const [segEditOpen, setSegEditOpen] = useState(false); const [editingSeg, setEditingSeg] = useState<SegmentRead | null>(null)
  const [segForm] = Form.useForm(); const [segSaving, setSegSaving] = useState(false)

  const fetchKbs = useCallback(async () => {
    setLoading(true)
    try { const r = await listKnowledgeBases({ page, page_size: pageSize, keyword: keyword || undefined }); setKbs(r.items); setTotal(r.total) } catch { /* */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])
  useEffect(() => { fetchKbs() }, [fetchKbs])

  const fetchDocs = useCallback(async () => {
    if (!selectedKb) return; setDocsLoading(true)
    try { const r = await listDocuments(selectedKb.id, { page: docsPage, page_size: 10 }); setDocs(r.items); setDocsTotal(r.total) } catch { /* */ } finally { setDocsLoading(false) }
  }, [selectedKb, docsPage])
  useEffect(() => { fetchDocs() }, [fetchDocs])

  const fetchSegs = useCallback(async () => {
    if (!selectedKb) return; setSegsLoading(true)
    try { const r = await listSegments(selectedKb.id, { page: segsPage, page_size: 10, keyword: segsKeyword || undefined }); setSegs(r.items); setSegsTotal(r.total) } catch { /* */ } finally { setSegsLoading(false) }
  }, [selectedKb, segsPage, segsKeyword])
  useEffect(() => { fetchSegs() }, [fetchSegs])

  const readyCount = useMemo(() => kbs.filter((k) => k.status === 'ready').length, [kbs])
  const totalDocs = useMemo(() => kbs.reduce((s, k) => s + k.document_count, 0), [kbs])
  const totalSegs = useMemo(() => kbs.reduce((s, k) => s + k.segment_count, 0), [kbs])

  // KB CRUD
  const openCreate = () => { setEditingKb(null); kbForm.resetFields(); setFormOpen(true) }
  const openEdit = (kb: KnowledgeBaseRead) => { setEditingKb(kb); kbForm.setFieldsValue(kb); setFormOpen(true) }
  const handleKbSubmit = async () => {
    try { const v = await kbForm.validateFields(); setFormLoading(true)
      if (editingKb) { await updateKnowledgeBase(editingKb.id, v as KnowledgeBaseUpdate); message.success('更新成功') }
      else { await createKnowledgeBase(v as KnowledgeBaseCreate); message.success('创建成功') }
      setFormOpen(false); kbForm.resetFields(); fetchKbs()
    } catch (e: unknown) { if (e && typeof e === 'object' && 'errorFields' in e) return } finally { setFormLoading(false) }
  }
  const handleDeleteKb = async (kb: KnowledgeBaseRead) => { try { await deleteKnowledgeBase(kb.id); message.success('已删除'); fetchKbs() } catch { /* */ } }

  // Document ops
  const handleUpload = async (file: File) => {
    if (!selectedKb) return; setUploading(true)
    try { await uploadDocument(selectedKb.id, file); message.success(`"${file.name}" 上传成功`); fetchDocs(); fetchKbs() }
    catch { /* */ } finally { setUploading(false) }
    return false // prevent default upload
  }
  const handleDeleteDoc = async (doc: DocumentRead) => { if (!selectedKb) return; try { await deleteDocument(selectedKb.id, doc.id); message.success('文档已删除'); fetchDocs(); fetchKbs() } catch { /* */ } }

  // Segment ops
  const openSegEdit = (seg: SegmentRead) => { setEditingSeg(seg); segForm.setFieldsValue({ content: seg.content, keywords: seg.keywords?.join(', ') || '' }); setSegEditOpen(true) }
  const handleSegSave = async () => {
    if (!selectedKb || !editingSeg) return
    try { const v = await segForm.validateFields(); setSegSaving(true)
      const kws = v.keywords ? v.keywords.split(',').map((s: string) => s.trim()).filter(Boolean) : null
      await updateSegment(selectedKb.id, editingSeg.id, { content: v.content, keywords: kws } as SegmentUpdate)
      message.success('分段已更新'); setSegEditOpen(false); fetchSegs()
    } catch (e: unknown) { if (e && typeof e === 'object' && 'errorFields' in e) return } finally { setSegSaving(false) }
  }
  const handleDeleteSeg = async (seg: SegmentRead) => { if (!selectedKb) return; try { await deleteSegment(selectedKb.id, seg.id); message.success('分段已删除'); fetchSegs(); fetchKbs() } catch { /* */ } }

  const openDrawer = async (kb: KnowledgeBaseRead) => { setSelectedKb(kb); setDocsPage(1); setSegsPage(1); setSegsKeyword(''); setDrawerOpen(true) }

  const kbColumns: ColumnsType<KnowledgeBaseRead> = [
    { title: 'ID', dataIndex: 'id', width: 60, render: (v: number) => <Text type="secondary">#{v}</Text> },
    { title: '名称', dataIndex: 'name', width: 180, render: (v: string) => <Text strong>{v}</Text> },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => { const s = KB_STATUS_MAP[v] || { color: 'default', label: v, icon: null }; return <Tag color={s.color} icon={s.icon}>{s.label}</Tag> } },
    { title: '文档', dataIndex: 'document_count', width: 70, render: (v: number) => <Tag color={v > 0 ? 'blue' : 'default'}>{v}</Tag> },
    { title: '分段', dataIndex: 'segment_count', width: 70, render: (v: number) => <Tag color={v > 0 ? 'purple' : 'default'}>{v}</Tag> },
    { title: '向量模型', dataIndex: 'embedding_model', width: 180, ellipsis: true, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: '描述', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v || <Text type="secondary">—</Text> },
    {
      title: '操作', width: 260, fixed: 'right',
      render: (_: unknown, r: KnowledgeBaseRead) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" type="primary" ghost onClick={() => openDrawer(r)}>管理</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)}>编辑</Button>
          <Popconfirm title="删除知识库将同时删除所有文档和分段" onConfirm={() => handleDeleteKb(r)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #fff1cc 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><DatabaseOutlined style={{ marginRight: 8 }} />知识库管理</Title>
            <Text type="secondary">管理知识库、文档和分段的三层结构，支持文档上传与分段检索</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>创建知识库</Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="知识库" value={total} prefix={<DatabaseOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="就绪" value={readyCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} suffix={<Text type="secondary" style={{ fontSize: 14 }}>/ {total}</Text>} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="文档总数" value={totalDocs} prefix={<FileTextOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="分段总数" value={totalSegs} prefix={<NumberOutlined />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>

      {/* KB Table */}
      <Card title={<Space><SearchOutlined />知识库列表</Space>} extra={<Button icon={<ReloadOutlined />} onClick={fetchKbs}>刷新</Button>}>
        <Input.Search placeholder="搜索名称或描述..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ maxWidth: 360, marginBottom: 16 }} enterButton />
        <Table columns={kbColumns} dataSource={kbs} rowKey="id" loading={loading} scroll={{ x: 1050 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 个知识库`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* KB Form Modal */}
      <Modal title={editingKb ? '编辑知识库' : '创建知识库'} open={formOpen} onOk={handleKbSubmit}
        onCancel={() => { setFormOpen(false); kbForm.resetFields() }} confirmLoading={formLoading} destroyOnClose>
        <Form form={kbForm} layout="vertical" style={{ marginTop: 16 }} initialValues={{ embedding_model: 'text-embedding-ada-002' }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input placeholder="知识库名称" /></Form.Item>
          <Form.Item name="embedding_model" label="向量化模型"><Input placeholder="text-embedding-ada-002" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} placeholder="描述（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* ===== Detail Drawer ===== */}
      <Drawer title={<Space><DatabaseOutlined />{selectedKb?.name}<Tag color="blue">ID: {selectedKb?.id}</Tag></Space>}
        open={drawerOpen} onClose={() => setDrawerOpen(false)} width={820} destroyOnClose>
        {selectedKb && (
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 20 }}>
            <Descriptions.Item label="状态">{KB_STATUS_MAP[selectedKb.status] ? <Tag color={KB_STATUS_MAP[selectedKb.status].color}>{KB_STATUS_MAP[selectedKb.status].label}</Tag> : selectedKb.status}</Descriptions.Item>
            <Descriptions.Item label="向量模型"><Text code>{selectedKb.embedding_model}</Text></Descriptions.Item>
            <Descriptions.Item label="文档数">{selectedKb.document_count}</Descriptions.Item>
            <Descriptions.Item label="分段数">{selectedKb.segment_count}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{selectedKb.description || '—'}</Descriptions.Item>
          </Descriptions>
        )}

        <Tabs defaultActiveKey="docs" items={[
          {
            key: 'docs', label: <span><FileTextOutlined /> 文档管理</span>,
            children: (
              <div>
                <Dragger accept=".pdf,.docx,.md,.txt,.html,.csv" showUploadList={false} beforeUpload={handleUpload}
                  disabled={uploading} style={{ marginBottom: 16 }}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">点击或拖拽文件上传</p>
                  <p className="ant-upload-hint">支持 PDF、DOCX、MD、TXT、HTML、CSV 格式</p>
                </Dragger>
                <Table dataSource={docs} rowKey="id" loading={docsLoading} size="small"
                  pagination={{ current: docsPage, pageSize: 10, total: docsTotal, onChange: (p) => setDocsPage(p), showTotal: (t) => `共 ${t} 个文档` }}
                  columns={[
                    { title: '文件名', dataIndex: 'file_name', ellipsis: true, render: (v: string) => <Space><FileOutlined /><Text strong>{v}</Text></Space> },
                    { title: '类型', dataIndex: 'file_type', width: 70, render: (v: string) => <Tag color={FILE_TYPE_COLORS[v] || 'default'}>{v.toUpperCase()}</Tag> },
                    { title: '大小', dataIndex: 'file_size', width: 80, render: (v: string | null) => v || '—' },
                    { title: '状态', dataIndex: 'status', width: 80, render: (v: string) => { const s = DOC_STATUS_MAP[v] || { color: 'default', label: v }; return <Tag color={s.color}>{s.label}</Tag> } },
                    { title: '分段', dataIndex: 'segment_count', width: 60 },
                    { title: '字数', dataIndex: 'word_count', width: 60 },
                    { title: '错误', dataIndex: 'error_message', width: 100, ellipsis: true, render: (v: string | null) => v ? <Text type="danger" style={{ fontSize: 11 }}>{v}</Text> : '—' },
                    {
                      title: '操作', width: 60,
                      render: (_: unknown, r: DocumentRead) => (
                        <Popconfirm title="确定删除此文档？" onConfirm={() => handleDeleteDoc(r)}>
                          <Button icon={<DeleteOutlined />} size="small" danger />
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'segments', label: <span><NumberOutlined /> 分段检索</span>,
            children: (
              <div>
                <Input.Search placeholder="搜索分段内容..." value={segsKeyword} onChange={(e) => { setSegsKeyword(e.target.value); setSegsPage(1) }} allowClear style={{ marginBottom: 16 }} enterButton />
                <Table dataSource={segs} rowKey="id" loading={segsLoading} size="small"
                  pagination={{ current: segsPage, pageSize: 10, total: segsTotal, onChange: (p) => setSegsPage(p), showTotal: (t) => `共 ${t} 个分段` }}
                  columns={[
                    { title: '#', dataIndex: 'position', width: 50 },
                    { title: '内容', dataIndex: 'content', ellipsis: true, render: (v: string) => <Text style={{ fontSize: 12 }}>{v.length > 120 ? v.slice(0, 120) + '...' : v}</Text> },
                    { title: '字数', dataIndex: 'word_count', width: 60 },
                    { title: 'Tokens', dataIndex: 'token_count', width: 70 },
                    { title: '关键词', dataIndex: 'keywords', width: 160, ellipsis: true, render: (v: string[] | null) => v?.map((k) => <Tag key={k} color="cyan" style={{ fontSize: 10 }}>{k}</Tag>) || '—' },
                    { title: '命中', dataIndex: 'hit_count', width: 60 },
                    {
                      title: '操作', width: 100,
                      render: (_: unknown, r: SegmentRead) => (
                        <Space size={4}>
                          <Button icon={<EditOutlined />} size="small" type="link" onClick={() => openSegEdit(r)}>编辑</Button>
                          <Popconfirm title="删除此分段？" onConfirm={() => handleDeleteSeg(r)}>
                            <Button icon={<DeleteOutlined />} size="small" type="link" danger />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
        ]} />
      </Drawer>

      {/* Segment Edit Modal */}
      <Modal title={`编辑分段 #${editingSeg?.position ?? ''}`} open={segEditOpen} onOk={handleSegSave}
        onCancel={() => setSegEditOpen(false)} confirmLoading={segSaving} width={640} destroyOnClose>
        <Form form={segForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="content" label="分段内容" rules={[{ required: true }]}>
            <Input.TextArea rows={10} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="keywords" label="关键词" extra="多个关键词用逗号分隔">
            <Input placeholder="关键词1, 关键词2" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

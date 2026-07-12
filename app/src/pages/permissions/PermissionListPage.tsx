import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, message, Typography, Popconfirm, Tag,
  Card, Statistic, Row, Col,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  SafetyCertificateOutlined, KeyOutlined, AppstoreOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listPermissions, createPermission, updatePermission, deletePermission } from '../../api/permissions'
import type { PermissionRead, PermissionCreate, PermissionUpdate } from '../../types'

const { Title, Text } = Typography

export default function PermissionListPage() {
  const [permissions, setPermissions] = useState<PermissionRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingPerm, setEditingPerm] = useState<PermissionRead | null>(null)
  const [permForm] = Form.useForm()

  const fetchPermissions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listPermissions({ page, page_size: pageSize, keyword: keyword || undefined })
      setPermissions(result.items)
      setTotal(result.total)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])

  useEffect(() => { fetchPermissions() }, [fetchPermissions])

  // Group by resource prefix for stats
  const resourceStats = useMemo(() => {
    const map: Record<string, number> = {}
    permissions.forEach((p) => {
      const prefix = p.code.split(':')[0] || 'other'
      map[prefix] = (map[prefix] || 0) + 1
    })
    return map
  }, [permissions])

  const openCreate = () => { setEditingPerm(null); permForm.resetFields(); setFormOpen(true) }
  const openEdit = (perm: PermissionRead) => {
    setEditingPerm(perm); permForm.setFieldsValue({ name: perm.name, description: perm.description }); setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await permForm.validateFields(); setFormLoading(true)
      if (editingPerm) { await updatePermission(editingPerm.id, values as PermissionUpdate); message.success('权限更新成功') }
      else { await createPermission(values as PermissionCreate); message.success('权限创建成功') }
      setFormOpen(false); permForm.resetFields(); fetchPermissions()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
    } finally { setFormLoading(false) }
  }

  const handleDelete = async (perm: PermissionRead) => {
    try { await deletePermission(perm.id); message.success('权限已删除'); fetchPermissions() } catch { /* handled */ }
  }

  const columns: ColumnsType<PermissionRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70, render: (v: number) => <Text type="secondary">#{v}</Text> },
    {
      title: '权限编码', dataIndex: 'code', key: 'code', width: 170,
      render: (v: string) => {
        const parts = v.split(':')
        return (
          <Space size={4}>
            <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 12 }}>{parts[0]}</Tag>
            <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>:{parts.slice(1).join(':')}</Text>
          </Space>
        )
      },
    },
    { title: '名称', dataIndex: 'name', key: 'name', width: 140, render: (v: string) => <Text strong>{v}</Text> },
    {
      title: '描述', dataIndex: 'description', key: 'description', ellipsis: true,
      render: (v: string | null) => v || <Text type="secondary">—</Text>,
    },
    {
      title: '操作', key: 'actions', width: 170,
      render: (_: unknown, record: PermissionRead) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除此权限？" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* ===== 页面头部 ===== */}
      <div style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><SafetyCertificateOutlined style={{ marginRight: 8 }} />权限管理</Title>
            <Text type="secondary">管理系统中所有可控制的细粒度操作权限，建议使用 资源:操作 格式命名</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>创建权限</Button>
        </div>
      </div>

      {/* ===== 统计卡片 ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="权限总数" value={total} prefix={<KeyOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="资源分类" value={Object.keys(resourceStats).length} prefix={<AppstoreOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>资源分布：</Text>
            <div style={{ marginTop: 4 }}>
              {Object.entries(resourceStats).map(([key, count]) => (
                <Tag key={key} style={{ marginBottom: 4 }}>{key}: {count}</Tag>
              ))}
              {Object.keys(resourceStats).length === 0 && <Text type="secondary">暂无数据</Text>}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ===== 搜索 + 表格卡片 ===== */}
      <Card title={<Space><SearchOutlined />筛选查询</Space>} extra={<Button icon={<ReloadOutlined />} onClick={fetchPermissions}>刷新</Button>}>
        <Input.Search placeholder="搜索权限编码或名称..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ maxWidth: 360, marginBottom: 16 }} enterButton />
        <Table columns={columns} dataSource={permissions} rowKey="id" loading={loading}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条权限记录`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* ===== 创建/编辑弹窗 ===== */}
      <Modal title={editingPerm ? '编辑权限' : '创建权限'} open={formOpen} onOk={handleFormSubmit}
        onCancel={() => { setFormOpen(false); permForm.resetFields() }} confirmLoading={formLoading} destroyOnClose>
        <Form form={permForm} layout="vertical" style={{ marginTop: 16 }}>
          {!editingPerm && (
            <Form.Item name="code" label="权限编码" rules={[{ required: true }]} extra="建议使用 资源:操作 格式，如 user:list">
              <Input placeholder="如 user:list, role:create" prefix={<KeyOutlined />} />
            </Form.Item>
          )}
          <Form.Item name="name" label="权限名称" rules={[{ required: true }]}><Input placeholder="如 用户列表" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} placeholder="权限描述（可选）" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

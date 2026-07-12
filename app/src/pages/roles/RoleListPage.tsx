import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Checkbox, message, Typography, Popconfirm, Tag,
  Card, Statistic, Row, Col, Tooltip,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined,
  SearchOutlined, ReloadOutlined, TeamOutlined, KeyOutlined, FileProtectOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listRoles, createRole, updateRole, deleteRole, assignRolePermissions, getRole } from '../../api/roles'
import { listAllPermissions } from '../../api/permissions'
import type { RoleRead, RoleCreate, RoleUpdate, PermissionRead } from '../../types'

const { Title, Text } = Typography

export default function RoleListPage() {
  const [roles, setRoles] = useState<RoleRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleRead | null>(null)
  const [roleForm] = Form.useForm()

  const [permOpen, setPermOpen] = useState(false)
  const [permLoading, setPermLoading] = useState(false)
  const [allPermissions, setAllPermissions] = useState<PermissionRead[]>([])
  const [checkedPermIds, setCheckedPermIds] = useState<number[]>([])
  const [permRole, setPermRole] = useState<RoleRead | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listRoles({ page, page_size: pageSize, keyword: keyword || undefined })
      setRoles(result.items)
      setTotal(result.total)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const totalPermsAssigned = useMemo(() => roles.reduce((sum, r) => sum + (r.permissions?.length ?? 0), 0), [roles])

  const openCreate = () => { setEditingRole(null); roleForm.resetFields(); setFormOpen(true) }
  const openEdit = (role: RoleRead) => {
    setEditingRole(role); roleForm.setFieldsValue({ name: role.name, description: role.description }); setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await roleForm.validateFields(); setFormLoading(true)
      if (editingRole) { await updateRole(editingRole.id, values as RoleUpdate); message.success('角色更新成功') }
      else { await createRole(values as RoleCreate); message.success('角色创建成功') }
      setFormOpen(false); roleForm.resetFields(); fetchRoles()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
    } finally { setFormLoading(false) }
  }

  const handleDelete = async (role: RoleRead) => {
    try { await deleteRole(role.id); message.success('角色已删除'); fetchRoles() } catch { /* handled */ }
  }

  const openPermModal = async (role: RoleRead) => {
    setPermRole(role)
    try {
      const [allPerms] = await Promise.all([listAllPermissions()])
      setAllPermissions(allPerms)
      if (role.permissions) { setCheckedPermIds(role.permissions.map((p) => p.id)) }
      else { const full = await getRole(role.id); setCheckedPermIds((full.permissions ?? []).map((p) => p.id)) }
    } catch { /* handled */ }
    setPermOpen(true)
  }

  const handlePermSubmit = async () => {
    if (!permRole) return; setPermLoading(true)
    try { await assignRolePermissions(permRole.id, { permission_ids: checkedPermIds }); message.success('权限分配成功'); setPermOpen(false); fetchRoles() }
    catch { /* handled */ } finally { setPermLoading(false) }
  }

  const columns: ColumnsType<RoleRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70, render: (v: number) => <Text type="secondary">#{v}</Text> },
    { title: '编码', dataIndex: 'code', key: 'code', width: 120, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '名称', dataIndex: 'name', key: 'name', width: 140, render: (v: string) => <Text strong>{v}</Text> },
    {
      title: '描述', dataIndex: 'description', key: 'description', ellipsis: true,
      render: (v: string | null) => v || <Text type="secondary">—</Text>,
    },
    {
      title: '关联权限', key: 'permCount', width: 110,
      render: (_: unknown, r: RoleRead) => (
        <Tooltip title={(r.permissions ?? []).map((p) => `${p.code}: ${p.name}`).join('\n')}>
          <Tag color="purple" style={{ cursor: 'pointer' }}>
            <SafetyCertificateOutlined /> {(r.permissions ?? []).length} 个权限
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '操作', key: 'actions', width: 270,
      render: (_: unknown, record: RoleRead) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Button icon={<SafetyCertificateOutlined />} size="small" onClick={() => openPermModal(record)}>分配权限</Button>
          <Popconfirm title="确定删除此角色？" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* ===== 页面头部 ===== */}
      <div style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><TeamOutlined style={{ marginRight: 8 }} />角色管理</Title>
            <Text type="secondary">管理角色定义，为不同角色分配相应的权限集合</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>创建角色</Button>
        </div>
      </div>

      {/* ===== 统计卡片 ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <Card size="small" hoverable>
            <Statistic title="角色总数" value={total} prefix={<TeamOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" hoverable>
            <Statistic title="已分配权限" value={totalPermsAssigned} prefix={<SafetyCertificateOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" hoverable>
            <Statistic title="可用权限项" value={allPermissions.length} prefix={<KeyOutlined />} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
      </Row>

      {/* ===== 搜索 + 表格卡片 ===== */}
      <Card title={<Space><SearchOutlined />筛选查询</Space>} extra={<Button icon={<ReloadOutlined />} onClick={fetchRoles}>刷新</Button>}>
        <Input.Search placeholder="搜索角色编码或名称..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} allowClear style={{ maxWidth: 360, marginBottom: 16 }} enterButton />
        <Table columns={columns} dataSource={roles} rowKey="id" loading={loading}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条角色记录`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </Card>

      {/* ===== 创建/编辑弹窗 ===== */}
      <Modal title={editingRole ? '编辑角色' : '创建角色'} open={formOpen} onOk={handleFormSubmit}
        onCancel={() => { setFormOpen(false); roleForm.resetFields() }} confirmLoading={formLoading} destroyOnClose>
        <Form form={roleForm} layout="vertical" style={{ marginTop: 16 }}>
          {!editingRole && <Form.Item name="code" label="角色编码" rules={[{ required: true }]}><Input placeholder="如 admin, editor" /></Form.Item>}
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}><Input placeholder="如 管理员" /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={3} placeholder="角色描述（可选）" /></Form.Item>
        </Form>
      </Modal>

      {/* ===== 分配权限弹窗 ===== */}
      <Modal title={`分配权限 — ${permRole?.name ?? ''}`} open={permOpen} onOk={handlePermSubmit}
        onCancel={() => setPermOpen(false)} confirmLoading={permLoading} width={620} destroyOnClose>
        <div style={{ marginTop: 16, maxHeight: 420, overflow: 'auto' }}>
          <Checkbox.Group value={checkedPermIds} onChange={(v) => setCheckedPermIds(v as number[])} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {allPermissions.map((perm) => (
                <Card key={perm.id} size="small" hoverable style={{ width: '100%' }}>
                  <Checkbox value={perm.id}>
                    <Space>
                      <Tag color="purple" style={{ fontFamily: 'monospace' }}>{perm.code}</Tag>
                      <Text strong>{perm.name}</Text>
                      {perm.description && <Text type="secondary" style={{ fontSize: 12 }}>({perm.description})</Text>}
                    </Space>
                  </Checkbox>
                </Card>
              ))}
            </Space>
          </Checkbox.Group>
          {allPermissions.length === 0 && <div style={{ textAlign: 'center', color: '#999', padding: 32 }}>暂无权限数据，请先在「权限管理」中创建</div>}
        </div>
      </Modal>
    </div>
  )
}

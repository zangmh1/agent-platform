import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Tag, Transfer, message, Typography, Popconfirm,
  Card, Statistic, Row, Col, Tooltip, Badge,
} from 'antd'
import {
  PlusOutlined, TeamOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined,
  UserOutlined, CheckCircleOutlined, StopOutlined, IdcardOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listUsers, createUser, getUserRoles, assignUserRoles, deleteUser } from '../../api/users'
import { listAllRoles } from '../../api/roles'
import type { UserRead, UserCreate, RoleRead, UserWithRolesRead } from '../../types'

const { Title, Text } = Typography

export default function UserListPage() {
  const [users, setUsers] = useState<UserRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm] = Form.useForm()

  const [rolesOpen, setRolesOpen] = useState(false)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [allRoles, setAllRoles] = useState<RoleRead[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [currentUser, setCurrentUser] = useState<UserRead | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listUsers({ page, page_size: pageSize, keyword: keyword || undefined })
      setUsers(result.items)
      setTotal(result.total)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [page, pageSize, keyword])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Stats
  const activeCount = useMemo(() => users.filter((u) => u.is_active).length, [users])
  const inactiveCount = useMemo(() => users.filter((u) => !u.is_active).length, [users])

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreateLoading(true)
      await createUser(values as UserCreate)
      message.success('用户创建成功')
      setCreateOpen(false); createForm.resetFields(); fetchUsers()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
    } finally { setCreateLoading(false) }
  }

  const openRolesModal = async (user: UserRead) => {
    setCurrentUser(user)
    try {
      const [allRolesData, userRolesData] = await Promise.all([listAllRoles(), getUserRoles(user.id)])
      setAllRoles(allRolesData)
      const assigned = userRolesData.flatMap((ur) => ur.roles?.map((r) => r.id) ?? [])
      setSelectedRoleIds([...new Set(assigned)])
    } catch { /* handled */ }
    setRolesOpen(true)
  }

  const handleRolesSubmit = async () => {
    if (!currentUser) return
    setRolesLoading(true)
    try {
      await assignUserRoles(currentUser.id, selectedRoleIds)
      message.success('角色分配成功')
      setRolesOpen(false); fetchUsers()
    } catch { /* handled */ } finally { setRolesLoading(false) }
  }

  const handleDelete = async (user: UserRead) => {
    try { await deleteUser(user.id); message.success('用户已删除'); fetchUsers() } catch { /* handled */ }
  }

  const columns: ColumnsType<UserRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70, render: (v: number) => <Text type="secondary">#{v}</Text> },
    {
      title: '用户名', dataIndex: 'username', key: 'username', width: 140,
      render: (v: string, r: UserRead) => (
        <Space>
          <Badge status={r.is_active ? 'success' : 'default'} />
          <Text strong>{v}</Text>
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => (
        <Tag icon={v ? <CheckCircleOutlined /> : <StopOutlined />} color={v ? 'success' : 'error'}>
          {v ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作', key: 'actions', width: 220,
      render: (_: unknown, record: UserRead) => (
        <Space>
          <Button icon={<TeamOutlined />} size="small" onClick={() => openRolesModal(record)}>分配角色</Button>
          <Popconfirm title="确定删除此用户？" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* ===== 页面头部 ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea22 0%, #764ba222 100%)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 20,
        border: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}><UserOutlined style={{ marginRight: 8 }} />用户管理</Title>
            <Text type="secondary">管理平台用户账号，包括创建、查询、角色分配等操作</Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            创建用户
          </Button>
        </div>
      </div>

      {/* ===== 统计卡片 ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="用户总数" value={total} prefix={<UserOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="已启用" value={activeCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${total}`} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="已禁用" value={inactiveCount} prefix={<StopOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="关联角色" value={allRoles.length} prefix={<IdcardOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* ===== 搜索 + 表格卡片 ===== */}
      <Card
        title={<Space><SearchOutlined />筛选查询</Space>}
        extra={<Button icon={<ReloadOutlined />} onClick={fetchUsers}>刷新</Button>}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索用户名或邮箱..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            allowClear
            style={{ maxWidth: 360 }}
            enterButton
          />
        </div>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条用户记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      {/* ===== 创建用户弹窗 ===== */}
      <Modal title="创建用户" open={createOpen} onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); createForm.resetFields() }} confirmLoading={createLoading} destroyOnClose>
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true }, { type: 'email' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 分配角色弹窗 ===== */}
      <Modal title={`分配角色 — ${currentUser?.username ?? ''}`} open={rolesOpen} onOk={handleRolesSubmit}
        onCancel={() => setRolesOpen(false)} confirmLoading={rolesLoading} width={620} destroyOnClose>
        <div style={{ marginTop: 16 }}>
          <Transfer
            dataSource={allRoles.map((r) => ({ key: r.id, title: r.name, description: r.code }))}
            targetKeys={selectedRoleIds}
            onChange={(keys) => setSelectedRoleIds(keys as number[])}
            render={(item) => `${item.title} (${item.description})`}
            listStyle={{ width: 260, height: 380 }}
            showSearch
            filterOption={(inputValue, item) =>
              item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
              item.description.toLowerCase().includes(inputValue.toLowerCase())
            }
            locale={{ itemUnit: '个角色', itemsUnit: '个角色', searchPlaceholder: '搜索角色', notFoundContent: '无数据' }}
          />
        </div>
      </Modal>
    </div>
  )
}

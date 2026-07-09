import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Tag, Transfer, message, Typography, Popconfirm,
} from 'antd'
import { PlusOutlined, TeamOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listUsers, createUser, getUserRoles, assignUserRoles, deleteUser } from '../../api/users'
import { listAllRoles } from '../../api/roles'
import type { UserRead, UserCreate, RoleRead, UserWithRolesRead } from '../../types'

const { Title } = Typography

export default function UserListPage() {
  const [users, setUsers] = useState<UserRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createForm] = Form.useForm()

  // Role assignment modal
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
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ---------- Create user ----------
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      setCreateLoading(true)
      await createUser(values as UserCreate)
      message.success('用户创建成功')
      setCreateOpen(false)
      createForm.resetFields()
      fetchUsers()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return // form validation
    } finally {
      setCreateLoading(false)
    }
  }

  // ---------- Role assignment ----------
  const openRolesModal = async (user: UserRead) => {
    setCurrentUser(user)
    try {
      const [allRolesData, userRolesData] = await Promise.all([
        listAllRoles(),
        getUserRoles(user.id),
      ])
      setAllRoles(allRolesData)
      // UserWithRolesRead has roles: RoleRead[], extract their ids
      const assigned = userRolesData.flatMap((ur: UserWithRolesRead) => ur.roles?.map((r) => r.id) ?? [])
      setSelectedRoleIds([...new Set(assigned)])
    } catch {
      // handled
    }
    setRolesOpen(true)
  }

  const handleRolesSubmit = async () => {
    if (!currentUser) return
    setRolesLoading(true)
    try {
      await assignUserRoles(currentUser.id, selectedRoleIds)
      message.success('角色分配成功')
      setRolesOpen(false)
      fetchUsers()
    } catch {
      // handled
    } finally {
      setRolesLoading(false)
    }
  }

  // ---------- Delete ----------
  const handleDelete = async (user: UserRead) => {
    try {
      await deleteUser(user.id)
      message.success('用户已删除')
      fetchUsers()
    } catch {
      // handled
    }
  }

  // ---------- Columns ----------
  const columns: ColumnsType<UserRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: UserRead) => (
        <Space>
          <Button
            icon={<TeamOutlined />}
            size="small"
            onClick={() => openRolesModal(record)}
          >
            分配角色
          </Button>
          <Popconfirm
            title="确定删除此用户？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>用户管理</Title>
        <Space>
          <Input
            placeholder="搜索用户名/邮箱"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            allowClear
            style={{ width: 240 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            创建用户
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />

      {/* ====== Create Modal ====== */}
      <Modal
        title="创建用户"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        confirmLoading={createLoading}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' },
          ]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ====== Role Assignment Modal ====== */}
      <Modal
        title={`分配角色 - ${currentUser?.username ?? ''}`}
        open={rolesOpen}
        onOk={handleRolesSubmit}
        onCancel={() => setRolesOpen(false)}
        confirmLoading={rolesLoading}
        width={600}
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          <Transfer
            dataSource={allRoles.map((r) => ({ key: r.id, title: r.name, description: r.code }))}
            targetKeys={selectedRoleIds}
            onChange={(keys) => setSelectedRoleIds(keys as number[])}
            render={(item) => `${item.title} (${item.description})`}
            listStyle={{ width: 250, height: 360 }}
            showSearch
            filterOption={(inputValue, item) =>
              item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
              item.description.toLowerCase().includes(inputValue.toLowerCase())
            }
            oneWay={false}
            locale={{
              itemUnit: '个角色',
              itemsUnit: '个角色',
              searchPlaceholder: '搜索角色',
              notFoundContent: '无数据',
            }}
          />
        </div>
      </Modal>
    </div>
  )
}

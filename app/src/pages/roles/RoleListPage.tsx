import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, Checkbox, message, Typography, Popconfirm, Tag,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SafetyCertificateOutlined,
  SearchOutlined, ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listRoles, createRole, updateRole, deleteRole, assignRolePermissions, getRole } from '../../api/roles'
import { listAllPermissions } from '../../api/permissions'
import type { RoleRead, RoleCreate, RoleUpdate, PermissionRead } from '../../types'

const { Title } = Typography

export default function RoleListPage() {
  const [roles, setRoles] = useState<RoleRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  // Create / Edit modal
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleRead | null>(null)
  const [roleForm] = Form.useForm()

  // Permission assignment modal
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
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // ---------- Create ----------
  const openCreate = () => {
    setEditingRole(null)
    roleForm.resetFields()
    setFormOpen(true)
  }

  // ---------- Edit ----------
  const openEdit = (role: RoleRead) => {
    setEditingRole(role)
    roleForm.setFieldsValue({ name: role.name, description: role.description })
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await roleForm.validateFields()
      setFormLoading(true)
      if (editingRole) {
        await updateRole(editingRole.id, values as RoleUpdate)
        message.success('角色更新成功')
      } else {
        await createRole(values as RoleCreate)
        message.success('角色创建成功')
      }
      setFormOpen(false)
      roleForm.resetFields()
      fetchRoles()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
    } finally {
      setFormLoading(false)
    }
  }

  // ---------- Delete ----------
  const handleDelete = async (role: RoleRead) => {
    try {
      await deleteRole(role.id)
      message.success('角色已删除')
      fetchRoles()
    } catch {
      // handled
    }
  }

  // ---------- Permission assignment ----------
  const openPermModal = async (role: RoleRead) => {
    setPermRole(role)
    try {
      const [allPerms] = await Promise.all([listAllPermissions()])
      setAllPermissions(allPerms)
      // The /api/v1/roles/{id} includes permissions; if using list, we may not have perms.
      // But getRole(role.id) gives us the full permission list.
      // Use the role's permissions field if available, otherwise fetch
      if (role.permissions) {
        setCheckedPermIds(role.permissions.map((p) => p.id))
      } else {
        const fullRole = await getRole(role.id)
        setCheckedPermIds((fullRole.permissions ?? []).map((p) => p.id))
      }
    } catch {
      // handled
    }
    setPermOpen(true)
  }

  const handlePermSubmit = async () => {
    if (!permRole) return
    setPermLoading(true)
    try {
      await assignRolePermissions(permRole.id, { permission_ids: checkedPermIds })
      message.success('权限分配成功')
      setPermOpen(false)
      fetchRoles()
    } catch {
      // handled
    } finally {
      setPermLoading(false)
    }
  }

  // ---------- Columns ----------
  const columns: ColumnsType<RoleRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null) => v || <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '关联权限',
      key: 'permCount',
      width: 120,
      render: (_: unknown, record: RoleRead) => (
        <Tag color="blue">{record.permissions?.length ?? 0} 个权限</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: RoleRead) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            icon={<SafetyCertificateOutlined />}
            size="small"
            onClick={() => openPermModal(record)}
          >
            分配权限
          </Button>
          <Popconfirm
            title="确定删除此角色？"
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
        <Title level={4} style={{ margin: 0 }}>角色管理</Title>
        <Space>
          <Input
            placeholder="搜索编码/名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            allowClear
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchRoles}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            创建角色
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
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

      {/* ====== Create/Edit Modal ====== */}
      <Modal
        title={editingRole ? '编辑角色' : '创建角色'}
        open={formOpen}
        onOk={handleFormSubmit}
        onCancel={() => {
          setFormOpen(false)
          roleForm.resetFields()
        }}
        confirmLoading={formLoading}
        destroyOnClose
      >
        <Form form={roleForm} layout="vertical" style={{ marginTop: 16 }}>
          {!editingRole && (
            <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入角色编码' }]}>
              <Input placeholder="如 admin, editor" />
            </Form.Item>
          )}
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="如 管理员" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="角色描述（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ====== Permission Assignment Modal ====== */}
      <Modal
        title={`分配权限 - ${permRole?.name ?? ''}`}
        open={permOpen}
        onOk={handlePermSubmit}
        onCancel={() => setPermOpen(false)}
        confirmLoading={permLoading}
        width={640}
        destroyOnClose
      >
        <div style={{ marginTop: 16, maxHeight: 420, overflow: 'auto' }}>
          <Checkbox.Group
            value={checkedPermIds}
            onChange={(values) => setCheckedPermIds(values as number[])}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {allPermissions.map((perm) => (
                <Checkbox key={perm.id} value={perm.id}>
                  <Space>
                    <Tag color="purple">{perm.code}</Tag>
                    <span>{perm.name}</span>
                    {perm.description && (
                      <span style={{ color: '#999', fontSize: 12 }}>({perm.description})</span>
                    )}
                  </Space>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
          {allPermissions.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无权限数据</div>
          )}
        </div>
      </Modal>
    </div>
  )
}

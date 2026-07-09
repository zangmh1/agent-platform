import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Space, Input, Modal, Form, message, Typography, Popconfirm, Tag,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { listPermissions, createPermission, updatePermission, deletePermission } from '../../api/permissions'
import type { PermissionRead, PermissionCreate, PermissionUpdate } from '../../types'

const { Title } = Typography

export default function PermissionListPage() {
  const [permissions, setPermissions] = useState<PermissionRead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  // Create / Edit modal
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
    } catch {
      // handled
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // ---------- Create ----------
  const openCreate = () => {
    setEditingPerm(null)
    permForm.resetFields()
    setFormOpen(true)
  }

  // ---------- Edit ----------
  const openEdit = (perm: PermissionRead) => {
    setEditingPerm(perm)
    permForm.setFieldsValue({ name: perm.name, description: perm.description })
    setFormOpen(true)
  }

  const handleFormSubmit = async () => {
    try {
      const values = await permForm.validateFields()
      setFormLoading(true)
      if (editingPerm) {
        await updatePermission(editingPerm.id, values as PermissionUpdate)
        message.success('权限更新成功')
      } else {
        await createPermission(values as PermissionCreate)
        message.success('权限创建成功')
      }
      setFormOpen(false)
      permForm.resetFields()
      fetchPermissions()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
    } finally {
      setFormLoading(false)
    }
  }

  // ---------- Delete ----------
  const handleDelete = async (perm: PermissionRead) => {
    try {
      await deletePermission(perm.id)
      message.success('权限已删除')
      fetchPermissions()
    } catch {
      // handled
    }
  }

  // ---------- Columns ----------
  const columns: ColumnsType<PermissionRead> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: '权限编码',
      dataIndex: 'code',
      key: 'code',
      render: (v: string) => <Tag color="purple">{v}</Tag>,
    },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null) => v || <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: PermissionRead) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此权限？"
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
        <Title level={4} style={{ margin: 0 }}>权限管理</Title>
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
          <Button icon={<ReloadOutlined />} onClick={fetchPermissions}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            创建权限
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={permissions}
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
        title={editingPerm ? '编辑权限' : '创建权限'}
        open={formOpen}
        onOk={handleFormSubmit}
        onCancel={() => {
          setFormOpen(false)
          permForm.resetFields()
        }}
        confirmLoading={formLoading}
        destroyOnClose
      >
        <Form form={permForm} layout="vertical" style={{ marginTop: 16 }}>
          {!editingPerm && (
            <Form.Item name="code" label="权限编码" rules={[{ required: true, message: '请输入权限编码' }]}>
              <Input placeholder="如 user:list, role:create" />
            </Form.Item>
          )}
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入权限名称' }]}>
            <Input placeholder="如 用户列表" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="权限描述（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

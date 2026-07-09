import { Card, Col, Row, Typography, Tag, Alert } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ApiOutlined,
  BlockOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ToolOutlined,
  RobotOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/auth'

const { Title, Paragraph, Text } = Typography

interface ModuleCard {
  title: string
  desc: string
  icon: React.ReactNode
  tag?: string
}

const sysModules: ModuleCard[] = [
  {
    title: '用户管理',
    desc: '注册、查询、分页搜索、角色分配',
    icon: <UserOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
  },
  {
    title: '角色管理',
    desc: 'CRUD、权限分配、分页搜索',
    icon: <TeamOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
  },
  {
    title: '权限管理',
    desc: 'CRUD、分页搜索、RBAC 鉴权',
    icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
  },
]

const agentModules: ModuleCard[] = [
  {
    title: '模型供应商',
    desc: '完整的分层架构流程（Model→Schema→Repo→Service→API）、BaseModel 继承、依赖注入、统一响应格式',
    icon: <ApiOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
    tag: '核心',
  },
  {
    title: '模型管理',
    desc: 'ForeignKey 外键关联、relationship 自动加载、逗号分隔字符串与列表的转换、_to_read 手动映射模式',
    icon: <BlockOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
  },
  {
    title: 'Prompt 管理',
    desc: '版本快照设计模式（主表+版本表）、JSON 字段存储灵活数据、发布/回滚流程、版本号递增',
    icon: <FileTextOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
  },
  {
    title: '知识库管理',
    desc: '三层父子关系、cascade 级联删除、冗余计数字段维护、文件上传（UploadFile）、异步处理概念',
    icon: <DatabaseOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
  },
  {
    title: '工具管理',
    desc: 'JSON 存储灵活配置、OpenAI Function Calling 格式、启用/禁用状态机、工具测试',
    icon: <ToolOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
  },
  {
    title: 'Agent 管理',
    desc: '聚合根设计、JSON 存储复杂配置、生命周期状态机（draft→active→inactive→error）、版本管理复用',
    icon: <RobotOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
    tag: '核心',
  },
  {
    title: '对话日志与统计',
    desc: '只读查询模块设计、一对一关系（标注）、链路追踪 JSON 存储、SQL 聚合统计（GROUP BY、SUM、AVG）',
    icon: <LineChartOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />,
  },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={3}>欢迎回来，{user?.username || '用户'}</Title>
        <Paragraph type="secondary">
          Agent Platform — 面向企业的大模型与智能体（Agent）集成管理平台，提供从模型接入到 Agent 编排的完整基础设施。
        </Paragraph>
      </div>

      {/* ===== 系统管理（已完成） ===== */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          <SettingOutlined style={{ marginRight: 8 }} />
          系统管理
          <Tag color="green" style={{ marginLeft: 8 }}>已完成</Tag>
        </Title>
        <Row gutter={[16, 16]}>
          {sysModules.map((mod) => (
            <Col xs={24} sm={8} key={mod.title}>
              <Card hoverable size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {mod.icon}
                  <div>
                    <Text strong>{mod.title}</Text>
                    <div><Text type="secondary" style={{ fontSize: 12 }}>{mod.desc}</Text></div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* ===== Agent 平台（待开发） ===== */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          <RobotOutlined style={{ marginRight: 8 }} />
          Agent 平台
          <Tag color="orange" style={{ marginLeft: 8 }}>待开发</Tag>
        </Title>

        <Alert
          message="以下模块为后续开发的 Agent 平台核心功能，各卡片标注了对应模块的核心知识点，待后端 API 完成后逐步实现前端页面。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]}>
          {agentModules.map((mod) => (
            <Col xs={24} sm={12} xl={8} key={mod.title} style={{ minWidth: 280 }}>
              <Card hoverable size="small" style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>{mod.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 4 }}>
                      <Text strong>{mod.title}</Text>
                      {mod.tag && <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>{mod.tag}</Tag>}
                    </div>
                    <div><Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>{mod.desc}</Text></div>
                  </div>
                  <ClockCircleOutlined style={{ fontSize: 14, color: '#faad14', flexShrink: 0, marginTop: 4 }} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}

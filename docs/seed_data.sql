-- ============================================================
-- 晨光 Agent Platform — 样例数据
-- 生成日期: 2026-07-12
-- 执行方式:
--   mysql -u root -p123456 -h 127.0.0.1 -P 3306 chenguang < docs/seed_data.sql
-- ============================================================

-- ============================================================
-- 1. users — 系统用户
-- ============================================================
INSERT INTO users (username, email, hashed_password, is_active, is_superuser, last_login) VALUES
('admin',     'admin@chenguang.com',     '$2b$12$LJ3m4ys3MggIkF0O1LmZqu6fS6gC7HxVx5Jz8kK0Pq3WyNtRbX9a', 1, 1, '2026-07-12 09:15:00'),
('zhangsan',  'zhangsan@chenguang.com',  '$2b$12$LJ3m4ys3MggIkF0O1LmZqu6fS6gC7HxVx5Jz8kK0Pq3WyNtRbX9a', 1, 0, '2026-07-12 08:30:00'),
('lisi',      'lisi@chenguang.com',      '$2b$12$LJ3m4ys3MggIkF0O1LmZqu6fS6gC7HxVx5Jz8kK0Pq3WyNtRbX9a', 1, 0, '2026-07-11 17:45:00'),
('wangwu',    'wangwu@chenguang.com',    '$2b$12$LJ3m4ys3MggIkF0O1LmZqu6fS6gC7HxVx5Jz8kK0Pq3WyNtRbX9a', 0, 0, NULL);

-- ============================================================
-- 2. roles — 角色定义
-- ============================================================
INSERT INTO roles (code, name, description) VALUES
('super_admin', '超级管理员', '拥有系统所有权限'),
('admin',       '管理员',     '管理系统配置和用户'),
('editor',      '编辑者',     '创建和编辑 Agent、Prompt、知识库等内容'),
('viewer',      '只读用户',   '仅可查看已有资源');

-- ============================================================
-- 3. user_roles — 用户-角色关联
-- ============================================================
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),  -- admin → 超级管理员
(2, 2),  -- zhangsan → 管理员
(3, 3),  -- lisi → 编辑者
(4, 4);  -- wangwu → 只读用户

-- ============================================================
-- 4. permissions — 权限定义
-- ============================================================
INSERT INTO permissions (code, name, description) VALUES
('user:read',    '查看用户',   '查看用户列表和详情'),
('user:write',   '管理用户',   '创建、编辑、禁用用户'),
('role:read',    '查看角色',   '查看角色和权限'),
('role:write',   '管理角色',   '创建、编辑、删除角色并分配权限'),
('agent:read',   '查看Agent',  '查看 Agent 列表和详情'),
('agent:write',  '管理Agent',  '创建、编辑、发布、删除 Agent'),
('model:read',   '查看模型',   '查看模型和供应商信息'),
('model:write',  '管理模型',   '添加、编辑模型配置'),
('prompt:read',  '查看Prompt', '查看 Prompt 模板'),
('prompt:write', '管理Prompt', '创建、编辑 Prompt 模板'),
('kb:read',      '查看知识库', '查看知识库和文档'),
('kb:write',     '管理知识库', '创建、管理知识库和文档'),
('tool:read',    '查看工具',   '查看工具列表'),
('tool:write',   '管理工具',   '创建、配置工具');

-- ============================================================
-- 5. role_permissions — 角色-权限关联
-- ============================================================
-- super_admin: 所有权限
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
(1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14);

-- admin: 除 super_admin 专属外的管理权限
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 1), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
(2, 8), (2, 9), (2, 10), (2, 11), (2, 12), (2, 13), (2, 14);

-- editor: 读写内容相关
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 5), (3, 6), (3, 9), (3, 10), (3, 11), (3, 12), (3, 13), (3, 14);

-- viewer: 只读
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 1), (4, 3), (4, 5), (4, 7), (4, 9), (4, 11), (4, 13);

-- ============================================================
-- 6. model_providers — 模型供应商
-- ============================================================
INSERT INTO model_providers (name, type, status, endpoint, api_key, description) VALUES
('OpenAI',       'openai',    'connected',    'https://api.openai.com/v1',        'sk-encrypted-xxxxxxxxxxxx', 'OpenAI 官方 API 服务，提供 GPT-4、GPT-3.5 等模型'),
('Anthropic',    'anthropic', 'connected',    'https://api.anthropic.com',         'sk-ant-encrypted-xxxxxxxxx', 'Anthropic Claude 系列模型，擅长长文本和安全性'),
('阿里云百炼',   'aliyun',    'connected',    'https://dashscope.aliyuncs.com/api', 'sk-aliyun-encrypted-xxxxxx', '阿里云百炼平台，提供 Qwen 系列模型'),
('Azure OpenAI', 'azure',     'disconnected', 'https://myorg.openai.azure.com',    NULL,                         'Azure 托管的 OpenAI 服务（待配置）'),
('Ollama 本地',  'local',     'disconnected', 'http://localhost:11434',             NULL,                         '本地部署的 Ollama 开源模型服务');

-- ============================================================
-- 7. models — 模型列表（FK→model_providers）
-- ============================================================
INSERT INTO models (name, model_id, provider_id, capabilities, context_length, status, input_price, output_price, currency, is_default, description) VALUES
('GPT-4 Turbo',       'gpt-4-turbo',       1, 'function_call,vision,streaming', 128000, 'available', 0.010000, 0.030000, 'USD', 1, 'OpenAI 旗舰模型，支持多模态和函数调用'),
('GPT-4o',            'gpt-4o',            1, 'function_call,vision,streaming', 128000, 'available', 0.002500, 0.010000, 'USD', 0, 'OpenAI 最新多模态模型，性价比极高'),
('GPT-3.5 Turbo',     'gpt-3.5-turbo',     1, 'function_call,streaming',         16385, 'available', 0.000500, 0.001500, 'USD', 0, '轻量级模型，适合简单任务'),
('Claude Sonnet 5',   'claude-sonnet-5',   2, 'function_call,vision,streaming', 200000, 'available', 0.003000, 0.015000, 'USD', 1, 'Anthropic 中端模型，推理与成本平衡'),
('Claude Haiku 4.5',  'claude-haiku-4.5',  2, 'function_call,streaming',        200000, 'available', 0.000800, 0.004000, 'USD', 0, 'Anthropic 最快模型，适合高并发场景'),
('Claude Opus 4.8',   'claude-opus-4-8',   2, 'function_call,vision,streaming', 200000, 'rate_limited', 0.015000, 0.075000, 'USD', 0, 'Anthropic 旗舰模型，最强推理能力'),
('Qwen-Plus',         'qwen-plus',         3, 'function_call,streaming',        131072, 'available', 0.000570, 0.001710, 'USD', 0, '阿里通义千问增强版，中文能力优秀'),
('Qwen-Max',          'qwen-max',          3, 'function_call,streaming',         32768, 'available', 0.002850, 0.008550, 'USD', 0, '阿里通义千问旗舰模型');

-- ============================================================
-- 8. prompts — Prompt 模板
-- ============================================================
INSERT INTO prompts (name, description, category, tags, content, variables, version, status, created_by) VALUES
('客服系统提示词', '用于智能客服场景的系统提示词模板',
 'customer_service',
 '["客服", "对话", "客户支持"]',
 '你是一个专业、友好的客服助手，名为"{bot_name}"。\n\n背景信息:\n{context}\n\n请遵循以下原则:\n1. 始终保持礼貌和耐心\n2. 如果无法回答，诚实地告知用户并建议转人工\n3. 回答简洁明了，避免技术术语\n\n当前用户问题: {question}',
 '[{"name":"bot_name","type":"string","description":"客服机器人名称","default_value":"小晨","required":true},{"name":"context","type":"text","description":"背景知识和参考信息","default_value":null,"required":false},{"name":"question","type":"string","description":"用户当前问题","default_value":null,"required":true}]',
 'v1.0', 'published', 'admin'),

('代码审查提示词', '用于自动化代码审查的 Prompt',
 'code_review',
 '["代码", "审查", "开发"]',
 '你是一位资深代码审查专家。请对以下代码进行全面审查：\n\n```{language}\n{code}\n```\n\n请从以下维度评估：\n1. 代码正确性\n2. 性能优化建议\n3. 安全漏洞\n4. 可读性与维护性\n5. 最佳实践\n\n审查要求: {requirements}',
 '[{"name":"language","type":"string","description":"编程语言","default_value":"python","required":true},{"name":"code","type":"text","description":"待审查的代码","default_value":null,"required":true},{"name":"requirements","type":"text","description":"额外的审查要求","default_value":"请逐条列出问题和建议","required":false}]',
 'v2.1', 'published', 'zhangsan'),

('内容生成助手', '通用的文章/文案生成 Prompt',
 'content_generation',
 '["内容", "写作", "文案"]',
 '请以{role}的身份，{action}关于「{topic}」的{tone}{content_type}。\n\n要求:\n- 字数: {word_count}\n- 风格: {style}\n- 目标读者: {audience}\n\n{extra_instructions}',
 '[{"name":"role","type":"string","description":"身份角色，如营销专家、技术博主","default_value":"专业的内容创作者","required":true},{"name":"action","type":"string","description":"动作，如撰写/总结/翻译","default_value":"撰写","required":true},{"name":"topic","type":"string","description":"主题","default_value":null,"required":true},{"name":"tone","type":"string","description":"语气：专业的/轻松的/正式的/幽默的","default_value":"专业的","required":false},{"name":"content_type","type":"string","description":"内容类型：博文/推文/产品描述/邮件","default_value":"博文","required":true},{"name":"word_count","type":"number","description":"目标字数","default_value":"800","required":false},{"name":"style","type":"string","description":"写作风格","default_value":"清晰易读","required":false},{"name":"audience","type":"string","description":"目标读者","default_value":"普通读者","required":false},{"name":"extra_instructions","type":"text","description":"额外指示","default_value":null,"required":false}]',
 'v1.0', 'published', 'lisi'),

('数据分析提示词', '数据分析场景的 Prompt 模板',
 'data_analysis',
 '["数据", "分析", "报表"]',
 '你是一名数据分析师。请分析以下数据并给出洞察：\n\n数据:\n{data}\n\n分析目标: {goal}\n输出格式: {format}',
 '[{"name":"data","type":"text","description":"待分析的原始数据","default_value":null,"required":true},{"name":"goal","type":"string","description":"分析目标，如发现趋势/找异常/做预测","default_value":"全面分析","required":false},{"name":"format","type":"string","description":"输出格式：markdown/json/table","default_value":"markdown","required":false}]',
 'v1.0', 'draft', 'lisi');

-- ============================================================
-- 9. prompt_versions — Prompt 版本历史（FK→prompts）
-- ============================================================
INSERT INTO prompt_versions (prompt_id, version, content, changelog, is_current, published_by, published_at) VALUES
-- 客服提示词版本链
(1, 'v1.0', '你是一个专业的客服助手...（初版）', '初始版本', 1, 'admin',  '2026-06-01 10:00:00'),
-- 代码审查版本链
(2, 'v1.0', '你是一位代码审查专家...（初版）', '初始版本', 0, 'zhangsan', '2026-06-05 14:00:00'),
(2, 'v2.0', '增加安全漏洞检查维度', '新增安全检查维度，优化 prompt 结构', 0, 'zhangsan', '2026-06-20 09:30:00'),
(2, 'v2.1', '优化性能检查建议的输出格式', '修复性能建议输出格式问题', 1, 'zhangsan', '2026-07-01 16:00:00'),
-- 内容生成版本链
(3, 'v1.0', '请以{role}的身份...（初版）', '初始版本', 1, 'lisi', '2026-06-10 11:00:00');

-- ============================================================
-- 10. knowledge_bases — 知识库
-- ============================================================
INSERT INTO knowledge_bases (name, description, status, document_count, segment_count, embedding_model, created_by) VALUES
('产品使用手册',   '公司全线产品的使用说明和最佳实践', 'active',   3, 45, 'text-embedding-3-large', 'admin'),
('FAQ 常见问题',   '客户高频问题与标准答案库',        'active',   2, 30, 'text-embedding-3-large', 'zhangsan'),
('技术文档库',     '内部技术架构和API文档',           'building', 0,  0, 'text-embedding-3-large', 'lisi');

-- ============================================================
-- 11. documents — 知识库文档（FK→knowledge_bases）
-- ============================================================
INSERT INTO documents (knowledge_base_id, file_name, file_type, file_size, file_path, status, segment_count, word_count, uploaded_by) VALUES
-- 产品手册下的文档
(1, '智能客服产品指南_v2.3.pdf',  'pdf',  '2.4 MB', '/files/kb1/customer_service_guide.pdf',  'completed', 15, 8500,  'admin'),
(1, '数据分析平台使用手册.pdf',   'pdf',  '5.1 MB', '/files/kb1/analytics_platform_manual.pdf', 'completed', 20, 15200, 'admin'),
(1, '平台API快速入门.md',         'md',   '156 KB', '/files/kb1/api_quickstart.md',           'completed', 10, 4200,  'zhangsan'),
-- FAQ 下的文档
(2, '高频问题汇总_2026Q3.xlsx',   'xlsx', '890 KB', '/files/kb2/faq_2026q3.xlsx',             'completed', 18, 9600,  'zhangsan'),
(2, '故障排查手册.pdf',           'pdf',  '1.8 MB', '/files/kb2/troubleshooting.pdf',         'processing', 12, 6800, 'zhangsan'),
-- 技术文档库（刚创建，文档还在上传中）
(3, '微服务架构设计文档.docx',    'docx', '3.3 MB', '/files/kb3/microservice_arch.docx',      'pending',    0, 0,     'lisi');

-- ============================================================
-- 12. segments — 文档分段（FK→knowledge_bases, documents）
-- ============================================================
INSERT INTO segments (knowledge_base_id, document_id, position, content, word_count, token_count, keywords, hit_count) VALUES
-- 智能客服产品指南 分段 (doc_id=1)
(1, 1, 1, '智能客服系统是一款基于大语言模型的AI客服解决方案。它支持多渠道接入，包括网页、微信、APP等，能够7x24小时自动回答客户问题，大幅降低人工客服成本。', 42, 65, '["智能客服", "AI", "多渠道", "7x24"]', 128),
(1, 1, 2, '系统核心功能包括：智能问答（基于知识库的精准回复）、意图识别（自动判断客户意图并路由到对应流程）、情感分析（实时检测客户情绪，必要时转人工）、多轮对话（支持上下文记忆的连续对话）。', 55, 82, '["智能问答", "意图识别", "情感分析", "多轮对话"]', 96),
(1, 1, 3, '部署方式支持SaaS云服务和私有化部署两种。SaaS版开箱即用，按调用量计费；私有化部署适合对数据安全有严格要求的企业客户。', 35, 52, '["部署", "SaaS", "私有化", "数据安全"]', 73),
-- 数据分析平台 分段 (doc_id=2)
(1, 2, 1, '数据分析平台提供一站式数据处理能力。支持从多种数据源（MySQL、PostgreSQL、MongoDB、CSV文件等）导入数据，通过自然语言即可生成可视化报表。', 42, 65, '["数据分析", "数据源", "可视化", "自然语言"]', 84),
(1, 2, 2, '平台内置20+种图表类型，包括折线图、柱状图、饼图、散点图、热力图等。基于ECharts 5.0渲染引擎，支持暗黑模式和自定义主题。', 38, 60, '["图表", "ECharts", "暗黑模式", "自定义主题"]', 61),
-- FAQ 文档分段 (doc_id=4)
(2, 4, 1, 'Q: 如何重置密码？ A: 在登录页面点击"忘记密码"，输入注册邮箱后，系统会发送重置链接。该链接有效期为30分钟。若未收到邮件，请检查垃圾邮件箱或联系管理员。', 58, 90, '["密码重置", "忘记密码", "邮箱", "安全"]', 235),
(2, 4, 2, 'Q: API调用频率限制是多少？ A: 免费版：30次/分钟；专业版：300次/分钟；企业版：3000次/分钟。超出限制后将返回429状态码，建议在客户端实现指数退避重试策略。', 53, 85, '["API", "频率限制", "429", "退避重试"]', 189);

-- ============================================================
-- 13. tools — 工具定义
-- ============================================================
INSERT INTO tools (name, description, type, status, config, call_count_7d, success_rate, avg_latency, created_by) VALUES
('Web搜索', '基于搜索引擎的实时信息检索工具，支持网页、新闻、图片搜索',
 'search', 'active',
 '{"engine": "bing", "region": "zh-CN", "max_results": 10, "safe_search": "moderate", "timeout": 15}',
 1523, 98.50, 1200, 'admin'),

('代码执行器', '在沙箱环境中执行 Python/JavaScript 代码并返回结果，用于数据分析、图表生成等场景',
 'code_executor', 'active',
 '{"runtime": "python3.11", "sandbox": "gVisor", "max_execution_time": 30, "max_memory": "512MB", "allowed_packages": ["numpy", "pandas", "matplotlib", "requests"]}',
 856, 96.20, 3500, 'zhangsan'),

('天气查询', '查询全球城市实时天气和未来7天预报',
 'api', 'active',
 '{"provider": "openweathermap", "endpoint": "https://api.openweathermap.org/data/3.0", "cache_ttl": 1800, "units": "metric"}',
 432, 99.80, 800, 'lisi'),

('SQL查询工具', '连接数据库执行只读SQL查询，支持MySQL和PostgreSQL',
 'database', 'inactive',
 '{"max_rows": 1000, "query_timeout": 30, "allowed_tables": ["*"], "readonly": true}',
 0, 0, 0, 'admin'),

('邮件发送', '通过SMTP发送邮件，支持HTML模板和附件',
 'communication', 'active',
 '{"smtp_host": "smtp.chenguang.com", "smtp_port": 587, "max_recipients": 50, "max_attachment_size": "10MB", "use_tls": true}',
 2103, 99.10, 2500, 'admin');

-- ============================================================
-- 14. agents — 智能体（FK models.model_id）
-- ============================================================
INSERT INTO agents (name, description, type, status, model_id, config, success_rate, call_count_7d, version, created_by) VALUES
('智能客服Agent', '处理客户咨询和问题解答，支持多轮对话和情感分析',
 'conversation', 'active', 1,
 '{"model": {"modelId": "gpt-4-turbo", "temperature": 0.7, "maxTokens": 2048, "topP": 1.0}, "prompt": {"systemPrompt": "你是一个专业友好的客服助手", "promptTemplateId": 1, "suggestedQuestions": ["如何退货", "物流查询", "优惠活动"], "maxTurns": 20, "timeout": 30}, "tools": [{"toolId": 1, "enabled": true}, {"toolId": 5, "enabled": true}], "knowledgeBases": [{"kbId": 1, "weight": 0.8}, {"kbId": 2, "weight": 0.6}]}',
 94.50, 3521, 'v2.3', 'admin'),

('代码审查助手', '自动化代码审查，支持多种语言，输出详细评审报告',
 'analysis', 'active', 4,
 '{"model": {"modelId": "claude-sonnet-5", "temperature": 0.3, "maxTokens": 4096, "topP": 0.95}, "prompt": {"systemPrompt": "你是资深代码审查专家", "promptTemplateId": 2, "languages": ["python", "javascript", "go", "java", "rust"], "reviewDepth": "comprehensive", "timeout": 60}, "tools": [{"toolId": 2, "enabled": true}], "knowledgeBases": []}',
 91.80, 1204, 'v1.5', 'zhangsan'),

('内容创作助手', '生成营销文案、产品说明、社交媒体内容',
 'creative', 'active', 2,
 '{"model": {"modelId": "gpt-4o", "temperature": 0.9, "maxTokens": 4096, "topP": 0.95}, "prompt": {"systemPrompt": "你是专业内容创作者", "promptTemplateId": 3, "contentTypes": ["blog", "social_media", "product_desc", "email"], "style": "professional", "timeout": 45}, "tools": [{"toolId": 1, "enabled": true}], "knowledgeBases": [{"kbId": 1, "weight": 0.5}]}',
 88.30, 896, 'v1.2', 'lisi'),

('数据分析Agent', '自然语言驱动的数据分析，自动生成图表和洞察报告',
 'analysis', 'draft', 7,
 '{"model": {"modelId": "qwen-plus", "temperature": 0.2, "maxTokens": 8192, "topP": 0.9}, "prompt": {"systemPrompt": "你是专业数据分析师", "promptTemplateId": 4, "timeout": 120}, "tools": [{"toolId": 2, "enabled": true}, {"toolId": 4, "enabled": true}], "knowledgeBases": []}',
 0, 0, 'v0.1', 'zhangsan'),

('多任务编排Agent', '根据用户意图自动编排和调度多个子Agent协同工作',
 'workflow', 'draft', NULL,
 '{"model": null, "prompt": {"systemPrompt": "你是任务编排器", "timeout": 60}, "tools": [], "subAgents": [], "routingRules": {"intent_classification": "llm", "fallback": "智能客服Agent"}}',
 0, 0, 'v0.1', 'admin');

-- ============================================================
-- 15. agent_versions — Agent 版本历史（FK→agents）
-- ============================================================
INSERT INTO agent_versions (agent_id, version, config, changelog, is_current, published_by, published_at) VALUES
-- 智能客服版本链
(1, 'v1.0', '{"model": {"modelId": "gpt-3.5-turbo", "temperature": 0.8, "maxTokens": 1024}}', '初始版本，使用 GPT-3.5', 0, 'admin',  '2026-05-10 09:00:00'),
(1, 'v2.0', '{"model": {"modelId": "gpt-4-turbo", "temperature": 0.7, "maxTokens": 2048}, "tools": [{"toolId": 1}]}', '升级到 GPT-4 Turbo，接入 Web 搜索工具', 0, 'admin',  '2026-06-15 14:00:00'),
(1, 'v2.3', '{"model": {"modelId": "gpt-4-turbo", "temperature": 0.7, "maxTokens": 2048}, "tools": [{"toolId": 1}, {"toolId": 5}], "knowledgeBases": [{"kbId": 1}, {"kbId": 2}]}', '接入知识库，增加邮件工具支持，优化多轮对话逻辑', 1, 'admin',  '2026-07-08 10:30:00'),
-- 代码审查版本链
(2, 'v1.0', '{"model": {"modelId": "claude-haiku-4.5", "temperature": 0.5, "maxTokens": 2048}}', '初始版本', 0, 'zhangsan', '2026-06-01 11:00:00'),
(2, 'v1.5', '{"model": {"modelId": "claude-sonnet-5", "temperature": 0.3, "maxTokens": 4096}, "tools": [{"toolId": 2}]}', '升级模型到 Sonnet 5，接入代码执行器以便验证安全漏洞', 1, 'zhangsan', '2026-07-05 16:00:00'),
-- 内容创作版本链
(3, 'v1.0', '{"model": {"modelId": "gpt-4-turbo", "temperature": 0.9, "maxTokens": 4096}}', '初始版本', 0, 'lisi', '2026-06-10 14:00:00'),
(3, 'v1.2', '{"model": {"modelId": "gpt-4o", "temperature": 0.9, "maxTokens": 4096}, "tools": [{"toolId": 1}], "knowledgeBases": [{"kbId": 1}]}', '切换到 GPT-4o 以降低成本，接入搜索和产品知识库', 1, 'lisi', '2026-07-03 09:00:00');

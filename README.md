# AI Schedule MCP Tool

一个基于MCP协议的智能定时任务调度工具，专为IDE环境设计，能够自动化驱动AI Agent完成各种开发任务。

## 🚀 项目概述

AI Schedule MCP Tool 解决了开发者需要手动触发重复性任务的痛点，通过智能调度和Agent协作，提升开发效率和代码质量。目标是成为开发团队不可或缺的自动化助手。

## ✨ 核心功能

### 📋 任务调度中心
- 任务列表展示与状态监控
- 快速创建任务入口
- 批量操作和搜索功能
- 实时执行状态监控

### ⚙️ 任务配置页面
- Cron表达式定时设置
- Agent选择与参数配置
- 执行环境配置
- 自然语言描述的灵活定时配置

### 🔄 Agent工作流管理
- 工作流模板库
- 可视化流程编辑器
- Agent能力配置
- 预置常用工作流模板（代码检查、自动测试、部署等）

### 📊 执行监控面板
- 实时执行日志
- 性能指标监控
- 告警中心
- CPU、内存使用情况统计

### 🛠️ 系统设置页面
- MCP协议配置
- IDE集成设置
- 通知偏好管理
- 团队权限管理

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式框架**: Tailwind CSS 3
- **路由管理**: React Router DOM 7
- **状态管理**: Zustand 5
- **图标库**: Lucide React
- **代码规范**: ESLint + TypeScript ESLint
- **工具库**: clsx, tailwind-merge

## 📦 安装与运行

### 环境要求
- Node.js >= 18.0.0
- npm 或 pnpm

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 开发环境运行
```bash
npm run dev
# 或
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

### 构建生产版本
```bash
npm run build
# 或
pnpm build
```

### 代码检查
```bash
npm run lint
# 或
pnpm lint
```

### 类型检查
```bash
npm run check
# 或
pnpm check
```

## 📁 项目结构

```
aischedule/
├── .trae/
│   └── documents/           # 产品需求文档
├── public/                  # 静态资源
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Empty.tsx       # 空状态组件
│   │   └── Layout/         # 布局组件
│   ├── hooks/              # 自定义Hooks
│   │   └── useTheme.ts     # 主题管理Hook
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数
│   ├── pages/              # 页面组件
│   │   ├── Dashboard.tsx   # 任务调度中心
│   │   ├── Home.tsx        # 首页
│   │   ├── Monitor.tsx     # 执行监控面板
│   │   ├── Settings.tsx    # 系统设置
│   │   ├── TaskConfig.tsx  # 任务配置
│   │   └── Workflows.tsx   # Agent工作流管理
│   ├── store/              # 状态管理
│   │   └── index.ts        # Zustand store
│   ├── App.tsx             # 应用主组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── package.json            # 项目配置
├── tailwind.config.js      # Tailwind配置
├── tsconfig.json           # TypeScript配置
└── vite.config.ts          # Vite配置
```

## 🎨 设计规范

### 色彩主题
- **主色调**: 深蓝色 (#1e3a8a)
- **辅助色**: 浅蓝色 (#3b82f6)
- **布局风格**: 卡片式布局，左侧导航栏，顶部工具栏

### 字体规范
- **主要字体**: Inter
- **代码字体**: JetBrains Mono
- **标题**: 16px
- **正文**: 14px

### 图标风格
- 使用 Lucide 图标库
- 简洁线性风格
- 支持主题色彩适配

## 🔧 开发规范

### 代码风格
- 使用 TypeScript 确保类型安全
- 遵循 ESLint 规则
- 组件保持单一职责
- 使用 Tailwind CSS 进行样式开发

### 组件规范
- 组件文件使用 PascalCase 命名
- 保持组件小于 200 行代码
- 提取可复用逻辑到自定义 Hooks
- 使用 TypeScript 接口定义 Props

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: [GitHub Issues](https://github.com/your-username/aischedule/issues)
- 邮箱: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

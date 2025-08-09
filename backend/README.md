# AI Schedule MCP Tool - Backend

AI Schedule MCP Tool 的 Golang 后端服务，提供定时任务调度、Agent 工作流管理、MCP 协议通信等核心功能。

## 🚀 功能特性

### 核心功能
- **任务调度系统**: 基于 Cron 表达式的定时任务调度
- **Agent 工作流引擎**: 支持多种类型的 Agent 任务执行
- **MCP 协议集成**: 与 IDE 和其他工具的无缝集成
- **实时监控**: WebSocket 实时推送执行状态和日志
- **执行日志管理**: 详细的任务执行记录和性能指标

### 任务类型支持
- **脚本任务**: 执行 Shell 脚本、Python 脚本等
- **API 任务**: HTTP API 调用和数据处理
- **工作流任务**: 复杂的多步骤工作流执行
- **Agent 任务**: 自定义 Agent 执行逻辑

## 🛠 技术栈

- **语言**: Go 1.21+
- **Web 框架**: Gin
- **数据库**: MongoDB
- **缓存**: Redis (可选)
- **任务调度**: robfig/cron
- **WebSocket**: gorilla/websocket
- **容器化**: Docker & Docker Compose

## 📦 项目结构

```
backend/
├── main.go                     # 应用入口
├── go.mod                      # Go 模块文件
├── go.sum                      # 依赖锁定文件
├── .env.example                # 环境变量示例
├── Dockerfile                  # Docker 构建文件
├── docker-compose.yml          # Docker Compose 配置
├── internal/                   # 内部包
│   ├── config/                 # 配置管理
│   │   └── config.go
│   ├── database/               # 数据库连接
│   │   └── mongodb.go
│   ├── models/                 # 数据模型
│   │   ├── task.go
│   │   ├── workflow.go
│   │   └── execution_log.go
│   ├── router/                 # 路由配置
│   │   └── router.go
│   ├── middleware/             # 中间件
│   │   ├── logger.go
│   │   └── error.go
│   ├── handlers/               # 请求处理器
│   │   ├── task.go
│   │   ├── workflow.go
│   │   ├── execution_log.go
│   │   └── system.go
│   ├── scheduler/              # 任务调度器
│   │   └── scheduler.go
│   ├── executor/               # 任务执行器
│   │   └── task_executor.go
│   └── websocket/              # WebSocket 管理
│       └── manager.go
└── scripts/                    # 脚本文件
    └── init-mongo.js           # MongoDB 初始化脚本
```

## 🚀 快速开始

### 环境要求

- Go 1.21 或更高版本
- MongoDB 4.4 或更高版本
- Redis 6.0 或更高版本 (可选)
- Docker & Docker Compose (推荐)

### 使用 Docker Compose (推荐)

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd aischedule/backend
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，修改相关配置
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **查看服务状态**
   ```bash
   docker-compose ps
   ```

### 本地开发

1. **安装依赖**
   ```bash
   go mod download
   ```

2. **启动 MongoDB**
   ```bash
   # 使用 Docker 启动 MongoDB
   docker run -d --name mongodb -p 27017:27017 \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=password123 \
     mongo:7.0
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```

4. **运行应用**
   ```bash
   go run main.go
   ```

## 📚 API 文档

### 健康检查
```
GET /api/health
```

### 任务管理
```
GET    /api/tasks              # 获取任务列表
POST   /api/tasks              # 创建任务
GET    /api/tasks/:id          # 获取单个任务
PUT    /api/tasks/:id          # 更新任务
DELETE /api/tasks/:id          # 删除任务
POST   /api/tasks/:id/start    # 启动任务
POST   /api/tasks/:id/stop     # 停止任务
POST   /api/tasks/:id/execute  # 立即执行任务
```

### 工作流管理
```
GET    /api/workflows              # 获取工作流列表
POST   /api/workflows              # 创建工作流
GET    /api/workflows/:id          # 获取单个工作流
PUT    /api/workflows/:id          # 更新工作流
DELETE /api/workflows/:id          # 删除工作流
POST   /api/workflows/:id/execute  # 执行工作流
POST   /api/workflows/:id/stop     # 停止工作流
```

### 执行日志
```
GET    /api/execution-logs         # 获取执行日志列表
GET    /api/execution-logs/:id     # 获取单个执行日志
GET    /api/execution-logs/stats   # 获取执行统计
```

### 系统管理
```
GET    /api/system/info            # 获取系统信息
GET    /api/system/metrics         # 获取系统指标
POST   /api/system/scheduler/start # 启动调度器
POST   /api/system/scheduler/stop  # 停止调度器
```

### WebSocket
```
WS     /ws                         # WebSocket 连接
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `SERVER_PORT` | 服务器端口 | `8080` |
| `SERVER_HOST` | 服务器主机 | `localhost` |
| `MONGODB_URI` | MongoDB 连接字符串 | `mongodb://localhost:27017` |
| `MONGODB_DATABASE` | MongoDB 数据库名 | `aischedule` |
| `JWT_SECRET` | JWT 密钥 | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `24h` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `CORS_ALLOWED_ORIGINS` | CORS 允许的源 | `*` |

### 任务配置示例

#### 脚本任务
```json
{
  "name": "数据备份任务",
  "description": "每日数据备份",
  "type": "script",
  "cron_expression": "0 0 2 * * *",
  "agent_config": {
    "script": {
      "command": "bash",
      "args": ["/scripts/backup.sh"]
    }
  },
  "environment": {
    "BACKUP_PATH": "/data/backup"
  },
  "resource_limits": {
    "cpu": "500m",
    "memory": "256Mi",
    "timeout": 3600
  }
}
```

#### API 任务
```json
{
  "name": "健康检查任务",
  "description": "定期检查服务健康状态",
  "type": "api",
  "cron_expression": "0 */5 * * * *",
  "agent_config": {
    "api": {
      "url": "https://api.example.com/health",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

## 🔧 开发指南

### 添加新的任务类型

1. **在 models/task.go 中添加新的任务类型**
   ```go
   const (
       TaskTypeCustom TaskType = "custom"
   )
   ```

2. **在 executor/task_executor.go 中实现执行逻辑**
   ```go
   func (e *DefaultTaskExecutor) executeCustom(ctx context.Context, task *models.Task, log *models.ExecutionLog) error {
       // 实现自定义任务执行逻辑
       return nil
   }
   ```

3. **在 Execute 方法中添加新的 case**
   ```go
   case models.TaskTypeCustom:
       executeErr = e.executeCustom(ctx, task, executionLog)
   ```

### 添加新的 API 端点

1. **在 handlers 包中创建新的处理器**
2. **在 router/router.go 中注册路由**
3. **更新 API 文档**

## 🧪 测试

### 运行单元测试
```bash
go test ./...
```

### 运行集成测试
```bash
go test -tags=integration ./...
```

### API 测试
```bash
# 使用 curl 测试健康检查
curl http://localhost:8080/api/health

# 创建任务
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"测试任务","type":"script","cron_expression":"0 */1 * * * *"}'
```

## 📊 监控和日志

### 日志级别
- `debug`: 调试信息
- `info`: 一般信息
- `warn`: 警告信息
- `error`: 错误信息

### 性能指标
- 任务执行时间
- 内存使用情况
- CPU 使用情况
- 数据库连接状态

### WebSocket 事件
- `task_execution`: 任务执行状态更新
- `execution_logs`: 执行日志实时推送
- `system_metrics`: 系统指标更新

## 🚀 部署

### Docker 部署
```bash
# 构建镜像
docker build -t aischedule-backend .

# 运行容器
docker run -d --name aischedule-backend \
  -p 8080:8080 \
  -e MONGODB_URI=mongodb://mongodb:27017/aischedule \
  aischedule-backend
```

### Kubernetes 部署
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aischedule-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aischedule-backend
  template:
    metadata:
      labels:
        app: aischedule-backend
    spec:
      containers:
      - name: backend
        image: aischedule-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: MONGODB_URI
          value: "mongodb://mongodb:27017/aischedule"
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如果您有任何问题或建议，请：

1. 查看 [Issues](https://github.com/your-repo/issues)
2. 创建新的 Issue
3. 联系维护者

---

**AI Schedule MCP Tool Backend** - 让任务调度更智能，让工作流更高效！
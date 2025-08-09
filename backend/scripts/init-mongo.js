// MongoDB初始化脚本
// 创建数据库和集合，设置索引

// 切换到aischedule数据库
db = db.getSiblingDB('aischedule');

// 创建用户
db.createUser({
  user: 'aischedule_user',
  pwd: 'aischedule_password',
  roles: [
    {
      role: 'readWrite',
      db: 'aischedule'
    }
  ]
});

// 创建tasks集合并设置索引
db.createCollection('tasks');
db.tasks.createIndex({ "name": 1 });
db.tasks.createIndex({ "status": 1 });
db.tasks.createIndex({ "type": 1 });
db.tasks.createIndex({ "created_at": -1 });
db.tasks.createIndex({ "updated_at": -1 });

// 创建workflows集合并设置索引
db.createCollection('workflows');
db.workflows.createIndex({ "name": 1 });
db.workflows.createIndex({ "status": 1 });
db.workflows.createIndex({ "type": 1 });
db.workflows.createIndex({ "created_at": -1 });
db.workflows.createIndex({ "updated_at": -1 });

// 创建execution_logs集合并设置索引
db.createCollection('execution_logs');
db.execution_logs.createIndex({ "task_id": 1 });
db.execution_logs.createIndex({ "workflow_id": 1 });
db.execution_logs.createIndex({ "status": 1 });
db.execution_logs.createIndex({ "created_at": -1 });
db.execution_logs.createIndex({ "start_time": -1 });
db.execution_logs.createIndex({ "end_time": -1 });

// 创建复合索引
db.execution_logs.createIndex({ "task_id": 1, "created_at": -1 });
db.execution_logs.createIndex({ "workflow_id": 1, "created_at": -1 });
db.execution_logs.createIndex({ "status": 1, "created_at": -1 });

// 插入示例数据
print('Inserting sample data...');

// 示例任务
db.tasks.insertMany([
  {
    name: "示例脚本任务",
    description: "这是一个示例脚本任务",
    type: "script",
    status: "inactive",
    cron_expression: "0 */5 * * * *",
    agent_config: {
      script: {
        command: "echo",
        args: ["Hello, World!"]
      }
    },
    environment: {
      NODE_ENV: "production"
    },
    resource_limits: {
      cpu: "100m",
      memory: "128Mi",
      timeout: 300
    },
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    name: "示例API任务",
    description: "这是一个示例API调用任务",
    type: "api",
    status: "inactive",
    cron_expression: "0 0 */1 * * *",
    agent_config: {
      api: {
        url: "https://api.example.com/health",
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    },
    environment: {},
    resource_limits: {
      cpu: "50m",
      memory: "64Mi",
      timeout: 30
    },
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// 示例工作流
db.workflows.insertMany([
  {
    name: "示例数据处理工作流",
    description: "这是一个示例数据处理工作流",
    type: "sequential",
    status: "inactive",
    steps: [
      {
        id: "step1",
        name: "数据获取",
        type: "api",
        config: {
          url: "https://api.example.com/data",
          method: "GET"
        }
      },
      {
        id: "step2",
        name: "数据处理",
        type: "script",
        config: {
          command: "python",
          args: ["process_data.py"]
        }
      },
      {
        id: "step3",
        name: "结果保存",
        type: "api",
        config: {
          url: "https://api.example.com/save",
          method: "POST"
        }
      }
    ],
    connections: [
      {
        from: "step1",
        to: "step2",
        condition: "success"
      },
      {
        from: "step2",
        to: "step3",
        condition: "success"
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  }
]);

print('Sample data inserted successfully!');
print('Database initialization completed!');
/**
 * 任务数据模型
 * 定义任务相关的数据结构
 */

package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TaskStatus 任务状态枚举
type TaskStatus string

const (
	TaskStatusActive    TaskStatus = "active"    // 活跃
	TaskStatusInactive  TaskStatus = "inactive"  // 非活跃
	TaskStatusPaused    TaskStatus = "paused"    // 暂停
	TaskStatusCompleted TaskStatus = "completed" // 完成
	TaskStatusFailed    TaskStatus = "failed"    // 失败
)

// TaskType 任务类型枚举
type TaskType string

const (
	TaskTypeCodeReview   TaskType = "code_review"   // 代码审查
	TaskTypeAutoTest     TaskType = "auto_test"     // 自动测试
	TaskTypeDeployment   TaskType = "deployment"    // 部署
	TaskTypeDataBackup   TaskType = "data_backup"   // 数据备份
	TaskTypeCustom       TaskType = "custom"        // 自定义
)

// CronConfig Cron配置
type CronConfig struct {
	Expression string `json:"expression" bson:"expression"` // Cron表达式
	Timezone   string `json:"timezone" bson:"timezone"`     // 时区
}

// AgentConfig Agent配置
type AgentConfig struct {
	AgentID    string                 `json:"agent_id" bson:"agent_id"`       // Agent ID
	AgentType  string                 `json:"agent_type" bson:"agent_type"`   // Agent类型
	Parameters map[string]interface{} `json:"parameters" bson:"parameters"`   // 执行参数
	Timeout    int                    `json:"timeout" bson:"timeout"`         // 超时时间(秒)
	Retries    int                    `json:"retries" bson:"retries"`         // 重试次数
}

// ExecutionEnvironment 执行环境配置
type ExecutionEnvironment struct {
	WorkingDirectory string            `json:"working_directory" bson:"working_directory"` // 工作目录
	EnvironmentVars  map[string]string `json:"environment_vars" bson:"environment_vars"`   // 环境变量
	ResourceLimits   ResourceLimits    `json:"resource_limits" bson:"resource_limits"`     // 资源限制
}

// ResourceLimits 资源限制
type ResourceLimits struct {
	CPULimit    string `json:"cpu_limit" bson:"cpu_limit"`       // CPU限制
	MemoryLimit string `json:"memory_limit" bson:"memory_limit"` // 内存限制
	TimeLimit   int    `json:"time_limit" bson:"time_limit"`     // 时间限制(秒)
}

// Task 任务模型
type Task struct {
	ID          primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
	UserID      string               `json:"user_id" bson:"user_id"`
	Name        string               `json:"name" bson:"name"`
	Description string               `json:"description" bson:"description"`
	Type        TaskType             `json:"type" bson:"type"`
	Status      TaskStatus           `json:"status" bson:"status"`
	
	// 调度配置
	CronConfig CronConfig `json:"cron_config" bson:"cron_config"`
	NextRun    *time.Time `json:"next_run" bson:"next_run"`
	LastRun    *time.Time `json:"last_run" bson:"last_run"`
	
	// Agent配置
	AgentConfig AgentConfig `json:"agent_config" bson:"agent_config"`
	
	// 执行环境
	Environment ExecutionEnvironment `json:"environment" bson:"environment"`
	
	// 工作流ID
	WorkflowID *primitive.ObjectID `json:"workflow_id" bson:"workflow_id,omitempty"`
	
	// 统计信息
	ExecutionCount int `json:"execution_count" bson:"execution_count"`
	SuccessCount   int `json:"success_count" bson:"success_count"`
	FailureCount   int `json:"failure_count" bson:"failure_count"`
	
	// 时间戳
	CreatedAt time.Time  `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" bson:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" bson:"deleted_at,omitempty"`
}

// CreateTaskRequest 创建任务请求
type CreateTaskRequest struct {
	Name        string               `json:"name" binding:"required"`
	Description string               `json:"description"`
	Type        TaskType             `json:"type" binding:"required"`
	CronConfig  CronConfig           `json:"cron_config" binding:"required"`
	AgentConfig AgentConfig          `json:"agent_config" binding:"required"`
	Environment ExecutionEnvironment `json:"environment"`
	WorkflowID  *primitive.ObjectID  `json:"workflow_id,omitempty"`
}

// UpdateTaskRequest 更新任务请求
type UpdateTaskRequest struct {
	Name        *string               `json:"name,omitempty"`
	Description *string               `json:"description,omitempty"`
	Type        *TaskType             `json:"type,omitempty"`
	Status      *TaskStatus           `json:"status,omitempty"`
	CronConfig  *CronConfig           `json:"cron_config,omitempty"`
	AgentConfig *AgentConfig          `json:"agent_config,omitempty"`
	Environment *ExecutionEnvironment `json:"environment,omitempty"`
	WorkflowID  *primitive.ObjectID   `json:"workflow_id,omitempty"`
}

// TaskListResponse 任务列表响应
type TaskListResponse struct {
	Tasks      []Task     `json:"tasks"`
	Pagination Pagination `json:"pagination"`
}
/**
 * 执行日志数据模型
 * 定义任务执行日志相关的数据结构
 */

package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// LogLevel 日志级别
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

// ExecutionStatus 执行状态
type ExecutionStatus string

const (
	ExecutionStatusRunning   ExecutionStatus = "running"   // 运行中
	ExecutionStatusCompleted ExecutionStatus = "completed" // 完成
	ExecutionStatusFailed    ExecutionStatus = "failed"    // 失败
	ExecutionStatusCancelled ExecutionStatus = "cancelled" // 取消
	ExecutionStatusTimeout   ExecutionStatus = "timeout"   // 超时
)

// LogEntry 日志条目
type LogEntry struct {
	Timestamp time.Time `json:"timestamp" bson:"timestamp"`
	Level     LogLevel  `json:"level" bson:"level"`
	Message   string    `json:"message" bson:"message"`
	Source    string    `json:"source" bson:"source"` // 日志来源（agent, system等）
	StepID    string    `json:"step_id,omitempty" bson:"step_id,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty" bson:"data,omitempty"`
}

// PerformanceMetrics 性能指标
type PerformanceMetrics struct {
	CPUUsage    float64 `json:"cpu_usage" bson:"cpu_usage"`       // CPU使用率 (%)
	MemoryUsage float64 `json:"memory_usage" bson:"memory_usage"` // 内存使用率 (%)
	DiskIO      float64 `json:"disk_io" bson:"disk_io"`           // 磁盘IO (MB/s)
	NetworkIO   float64 `json:"network_io" bson:"network_io"`     // 网络IO (MB/s)
	Timestamp   time.Time `json:"timestamp" bson:"timestamp"`
}

// ExecutionResult 执行结果
type ExecutionResult struct {
	Success    bool                   `json:"success" bson:"success"`
	Output     string                 `json:"output" bson:"output"`
	Error      string                 `json:"error,omitempty" bson:"error,omitempty"`
	ExitCode   int                    `json:"exit_code" bson:"exit_code"`
	Data       map[string]interface{} `json:"data,omitempty" bson:"data,omitempty"`
	Artifacts  []string               `json:"artifacts,omitempty" bson:"artifacts,omitempty"` // 生成的文件路径
}

// ExecutionLog 执行日志模型
type ExecutionLog struct {
	ID     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	TaskID primitive.ObjectID `json:"task_id" bson:"task_id"`
	
	// 执行信息
	ExecutionID string          `json:"execution_id" bson:"execution_id"` // 唯一执行ID
	Status      ExecutionStatus `json:"status" bson:"status"`
	
	// 时间信息
	StartedAt   time.Time  `json:"started_at" bson:"started_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
	Duration    int64      `json:"duration" bson:"duration"` // 执行时长(毫秒)
	
	// 执行环境
	AgentID   string `json:"agent_id" bson:"agent_id"`
	AgentType string `json:"agent_type" bson:"agent_type"`
	
	// 工作流信息
	WorkflowID       *primitive.ObjectID `json:"workflow_id,omitempty" bson:"workflow_id,omitempty"`
	WorkflowVersion  string              `json:"workflow_version,omitempty" bson:"workflow_version,omitempty"`
	CurrentStepID    string              `json:"current_step_id,omitempty" bson:"current_step_id,omitempty"`
	CompletedSteps   []string            `json:"completed_steps" bson:"completed_steps"`
	
	// 日志和结果
	Logs        []LogEntry         `json:"logs" bson:"logs"`
	Result      ExecutionResult    `json:"result" bson:"result"`
	Metrics     []PerformanceMetrics `json:"metrics" bson:"metrics"`
	
	// 触发信息
	TriggerType string `json:"trigger_type" bson:"trigger_type"` // manual, scheduled, webhook等
	TriggerBy   string `json:"trigger_by,omitempty" bson:"trigger_by,omitempty"`
	
	// 重试信息
	RetryCount    int    `json:"retry_count" bson:"retry_count"`
	MaxRetries    int    `json:"max_retries" bson:"max_retries"`
	ParentLogID   *primitive.ObjectID `json:"parent_log_id,omitempty" bson:"parent_log_id,omitempty"`
	
	// 时间戳
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

// CreateExecutionLogRequest 创建执行日志请求
type CreateExecutionLogRequest struct {
	TaskID      primitive.ObjectID `json:"task_id" binding:"required"`
	AgentID     string             `json:"agent_id" binding:"required"`
	AgentType   string             `json:"agent_type" binding:"required"`
	WorkflowID  *primitive.ObjectID `json:"workflow_id,omitempty"`
	TriggerType string             `json:"trigger_type" binding:"required"`
	TriggerBy   string             `json:"trigger_by,omitempty"`
	MaxRetries  int                `json:"max_retries"`
}

// UpdateExecutionLogRequest 更新执行日志请求
type UpdateExecutionLogRequest struct {
	Status         *ExecutionStatus      `json:"status,omitempty"`
	CurrentStepID  *string               `json:"current_step_id,omitempty"`
	CompletedSteps *[]string             `json:"completed_steps,omitempty"`
	Result         *ExecutionResult      `json:"result,omitempty"`
	CompletedAt    *time.Time            `json:"completed_at,omitempty"`
}

// AddLogEntryRequest 添加日志条目请求
type AddLogEntryRequest struct {
	Level   LogLevel               `json:"level" binding:"required"`
	Message string                 `json:"message" binding:"required"`
	Source  string                 `json:"source"`
	StepID  string                 `json:"step_id,omitempty"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

// AddMetricsRequest 添加性能指标请求
type AddMetricsRequest struct {
	CPUUsage    float64 `json:"cpu_usage"`
	MemoryUsage float64 `json:"memory_usage"`
	DiskIO      float64 `json:"disk_io"`
	NetworkIO   float64 `json:"network_io"`
}

// AddPerformanceMetricRequest 添加性能指标请求（别名）
type AddPerformanceMetricRequest = AddMetricsRequest

// PerformanceMetric 性能指标（别名）
type PerformanceMetric = PerformanceMetrics

// Pagination 分页信息
type Pagination struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}

// ExecutionLogListResponse 执行日志列表响应
type ExecutionLogListResponse struct {
	Logs       []ExecutionLog `json:"logs"`
	Pagination Pagination     `json:"pagination"`
}

// ExecutionStatsResponse 执行统计响应
type ExecutionStatsResponse struct {
	TotalExecutions      int64   `json:"total_executions"`
	SuccessfulExecutions int64   `json:"successful_executions"`
	FailedExecutions     int64   `json:"failed_executions"`
	RunningExecutions    int64   `json:"running_executions"`
	SuccessRate          float64 `json:"success_rate"`
	AverageExecutionTime float64 `json:"average_execution_time"` // 毫秒
	TotalExecutionTime   int64   `json:"total_execution_time"`   // 毫秒
}
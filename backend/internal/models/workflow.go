/**
 * 工作流数据模型
 * 定义Agent工作流相关的数据结构
 */

package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// WorkflowType 工作流类型
type WorkflowType string

const (
	WorkflowTypeSequential WorkflowType = "sequential" // 顺序执行
	WorkflowTypeParallel   WorkflowType = "parallel"   // 并行执行
	WorkflowTypeConditional WorkflowType = "conditional" // 条件执行
)

// WorkflowStatus 工作流状态
type WorkflowStatus string

const (
	WorkflowStatusInactive WorkflowStatus = "inactive" // 非活跃
	WorkflowStatusRunning  WorkflowStatus = "running"  // 运行中
	WorkflowStatusStopped  WorkflowStatus = "stopped"  // 已停止
	WorkflowStatusPaused   WorkflowStatus = "paused"   // 暂停
	WorkflowStatusFailed   WorkflowStatus = "failed"   // 失败
)

// StepType 步骤类型
type StepType string

const (
	StepTypeAction    StepType = "action"    // 动作步骤
	StepTypeCondition StepType = "condition" // 条件步骤
	StepTypeLoop      StepType = "loop"      // 循环步骤
	StepTypeWait      StepType = "wait"      // 等待步骤
)

// StepStatus 步骤状态
type StepStatus string

const (
	StepStatusPending   StepStatus = "pending"   // 等待中
	StepStatusRunning   StepStatus = "running"   // 运行中
	StepStatusCompleted StepStatus = "completed" // 已完成
	StepStatusFailed    StepStatus = "failed"    // 失败
	StepStatusSkipped   StepStatus = "skipped"   // 跳过
)

// WorkflowStep 工作流步骤
type WorkflowStep struct {
	ID          string                 `json:"id" bson:"id"`
	Name        string                 `json:"name" bson:"name"`
	Description string                 `json:"description" bson:"description"`
	Type        StepType               `json:"type" bson:"type"`
	
	// 步骤配置
	AgentID     string                 `json:"agent_id" bson:"agent_id"`
	Action      string                 `json:"action" bson:"action"`
	Parameters  map[string]interface{} `json:"parameters" bson:"parameters"`
	
	// 条件配置
	Condition   string   `json:"condition,omitempty" bson:"condition,omitempty"`
	OnSuccess   []string `json:"on_success,omitempty" bson:"on_success,omitempty"`
	OnFailure   []string `json:"on_failure,omitempty" bson:"on_failure,omitempty"`
	
	// 执行配置
	Timeout     int  `json:"timeout" bson:"timeout"`
	Retries     int  `json:"retries" bson:"retries"`
	ContinueOnError bool `json:"continue_on_error" bson:"continue_on_error"`
	
	// 位置信息（用于可视化编辑器）
	Position Position `json:"position" bson:"position"`
}

// Position 步骤位置
type Position struct {
	X int `json:"x" bson:"x"`
	Y int `json:"y" bson:"y"`
}

// WorkflowConnection 工作流连接
type WorkflowConnection struct {
	From      string `json:"from" bson:"from"`
	To        string `json:"to" bson:"to"`
	Condition string `json:"condition,omitempty" bson:"condition,omitempty"`
}

// Workflow 工作流模型
type Workflow struct {
	ID          primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
	UserID      string               `json:"user_id" bson:"user_id"`
	Name        string               `json:"name" bson:"name"`
	Description string               `json:"description" bson:"description"`
	Type        WorkflowType         `json:"type" bson:"type"`
	Status      WorkflowStatus       `json:"status" bson:"status"`
	
	// 工作流定义
	Steps       []WorkflowStep       `json:"steps" bson:"steps"`
	Connections []WorkflowConnection `json:"connections" bson:"connections"`
	StartStep   string               `json:"start_step" bson:"start_step"`
	
	// 模板配置
	IsTemplate bool                   `json:"is_template" bson:"is_template"`
	Category   string                 `json:"category" bson:"category"`
	Tags       []string               `json:"tags" bson:"tags"`
	
	// 版本信息
	Version     string `json:"version" bson:"version"`
	
	// 统计信息
	UsageCount  int `json:"usage_count" bson:"usage_count"`
	
	// 时间戳
	CreatedAt time.Time  `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" bson:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" bson:"deleted_at,omitempty"`
}

// CreateWorkflowRequest 创建工作流请求
type CreateWorkflowRequest struct {
	Name        string               `json:"name" binding:"required"`
	Description string               `json:"description"`
	Type        WorkflowType         `json:"type" binding:"required"`
	Steps       []WorkflowStep       `json:"steps" binding:"required"`
	Connections []WorkflowConnection `json:"connections"`
	StartStep   string               `json:"start_step" binding:"required"`
	IsTemplate  bool                 `json:"is_template"`
	Category    string               `json:"category"`
	Tags        []string             `json:"tags"`
}

// UpdateWorkflowRequest 更新工作流请求
type UpdateWorkflowRequest struct {
	Name        *string               `json:"name,omitempty"`
	Description *string               `json:"description,omitempty"`
	Type        *WorkflowType         `json:"type,omitempty"`
	Steps       *[]WorkflowStep       `json:"steps,omitempty"`
	Connections *[]WorkflowConnection `json:"connections,omitempty"`
	StartStep   *string               `json:"start_step,omitempty"`
	IsTemplate  *bool                 `json:"is_template,omitempty"`
	Category    *string               `json:"category,omitempty"`
	Tags        *[]string             `json:"tags,omitempty"`
}

// WorkflowExecution 工作流执行记录
type WorkflowExecution struct {
	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	WorkflowID primitive.ObjectID `json:"workflow_id" bson:"workflow_id"`
	TaskID     primitive.ObjectID `json:"task_id" bson:"task_id"`
	
	// 执行状态
	Status     StepStatus `json:"status" bson:"status"`
	CurrentStep string    `json:"current_step" bson:"current_step"`
	
	// 步骤执行状态
	StepStatuses map[string]StepStatus `json:"step_statuses" bson:"step_statuses"`
	StepResults  map[string]interface{} `json:"step_results" bson:"step_results"`
	
	// 执行信息
	StartedAt   time.Time  `json:"started_at" bson:"started_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
	Duration    int64      `json:"duration" bson:"duration"` // 毫秒
	
	// 错误信息
	Error string `json:"error,omitempty" bson:"error,omitempty"`
}

// WorkflowListResponse 工作流列表响应
type WorkflowListResponse struct {
	Workflows  []Workflow `json:"workflows"`
	Pagination Pagination `json:"pagination"`
}
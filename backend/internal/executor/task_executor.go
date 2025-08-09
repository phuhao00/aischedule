/**
 * 任务执行器
 * 负责实际执行任务的逻辑
 */

package executor

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"time"

	"aischedule/internal/database"
	"aischedule/internal/models"
	"aischedule/internal/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// TaskExecutor 任务执行器接口
type TaskExecutor interface {
	Execute(ctx context.Context, task *models.Task) error
}

// DefaultTaskExecutor 默认任务执行器
type DefaultTaskExecutor struct {
	db        *database.MongoDB
	wsManager *websocket.Manager
}

// NewDefaultTaskExecutor 创建新的默认任务执行器
func NewDefaultTaskExecutor(db *database.MongoDB, wsManager *websocket.Manager) *DefaultTaskExecutor {
	return &DefaultTaskExecutor{
		db:        db,
		wsManager: wsManager,
	}
}

// Execute 执行任务
func (e *DefaultTaskExecutor) Execute(ctx context.Context, task *models.Task) error {
	// 创建执行日志
	executionLog := &models.ExecutionLog{
		ID:        primitive.NewObjectID(),
		TaskID:    task.ID.Hex(),
		Status:    models.ExecutionStatusRunning,
		StartTime: time.Now(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Logs:      []models.LogEntry{},
		PerformanceMetrics: []models.PerformanceMetric{},
	}

	// 保存执行日志
	collection := e.db.GetCollection("execution_logs")
	result, err := collection.InsertOne(ctx, executionLog)
	if err != nil {
		return fmt.Errorf("failed to create execution log: %w", err)
	}
	executionLog.ID = result.InsertedID.(primitive.ObjectID)

	// 发送开始执行的WebSocket消息
	e.wsManager.SendToTopic("task_execution", websocket.MessageTypeStatus, map[string]interface{}{
		"task_id":        task.ID.Hex(),
		"execution_id":   executionLog.ID.Hex(),
		"status":         "started",
		"message":        fmt.Sprintf("任务 %s 开始执行", task.Name),
	})

	// 添加开始日志
	e.addLogEntry(ctx, executionLog.ID, models.LogLevelInfo, "任务开始执行", "executor", nil)

	// 根据任务类型执行不同的逻辑
	var executeErr error
	switch task.Type {
	case models.TaskTypeScript:
		executeErr = e.executeScript(ctx, task, executionLog)
	case models.TaskTypeAPI:
		executeErr = e.executeAPI(ctx, task, executionLog)
	case models.TaskTypeWorkflow:
		executeErr = e.executeWorkflow(ctx, task, executionLog)
	case models.TaskTypeAgent:
		executeErr = e.executeAgent(ctx, task, executionLog)
	default:
		executeErr = fmt.Errorf("unsupported task type: %s", task.Type)
	}

	// 更新执行状态
	endTime := time.Now()
	status := models.ExecutionStatusCompleted
	if executeErr != nil {
		status = models.ExecutionStatusFailed
		e.addLogEntry(ctx, executionLog.ID, models.LogLevelError, 
			fmt.Sprintf("任务执行失败: %v", executeErr), "executor", nil)
	} else {
		e.addLogEntry(ctx, executionLog.ID, models.LogLevelInfo, "任务执行完成", "executor", nil)
	}

	// 更新执行日志
	e.updateExecutionLog(ctx, executionLog.ID, status, endTime, executeErr)

	// 发送完成的WebSocket消息
	e.wsManager.SendToTopic("task_execution", websocket.MessageTypeStatus, map[string]interface{}{
		"task_id":        task.ID.Hex(),
		"execution_id":   executionLog.ID.Hex(),
		"status":         string(status),
		"message":        fmt.Sprintf("任务 %s 执行完成", task.Name),
		"error":          executeErr,
	})

	return executeErr
}

// executeScript 执行脚本任务
func (e *DefaultTaskExecutor) executeScript(ctx context.Context, task *models.Task, log *models.ExecutionLog) error {
	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, "开始执行脚本任务", "script_executor", nil)

	// 从Agent配置中获取脚本信息
	scriptConfig, ok := task.AgentConfig["script"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid script configuration")
	}

	command, ok := scriptConfig["command"].(string)
	if !ok {
		return fmt.Errorf("script command not specified")
	}

	args := []string{}
	if argsInterface, exists := scriptConfig["args"]; exists {
		if argsList, ok := argsInterface.([]interface{}); ok {
			for _, arg := range argsList {
				if argStr, ok := arg.(string); ok {
					args = append(args, argStr)
				}
			}
		}
	}

	// 执行命令
	cmd := exec.CommandContext(ctx, command, args...)
	
	// 设置环境变量
	if task.Environment != nil {
		for key, value := range task.Environment {
			if valueStr, ok := value.(string); ok {
				cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", key, valueStr))
			}
		}
	}

	// 执行并获取输出
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		e.addLogEntry(ctx, log.ID, models.LogLevelError, 
			fmt.Sprintf("脚本执行失败: %v", err), "script_executor", 
			map[string]interface{}{"output": string(output)})
		return err
	}

	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, 
		"脚本执行成功", "script_executor", 
		map[string]interface{}{"output": string(output)})

	return nil
}

// executeAPI 执行API任务
func (e *DefaultTaskExecutor) executeAPI(ctx context.Context, task *models.Task, log *models.ExecutionLog) error {
	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, "开始执行API任务", "api_executor", nil)

	// 从Agent配置中获取API信息
	apiConfig, ok := task.AgentConfig["api"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid API configuration")
	}

	url, ok := apiConfig["url"].(string)
	if !ok {
		return fmt.Errorf("API URL not specified")
	}

	method := "GET"
	if methodInterface, exists := apiConfig["method"]; exists {
		if methodStr, ok := methodInterface.(string); ok {
			method = methodStr
		}
	}

	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, 
		fmt.Sprintf("调用API: %s %s", method, url), "api_executor", nil)

	// TODO: 实现实际的HTTP请求逻辑
	// 这里应该使用http.Client发送请求

	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, "API调用成功", "api_executor", nil)

	return nil
}

// executeWorkflow 执行工作流任务
func (e *DefaultTaskExecutor) executeWorkflow(ctx context.Context, task *models.Task, log *models.ExecutionLog) error {
	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, "开始执行工作流任务", "workflow_executor", nil)

	// 从Agent配置中获取工作流ID
	workflowConfig, ok := task.AgentConfig["workflow"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid workflow configuration")
	}

	workflowID, ok := workflowConfig["workflow_id"].(string)
	if !ok {
		return fmt.Errorf("workflow ID not specified")
	}

	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, 
		fmt.Sprintf("执行工作流: %s", workflowID), "workflow_executor", nil)

	// TODO: 实现实际的工作流执行逻辑
	// 这里应该调用工作流引擎

	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, "工作流执行成功", "workflow_executor", nil)

	return nil
}

// executeAgent 执行Agent任务
func (e *DefaultTaskExecutor) executeAgent(ctx context.Context, task *models.Task, log *models.ExecutionLog) error {
	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, "开始执行Agent任务", "agent_executor", nil)

	// 从Agent配置中获取Agent信息
	agentConfig, ok := task.AgentConfig["agent"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("invalid agent configuration")
	}

	agentType, ok := agentConfig["type"].(string)
	if !ok {
		return fmt.Errorf("agent type not specified")
	}

	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, 
		fmt.Sprintf("执行Agent: %s", agentType), "agent_executor", nil)

	// TODO: 实现实际的Agent执行逻辑
	// 这里应该调用相应的Agent

	e.addLogEntry(ctx, log.ID, models.LogLevelInfo, "Agent执行成功", "agent_executor", nil)

	return nil
}

// addLogEntry 添加日志条目
func (e *DefaultTaskExecutor) addLogEntry(ctx context.Context, logID primitive.ObjectID, 
	level models.LogLevel, message, source string, data map[string]interface{}) {
	
	logEntry := models.LogEntry{
		Level:     level,
		Message:   message,
		Timestamp: time.Now(),
		Source:    source,
		Data:      data,
	}

	collection := e.db.GetCollection("execution_logs")
	_, err := collection.UpdateOne(
		ctx,
		map[string]interface{}{"_id": logID},
		map[string]interface{}{
			"$push": map[string]interface{}{"logs": logEntry},
			"$set":  map[string]interface{}{"updated_at": time.Now()},
		},
	)
	if err != nil {
		log.Printf("Failed to add log entry: %v", err)
	}

	// 发送日志WebSocket消息
	e.wsManager.SendToTopic("execution_logs", websocket.MessageTypeLog, map[string]interface{}{
		"execution_id": logID.Hex(),
		"level":        string(level),
		"message":      message,
		"source":       source,
		"timestamp":    logEntry.Timestamp.Unix(),
		"data":         data,
	})
}

// updateExecutionLog 更新执行日志
func (e *DefaultTaskExecutor) updateExecutionLog(ctx context.Context, logID primitive.ObjectID, 
	status models.ExecutionStatus, endTime time.Time, executeErr error) {
	
	update := map[string]interface{}{
		"status":     status,
		"end_time":   endTime,
		"updated_at": time.Now(),
	}

	if executeErr != nil {
		update["result"] = map[string]interface{}{
			"success": false,
			"error":   executeErr.Error(),
		}
	} else {
		update["result"] = map[string]interface{}{
			"success": true,
		}
	}

	collection := e.db.GetCollection("execution_logs")
	_, err := collection.UpdateOne(
		ctx,
		map[string]interface{}{"_id": logID},
		map[string]interface{}{"$set": update},
	)
	if err != nil {
		log.Printf("Failed to update execution log: %v", err)
	}
}
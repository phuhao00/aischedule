/**
 * 任务处理器
 * 负责任务相关的HTTP请求处理
 */

package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"aischedule/internal/database"
	"aischedule/internal/middleware"
	"aischedule/internal/models"
	"aischedule/internal/scheduler"
)

// TaskHandler 任务处理器
type TaskHandler struct {
	db        *database.MongoDB
	scheduler *scheduler.Scheduler
}

// NewTaskHandler 创建新的任务处理器
func NewTaskHandler(db *database.MongoDB, scheduler *scheduler.Scheduler) *TaskHandler {
	return &TaskHandler{
		db:        db,
		scheduler: scheduler,
	}
}

// CreateTask 创建任务
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req models.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 验证Cron表达式
	if req.CronConfig.Expression != "" {
		if err := h.scheduler.ValidateCronExpression(req.CronConfig.Expression); err != nil {
			middleware.HandleValidationError(c, err)
			return
		}
	}

	task := &models.Task{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Status:      models.TaskStatusInactive,
		CronConfig:  req.CronConfig,
		AgentConfig: req.AgentConfig,
		Environment: req.Environment,
		WorkflowID:  req.WorkflowID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	collection := h.db.GetCollection("tasks")
	result, err := collection.InsertOne(c.Request.Context(), task)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	task.ID = result.InsertedID.(primitive.ObjectID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    task,
		"message": "任务创建成功",
	})
}

// GetTasks 获取任务列表
func (h *TaskHandler) GetTasks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	taskType := c.Query("type")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// 构建查询条件
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if taskType != "" {
		filter["type"] = taskType
	}

	collection := h.db.GetCollection("tasks")

	// 获取总数
	total, err := collection.CountDocuments(c.Request.Context(), filter)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 获取任务列表
	skip := (page - 1) * limit
	cursor, err := collection.Find(c.Request.Context(), filter, 
		options.Find().
			SetSkip(int64(skip)).
			SetLimit(int64(limit)).
			SetSort(bson.D{{Key: "created_at", Value: -1}}))
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}
	defer cursor.Close(c.Request.Context())

	var tasks []models.Task
	if err := cursor.All(c.Request.Context(), &tasks); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	response := models.TaskListResponse{
		Tasks: tasks,
		Pagination: models.Pagination{
			Page:  page,
			Limit: limit,
			Total: int(total),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

// GetTask 获取单个任务
func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	collection := h.db.GetCollection("tasks")
	var task models.Task
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&task)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			middleware.HandleNotFoundError(c, "任务不存在")
			return
		}
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    task,
	})
}

// UpdateTask 更新任务
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	var req models.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 验证Cron表达式
	if req.CronConfig != nil && req.CronConfig.Expression != "" {
		if err := h.scheduler.ValidateCronExpression(req.CronConfig.Expression); err != nil {
			middleware.HandleValidationError(c, err)
			return
		}
	}

	// 构建更新数据
	update := bson.M{
		"updated_at": time.Now(),
	}

	if req.Name != nil {
		update["name"] = *req.Name
	}
	if req.Description != nil {
		update["description"] = *req.Description
	}
	if req.Type != nil {
		update["type"] = *req.Type
	}
	if req.Status != nil {
		update["status"] = *req.Status
	}
	if req.CronConfig != nil {
		update["cron_config"] = *req.CronConfig
	}
	if req.AgentConfig != nil {
		update["agent_config"] = *req.AgentConfig
	}
	if req.Environment != nil {
		update["environment"] = *req.Environment
	}
	if req.WorkflowID != nil {
		update["workflow_id"] = *req.WorkflowID
	}

	collection := h.db.GetCollection("tasks")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objectID},
		bson.M{"$set": update},
	)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.MatchedCount == 0 {
		middleware.HandleNotFoundError(c, "任务不存在")
		return
	}

	// 获取更新后的任务
	var task models.Task
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&task)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    task,
		"message": "任务更新成功",
	})
}

// DeleteTask 删除任务
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	collection := h.db.GetCollection("tasks")
	result, err := collection.DeleteOne(c.Request.Context(), bson.M{"_id": objectID})
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.DeletedCount == 0 {
		middleware.HandleNotFoundError(c, "任务不存在")
		return
	}

	// 从调度器中移除任务
	h.scheduler.RemoveTask(objectID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "任务删除成功",
	})
}

// StartTask 启动任务
func (h *TaskHandler) StartTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 获取任务
	collection := h.db.GetCollection("tasks")
	var task models.Task
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&task)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			middleware.HandleNotFoundError(c, "任务不存在")
			return
		}
		middleware.HandleInternalError(c, err)
		return
	}

	// 添加到调度器
	if err := h.scheduler.AddTask(&task); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 更新任务状态
	_, err = collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objectID},
		bson.M{"$set": bson.M{
			"status":     models.TaskStatusActive,
			"updated_at": time.Now(),
		}},
	)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "任务启动成功",
	})
}

// StopTask 停止任务
func (h *TaskHandler) StopTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 从调度器中移除任务
	h.scheduler.RemoveTask(objectID)

	// 更新任务状态
	collection := h.db.GetCollection("tasks")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objectID},
		bson.M{"$set": bson.M{
			"status":     models.TaskStatusInactive,
			"updated_at": time.Now(),
		}},
	)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.MatchedCount == 0 {
		middleware.HandleNotFoundError(c, "任务不存在")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "任务停止成功",
	})
}

// ExecuteTask 立即执行任务
func (h *TaskHandler) ExecuteTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 获取任务
	collection := h.db.GetCollection("tasks")
	var task models.Task
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&task)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			middleware.HandleNotFoundError(c, "任务不存在")
			return
		}
		middleware.HandleInternalError(c, err)
		return
	}

	// 立即执行任务
	h.scheduler.ExecuteTaskNow(&task)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "任务执行已启动",
	})
}
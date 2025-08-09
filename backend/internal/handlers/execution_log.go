/**
 * 执行日志处理器
 * 负责执行日志相关的HTTP请求处理
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
)

// ExecutionLogHandler 执行日志处理器
type ExecutionLogHandler struct {
	db *database.MongoDB
}

// NewExecutionLogHandler 创建新的执行日志处理器
func NewExecutionLogHandler(db *database.MongoDB) *ExecutionLogHandler {
	return &ExecutionLogHandler{
		db: db,
	}
}

// GetExecutionLogs 获取执行日志列表
func (h *ExecutionLogHandler) GetExecutionLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	taskID := c.Query("task_id")
	workflowID := c.Query("workflow_id")
	status := c.Query("status")
	level := c.Query("level")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// 构建查询条件
	filter := bson.M{}
	if taskID != "" {
		filter["task_id"] = taskID
	}
	if workflowID != "" {
		filter["workflow_id"] = workflowID
	}
	if status != "" {
		filter["status"] = status
	}
	if level != "" {
		filter["logs.level"] = level
	}

	collection := h.db.GetCollection("execution_logs")

	// 获取总数
	total, err := collection.CountDocuments(c.Request.Context(), filter)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 获取执行日志列表
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

	var logs []models.ExecutionLog
	if err := cursor.All(c.Request.Context(), &logs); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	response := models.ExecutionLogListResponse{
		Logs: logs,
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

// GetExecutionLog 获取单个执行日志
func (h *ExecutionLogHandler) GetExecutionLog(c *gin.Context) {
	logID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(logID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	collection := h.db.GetCollection("execution_logs")
	var log models.ExecutionLog
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&log)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			middleware.HandleNotFoundError(c, "执行日志不存在")
			return
		}
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    log,
	})
}

// CreateExecutionLog 创建执行日志
func (h *ExecutionLogHandler) CreateExecutionLog(c *gin.Context) {
	var req models.CreateExecutionLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	log := &models.ExecutionLog{
		ID:         primitive.NewObjectID(),
		TaskID:     req.TaskID,
		WorkflowID: req.WorkflowID,
		Status:     models.ExecutionStatusRunning,
		StartedAt:  time.Now(),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	collection := h.db.GetCollection("execution_logs")
	result, err := collection.InsertOne(c.Request.Context(), log)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	log.ID = result.InsertedID.(primitive.ObjectID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    log,
		"message": "执行日志创建成功",
	})
}

// UpdateExecutionLog 更新执行日志
func (h *ExecutionLogHandler) UpdateExecutionLog(c *gin.Context) {
	logID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(logID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	var req models.UpdateExecutionLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 构建更新数据
	update := bson.M{
		"updated_at": time.Now(),
	}

	if req.Status != nil {
		update["status"] = *req.Status
		if *req.Status == models.ExecutionStatusCompleted || 
		   *req.Status == models.ExecutionStatusFailed {
			update["end_time"] = time.Now()
		}
	}

	if req.Result != nil {
		update["result"] = *req.Result
	}

	collection := h.db.GetCollection("execution_logs")
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
		middleware.HandleNotFoundError(c, "执行日志不存在")
		return
	}

	// 获取更新后的日志
	var log models.ExecutionLog
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&log)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    log,
		"message": "执行日志更新成功",
	})
}

// AddLogEntry 添加日志条目
func (h *ExecutionLogHandler) AddLogEntry(c *gin.Context) {
	logID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(logID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	var req models.AddLogEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	logEntry := models.LogEntry{
		Level:     req.Level,
		Message:   req.Message,
		Timestamp: time.Now(),
		Source:    req.Source,
		Data:      req.Data,
	}

	collection := h.db.GetCollection("execution_logs")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objectID},
		bson.M{
			"$push": bson.M{"logs": logEntry},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.MatchedCount == 0 {
		middleware.HandleNotFoundError(c, "执行日志不存在")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "日志条目添加成功",
	})
}

// AddPerformanceMetric 添加性能指标
func (h *ExecutionLogHandler) AddPerformanceMetric(c *gin.Context) {
	logID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(logID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	var req models.AddPerformanceMetricRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	metric := models.PerformanceMetric{
		CPUUsage:    req.CPUUsage,
		MemoryUsage: req.MemoryUsage,
		DiskIO:      req.DiskIO,
		NetworkIO:   req.NetworkIO,
		Timestamp:   time.Now(),
	}

	collection := h.db.GetCollection("execution_logs")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objectID},
		bson.M{
			"$push": bson.M{"metrics": metric},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.MatchedCount == 0 {
		middleware.HandleNotFoundError(c, "执行日志不存在")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "性能指标添加成功",
	})
}

// GetExecutionStats 获取执行统计
func (h *ExecutionLogHandler) GetExecutionStats(c *gin.Context) {
	collection := h.db.GetCollection("execution_logs")

	// 获取总执行次数
	totalCount, err := collection.CountDocuments(c.Request.Context(), bson.M{})
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 获取成功执行次数
	successCount, err := collection.CountDocuments(c.Request.Context(), 
		bson.M{"status": models.ExecutionStatusCompleted})
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 获取失败执行次数
	failedCount, err := collection.CountDocuments(c.Request.Context(), 
		bson.M{"status": models.ExecutionStatusFailed})
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 获取运行中的执行次数
	runningCount, err := collection.CountDocuments(c.Request.Context(), 
		bson.M{"status": models.ExecutionStatusRunning})
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 计算成功率
	successRate := float64(0)
	if totalCount > 0 {
		successRate = float64(successCount) / float64(totalCount) * 100
	}

	stats := models.ExecutionStatsResponse{
		TotalExecutions:      int64(totalCount),
		SuccessfulExecutions: int64(successCount),
		FailedExecutions:     int64(failedCount),
		RunningExecutions:    int64(runningCount),
		SuccessRate:          successRate,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// DeleteExecutionLog 删除执行日志
func (h *ExecutionLogHandler) DeleteExecutionLog(c *gin.Context) {
	logID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(logID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	collection := h.db.GetCollection("execution_logs")
	result, err := collection.DeleteOne(c.Request.Context(), bson.M{"_id": objectID})
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.DeletedCount == 0 {
		middleware.HandleNotFoundError(c, "执行日志不存在")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "执行日志删除成功",
	})
}
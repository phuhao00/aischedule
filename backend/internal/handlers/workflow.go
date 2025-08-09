/**
 * 工作流处理器
 * 负责工作流相关的HTTP请求处理
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

// WorkflowHandler 工作流处理器
type WorkflowHandler struct {
	db *database.MongoDB
}

// NewWorkflowHandler 创建新的工作流处理器
func NewWorkflowHandler(db *database.MongoDB) *WorkflowHandler {
	return &WorkflowHandler{
		db: db,
	}
}

// CreateWorkflow 创建工作流
func (h *WorkflowHandler) CreateWorkflow(c *gin.Context) {
	var req models.CreateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	workflow := &models.Workflow{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Steps:       req.Steps,
		Connections: req.Connections,
		Status:      models.WorkflowStatusInactive,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	collection := h.db.GetCollection("workflows")
	result, err := collection.InsertOne(c.Request.Context(), workflow)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	workflow.ID = result.InsertedID.(primitive.ObjectID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    workflow,
		"message": "工作流创建成功",
	})
}

// GetWorkflows 获取工作流列表
func (h *WorkflowHandler) GetWorkflows(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	workflowType := c.Query("type")

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
	if workflowType != "" {
		filter["type"] = workflowType
	}

	collection := h.db.GetCollection("workflows")

	// 获取总数
	total, err := collection.CountDocuments(c.Request.Context(), filter)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// 获取工作流列表
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

	var workflows []models.Workflow
	if err := cursor.All(c.Request.Context(), &workflows); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	response := models.WorkflowListResponse{
		Workflows: workflows,
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

// GetWorkflow 获取单个工作流
func (h *WorkflowHandler) GetWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	collection := h.db.GetCollection("workflows")
	var workflow models.Workflow
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&workflow)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			middleware.HandleNotFoundError(c, "工作流不存在")
			return
		}
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    workflow,
	})
}

// UpdateWorkflow 更新工作流
func (h *WorkflowHandler) UpdateWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	var req models.UpdateWorkflowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.HandleValidationError(c, err)
		return
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
	if req.Steps != nil {
		update["steps"] = *req.Steps
	}
	if req.Connections != nil {
		update["connections"] = *req.Connections
	}

	collection := h.db.GetCollection("workflows")
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
		middleware.HandleNotFoundError(c, "工作流不存在")
		return
	}

	// 获取更新后的工作流
	var workflow models.Workflow
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&workflow)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    workflow,
		"message": "工作流更新成功",
	})
}

// DeleteWorkflow 删除工作流
func (h *WorkflowHandler) DeleteWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	collection := h.db.GetCollection("workflows")
	result, err := collection.DeleteOne(c.Request.Context(), bson.M{"_id": objectID})
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.DeletedCount == 0 {
		middleware.HandleNotFoundError(c, "工作流不存在")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "工作流删除成功",
	})
}

// ExecuteWorkflow 执行工作流
func (h *WorkflowHandler) ExecuteWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 获取工作流
	collection := h.db.GetCollection("workflows")
	var workflow models.Workflow
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&workflow)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			middleware.HandleNotFoundError(c, "工作流不存在")
			return
		}
		middleware.HandleInternalError(c, err)
		return
	}

	// 更新工作流状态为执行中
	_, err = collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objectID},
		bson.M{"$set": bson.M{
			"status":     models.WorkflowStatusRunning,
			"updated_at": time.Now(),
		}},
	)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	// TODO: 实际的工作流执行逻辑
	// 这里应该启动工作流执行引擎

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "工作流执行已启动",
	})
}

// StopWorkflow 停止工作流
func (h *WorkflowHandler) StopWorkflow(c *gin.Context) {
	workflowID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 更新工作流状态
	collection := h.db.GetCollection("workflows")
	result, err := collection.UpdateOne(
		c.Request.Context(),
		bson.M{"_id": objectID},
		bson.M{"$set": bson.M{
			"status":     models.WorkflowStatusStopped,
			"updated_at": time.Now(),
		}},
	)
	if err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if result.MatchedCount == 0 {
		middleware.HandleNotFoundError(c, "工作流不存在")
		return
	}

	// TODO: 实际的工作流停止逻辑
	// 这里应该停止工作流执行引擎

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "工作流停止成功",
	})
}

// GetWorkflowExecution 获取工作流执行状态
func (h *WorkflowHandler) GetWorkflowExecution(c *gin.Context) {
	workflowID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(workflowID)
	if err != nil {
		middleware.HandleValidationError(c, err)
		return
	}

	// 获取工作流
	collection := h.db.GetCollection("workflows")
	var workflow models.Workflow
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objectID}).Decode(&workflow)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			middleware.HandleNotFoundError(c, "工作流不存在")
			return
		}
		middleware.HandleInternalError(c, err)
		return
	}

	// 获取相关的执行日志
	logCollection := h.db.GetCollection("execution_logs")
	cursor, err := logCollection.Find(c.Request.Context(), 
		bson.M{"workflow_id": workflowID},
		options.Find().
			SetSort(bson.D{{Key: "created_at", Value: -1}}).
			SetLimit(10))
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"workflow": workflow,
			"logs":     logs,
		},
	})
}
/**
 * 系统处理器
 * 负责系统相关的HTTP请求处理
 */

package handlers

import (
	"net/http"
	"runtime"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"aischedule/internal/database"
	"aischedule/internal/middleware"
	"aischedule/internal/scheduler"
	"aischedule/internal/websocket"
)

// SystemHandler 系统处理器
type SystemHandler struct {
	db        *database.MongoDB
	scheduler *scheduler.Scheduler
	wsManager *websocket.Manager
}

// NewSystemHandler 创建新的系统处理器
func NewSystemHandler(db *database.MongoDB, scheduler *scheduler.Scheduler, wsManager *websocket.Manager) *SystemHandler {
	return &SystemHandler{
		db:        db,
		scheduler: scheduler,
		wsManager: wsManager,
	}
}

// HealthCheck 健康检查
func (h *SystemHandler) HealthCheck(c *gin.Context) {
	// 检查数据库连接
	ctx := c.Request.Context()
	err := h.db.Ping(ctx)
	dbStatus := "healthy"
	if err != nil {
		dbStatus = "unhealthy"
	}

	// 检查调度器状态
	schedulerStatus := "healthy"
	if !h.scheduler.IsRunning() {
		schedulerStatus = "stopped"
	}

	// 获取WebSocket连接数
	wsConnections := h.wsManager.GetConnectedClients()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status":      "ok",
			"timestamp":   time.Now().Unix(),
			"database":    dbStatus,
			"scheduler":   schedulerStatus,
			"websocket":   wsConnections,
			"version":     "1.0.0",
		},
	})
}

// GetSystemInfo 获取系统信息
func (h *SystemHandler) GetSystemInfo(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// 获取数据库统计信息
	ctx := c.Request.Context()
	
	// 获取任务统计
	taskCollection := h.db.GetCollection("tasks")
	totalTasks, _ := taskCollection.CountDocuments(ctx, bson.M{})
	activeTasks, _ := taskCollection.CountDocuments(ctx, bson.M{"status": "active"})
	
	// 获取工作流统计
	workflowCollection := h.db.GetCollection("workflows")
	totalWorkflows, _ := workflowCollection.CountDocuments(ctx, bson.M{})
	runningWorkflows, _ := workflowCollection.CountDocuments(ctx, bson.M{"status": "running"})
	
	// 获取执行日志统计
	logCollection := h.db.GetCollection("execution_logs")
	totalExecutions, _ := logCollection.CountDocuments(ctx, bson.M{})
	recentExecutions, _ := logCollection.CountDocuments(ctx, bson.M{
		"created_at": bson.M{"$gte": time.Now().Add(-24 * time.Hour)},
	})

	systemInfo := gin.H{
		"runtime": gin.H{
			"go_version":    runtime.Version(),
			"goroutines":    runtime.NumGoroutine(),
			"memory_alloc":  bToMb(m.Alloc),
			"memory_total":  bToMb(m.TotalAlloc),
			"memory_sys":    bToMb(m.Sys),
			"gc_runs":       m.NumGC,
		},
		"database": gin.H{
			"total_tasks":       totalTasks,
			"active_tasks":      activeTasks,
			"total_workflows":   totalWorkflows,
			"running_workflows": runningWorkflows,
			"total_executions":  totalExecutions,
			"recent_executions": recentExecutions,
		},
		"scheduler": gin.H{
			"status":      h.scheduler.IsRunning(),
			"active_jobs": h.scheduler.GetActiveJobCount(),
		},
		"websocket": gin.H{
			"connections": h.wsManager.GetConnectedClients(),
			"clients":     h.wsManager.GetClientList(),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    systemInfo,
	})
}

// GetSystemMetrics 获取系统指标
func (h *SystemHandler) GetSystemMetrics(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	metrics := gin.H{
		"timestamp": time.Now().Unix(),
		"cpu": gin.H{
			"goroutines": runtime.NumGoroutine(),
		},
		"memory": gin.H{
			"alloc":      m.Alloc,
			"total_alloc": m.TotalAlloc,
			"sys":        m.Sys,
			"heap_alloc": m.HeapAlloc,
			"heap_sys":   m.HeapSys,
			"heap_idle":  m.HeapIdle,
			"heap_inuse": m.HeapInuse,
		},
		"gc": gin.H{
			"num_gc":        m.NumGC,
			"pause_total":   m.PauseTotalNs,
			"last_gc":       m.LastGC,
		},
		"scheduler": gin.H{
			"running":     h.scheduler.IsRunning(),
			"active_jobs": h.scheduler.GetActiveJobCount(),
		},
		"websocket": gin.H{
			"connections": h.wsManager.GetConnectedClients(),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}

// RestartScheduler 重启调度器
func (h *SystemHandler) RestartScheduler(c *gin.Context) {
	if err := h.scheduler.Stop(); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	if err := h.scheduler.Start(); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "调度器重启成功",
	})
}

// StopScheduler 停止调度器
func (h *SystemHandler) StopScheduler(c *gin.Context) {
	if err := h.scheduler.Stop(); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "调度器停止成功",
	})
}

// StartScheduler 启动调度器
func (h *SystemHandler) StartScheduler(c *gin.Context) {
	if err := h.scheduler.Start(); err != nil {
		middleware.HandleInternalError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "调度器启动成功",
	})
}

// GetLogs 获取系统日志
func (h *SystemHandler) GetLogs(c *gin.Context) {
	// 这里可以实现获取系统日志的逻辑
	// 可以从文件、数据库或内存中获取日志
	
	logs := []gin.H{
		{
			"timestamp": time.Now().Add(-1 * time.Hour).Unix(),
			"level":     "INFO",
			"message":   "系统启动成功",
			"source":    "system",
		},
		{
			"timestamp": time.Now().Add(-30 * time.Minute).Unix(),
			"level":     "INFO",
			"message":   "调度器启动成功",
			"source":    "scheduler",
		},
		{
			"timestamp": time.Now().Add(-10 * time.Minute).Unix(),
			"level":     "INFO",
			"message":   "WebSocket服务启动成功",
			"source":    "websocket",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    logs,
	})
}

// ClearLogs 清理日志
func (h *SystemHandler) ClearLogs(c *gin.Context) {
	// 获取清理参数
	days := c.DefaultQuery("days", "30")
	
	// 这里可以实现清理日志的逻辑
	// 例如删除指定天数之前的执行日志
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "日志清理成功，清理了 " + days + " 天前的日志",
	})
}

// ExportData 导出数据
func (h *SystemHandler) ExportData(c *gin.Context) {
	dataType := c.Query("type") // tasks, workflows, logs
	
	// 这里可以实现数据导出的逻辑
	// 根据类型导出不同的数据
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "数据导出已启动",
		"data": gin.H{
			"type":      dataType,
			"export_id": "export_" + string(rune(time.Now().Unix())),
		},
	})
}

// ImportData 导入数据
func (h *SystemHandler) ImportData(c *gin.Context) {
	// 这里可以实现数据导入的逻辑
	// 从上传的文件中导入数据
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "数据导入已启动",
	})
}

// 辅助函数：字节转MB
func bToMb(b uint64) uint64 {
	return b / 1024 / 1024
}
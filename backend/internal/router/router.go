/**
 * 路由配置模块
 * 负责设置API路由和中间件
 */

package router

import (
	"aischedule/internal/database"
	"aischedule/internal/handlers"
	"aischedule/internal/middleware"
	"aischedule/internal/scheduler"
	"aischedule/internal/websocket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// Setup 设置路由
func Setup(db *mongo.Database, taskScheduler *scheduler.Scheduler, wsManager *websocket.Manager) *gin.Engine {
	// 创建MongoDB包装器
	mongodb := &database.MongoDB{}
	mongodb.SetDatabase(db)
	r := gin.Default()

	// CORS中间件
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:5173",
		"http://localhost:3000",
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// 请求日志中间件
	r.Use(middleware.Logger())

	// 错误处理中间件
	r.Use(middleware.ErrorHandler())

	// 初始化处理器
	taskHandler := handlers.NewTaskHandler(mongodb, taskScheduler)
	workflowHandler := handlers.NewWorkflowHandler(mongodb)
	executionLogHandler := handlers.NewExecutionLogHandler(mongodb)
	systemHandler := handlers.NewSystemHandler(mongodb, taskScheduler, wsManager)

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "AI Schedule MCP Tool Backend",
			"version": "1.0.0",
		})
	})

	// API路由组
	api := r.Group("/api/v1")
	{
		// 任务管理路由
		tasks := api.Group("/tasks")
		{
			tasks.GET("", taskHandler.GetTasks)
			tasks.POST("", taskHandler.CreateTask)
			tasks.GET("/:id", taskHandler.GetTask)
			tasks.PUT("/:id", taskHandler.UpdateTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
			tasks.POST("/:id/execute", taskHandler.ExecuteTask)
			tasks.POST("/:id/start", taskHandler.StartTask)
			tasks.POST("/:id/stop", taskHandler.StopTask)
		}

		// 工作流管理路由
		workflows := api.Group("/workflows")
		{
			workflows.GET("", workflowHandler.GetWorkflows)
			workflows.POST("", workflowHandler.CreateWorkflow)
			workflows.GET("/:id", workflowHandler.GetWorkflow)
			workflows.PUT("/:id", workflowHandler.UpdateWorkflow)
			workflows.DELETE("/:id", workflowHandler.DeleteWorkflow)
		}

		// 执行日志路由
		logs := api.Group("/logs")
		{
			logs.GET("", executionLogHandler.GetExecutionLogs)
			logs.GET("/:id", executionLogHandler.GetExecutionLog)
			logs.POST("", executionLogHandler.CreateExecutionLog)
			logs.PUT("/:id", executionLogHandler.UpdateExecutionLog)
			logs.POST("/:id/entries", executionLogHandler.AddLogEntry)
			logs.POST("/:id/metrics", executionLogHandler.AddPerformanceMetric)
			logs.DELETE("/:id", executionLogHandler.DeleteExecutionLog)
		}

		// 系统管理路由
		system := api.Group("/system")
		{
			system.GET("/info", systemHandler.GetSystemInfo)
			system.GET("/metrics", systemHandler.GetSystemMetrics)
			system.POST("/scheduler/restart", systemHandler.RestartScheduler)
			system.POST("/scheduler/stop", systemHandler.StopScheduler)
			system.POST("/scheduler/start", systemHandler.StartScheduler)
			system.GET("/logs", systemHandler.GetLogs)
			system.DELETE("/logs", systemHandler.ClearLogs)
		}

		// WebSocket路由 (暂时注释掉，需要实现WebSocket处理器)
		// ws := api.Group("/ws")
		// {
		// 	ws.GET("/logs", systemHandler.HandleWebSocket)
		// 	ws.GET("/status", systemHandler.HandleStatusWebSocket)
		// }
	}

	return r
}
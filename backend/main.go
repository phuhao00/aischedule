/**
 * AI Schedule MCP Tool - 后端主程序
 * 作者: AI Assistant
 * 创建时间: 2024
 */

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"aischedule/internal/config"
	"aischedule/internal/database"
	"aischedule/internal/router"
	"aischedule/internal/scheduler"
	"aischedule/internal/websocket"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 设置Gin模式
	gin.SetMode(cfg.GinMode)

	// 初始化数据库连接
	db, err := database.Connect(cfg.MongoURI, cfg.MongoDatabase)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Disconnect()

	// 初始化定时任务调度器
	taskScheduler := scheduler.New()
	taskScheduler.Start()
	defer taskScheduler.Stop()

	// 初始化WebSocket管理器
	wsManager := websocket.NewManager()
	go wsManager.Start()

	// 设置路由
	r := router.Setup(db, taskScheduler, wsManager)

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// 启动服务器
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// 设置5秒的超时时间来关闭服务器
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
}
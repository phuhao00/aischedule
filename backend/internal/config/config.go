/**
 * 配置管理模块
 * 负责加载和管理应用程序配置
 */

package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

// Config 应用程序配置结构
type Config struct {
	// 服务器配置
	Port    string
	GinMode string

	// 数据库配置
	MongoURI      string
	MongoDatabase string

	// JWT配置
	JWTSecret    string
	JWTExpiresIn time.Duration

	// MCP配置
	MCPServerURL string
	MCPTimeout   time.Duration

	// 日志配置
	LogLevel string
	LogFile  string

	// CORS配置
	AllowedOrigins []string
}

// Load 加载配置
func Load() *Config {
	// 尝试加载.env文件
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// 解析JWT过期时间
	jwtExpiresIn, err := time.ParseDuration(getEnv("JWT_EXPIRES_IN", "24h"))
	if err != nil {
		log.Printf("Invalid JWT_EXPIRES_IN format, using default: %v", err)
		jwtExpiresIn = 24 * time.Hour
	}

	// 解析MCP超时时间
	mcpTimeout, err := time.ParseDuration(getEnv("MCP_TIMEOUT", "30s"))
	if err != nil {
		log.Printf("Invalid MCP_TIMEOUT format, using default: %v", err)
		mcpTimeout = 30 * time.Second
	}

	return &Config{
		Port:    getEnv("PORT", "8080"),
		GinMode: getEnv("GIN_MODE", "debug"),

		MongoURI:      getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDatabase: getEnv("MONGODB_DATABASE", "aischedule"),

		JWTSecret:    getEnv("JWT_SECRET", "your-super-secret-jwt-key"),
		JWTExpiresIn: jwtExpiresIn,

		MCPServerURL: getEnv("MCP_SERVER_URL", "ws://localhost:3001"),
		MCPTimeout:   mcpTimeout,

		LogLevel: getEnv("LOG_LEVEL", "info"),
		LogFile:  getEnv("LOG_FILE", "logs/app.log"),

		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:3000",
		},
	}
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
/**
 * 日志中间件
 * 记录HTTP请求和响应信息
 */

package middleware

import (
	"bytes"
	"io"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// responseWriter 包装响应写入器以捕获响应体
type responseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// Logger 请求日志中间件
func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return ""
	})
}

// DetailedLogger 详细日志中间件（可选）
func DetailedLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// 读取请求体
		var requestBody []byte
		if c.Request.Body != nil {
			requestBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(requestBody))
		}

		// 包装响应写入器
		w := &responseWriter{
			ResponseWriter: c.Writer,
			body:          bytes.NewBufferString(""),
		}
		c.Writer = w

		// 处理请求
		c.Next()

		// 计算延迟
		latency := time.Since(start)

		// 构建完整路径
		if raw != "" {
			path = path + "?" + raw
		}

		// 记录详细日志
		log.Printf("[%s] %s %s %d %v | Request: %s | Response: %s",
			c.Request.Method,
			path,
			c.ClientIP(),
			c.Writer.Status(),
			latency,
			string(requestBody),
			w.body.String(),
		)
	}
}
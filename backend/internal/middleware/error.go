/**
 * 错误处理中间件
 * 统一处理API错误响应
 */

package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse 错误响应结构
type ErrorResponse struct {
	Error   string      `json:"error"`
	Message string      `json:"message"`
	Code    int         `json:"code"`
	Details interface{} `json:"details,omitempty"`
}

// ErrorHandler 错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// 检查是否有错误
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			
			// 记录错误日志
			log.Printf("Error in %s %s: %v", c.Request.Method, c.Request.URL.Path, err.Err)

			// 根据错误类型返回不同的HTTP状态码
			var statusCode int
			var errorType string

			switch err.Type {
			case gin.ErrorTypeBind:
				statusCode = http.StatusBadRequest
				errorType = "validation_error"
			case gin.ErrorTypePublic:
				statusCode = http.StatusBadRequest
				errorType = "client_error"
			default:
				statusCode = http.StatusInternalServerError
				errorType = "internal_error"
			}

			// 如果响应还没有写入，返回错误响应
			if !c.Writer.Written() {
				c.JSON(statusCode, ErrorResponse{
					Error:   errorType,
					Message: err.Error(),
					Code:    statusCode,
				})
			}
		}
	}
}

// HandleError 手动处理错误的辅助函数
func HandleError(c *gin.Context, statusCode int, errorType string, message string, details interface{}) {
	c.JSON(statusCode, ErrorResponse{
		Error:   errorType,
		Message: message,
		Code:    statusCode,
		Details: details,
	})
	c.Abort()
}

// HandleValidationError 处理验证错误
func HandleValidationError(c *gin.Context, err error) {
	HandleError(c, http.StatusBadRequest, "validation_error", err.Error(), nil)
}

// HandleNotFoundError 处理资源未找到错误
func HandleNotFoundError(c *gin.Context, resource string) {
	HandleError(c, http.StatusNotFound, "not_found", resource+" not found", nil)
}

// HandleInternalError 处理内部服务器错误
func HandleInternalError(c *gin.Context, err error) {
	log.Printf("Internal error: %v", err)
	HandleError(c, http.StatusInternalServerError, "internal_error", "Internal server error", nil)
}

// HandleUnauthorizedError 处理未授权错误
func HandleUnauthorizedError(c *gin.Context) {
	HandleError(c, http.StatusUnauthorized, "unauthorized", "Authentication required", nil)
}

// HandleForbiddenError 处理禁止访问错误
func HandleForbiddenError(c *gin.Context) {
	HandleError(c, http.StatusForbidden, "forbidden", "Access denied", nil)
}
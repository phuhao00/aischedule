/**
 * MongoDB数据库连接和管理模块
 * 负责数据库连接、断开和基本操作
 */

package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	client   *mongo.Client
	database *mongo.Database
)

// MongoDB 数据库管理器
type MongoDB struct {
	client   *mongo.Client
	database *mongo.Database
}

// NewMongoDB 创建新的MongoDB管理器
func NewMongoDB(uri, dbName string) (*MongoDB, error) {
	db, err := Connect(uri, dbName)
	if err != nil {
		return nil, err
	}
	
	return &MongoDB{
		client:   client,
		database: db,
	}, nil
}

// GetCollection 获取集合
func (m *MongoDB) GetCollection(name string) *mongo.Collection {
	return m.database.Collection(name)
}

// Close 关闭数据库连接
func (m *MongoDB) Close() error {
	return Disconnect()
}

// Ping 检查数据库连接
func (m *MongoDB) Ping(ctx context.Context) error {
	return m.client.Ping(ctx, nil)
}

// SetDatabase 设置数据库实例
func (m *MongoDB) SetDatabase(db *mongo.Database) {
	m.database = db
	m.client = db.Client()
}

// Connect 连接到MongoDB数据库
func Connect(uri, dbName string) (*mongo.Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 设置客户端选项
	clientOptions := options.Client().ApplyURI(uri)

	// 连接到MongoDB
	var err error
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// 检查连接
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, err
	}

	database = client.Database(dbName)
	log.Printf("Connected to MongoDB database: %s", dbName)

	// 创建索引
	if err := createIndexes(); err != nil {
		log.Printf("Warning: Failed to create indexes: %v", err)
	}

	return database, nil
}

// Disconnect 断开数据库连接
func Disconnect() error {
	if client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := client.Disconnect(ctx)
	if err != nil {
		return err
	}

	log.Println("Disconnected from MongoDB")
	return nil
}

// GetDatabase 获取数据库实例
func GetDatabase() *mongo.Database {
	return database
}

// GetCollection 获取集合
func GetCollection(name string) *mongo.Collection {
	return database.Collection(name)
}

// createIndexes 创建数据库索引
func createIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 任务集合索引
	tasksCollection := GetCollection("tasks")
	taskIndexes := []mongo.IndexModel{
		{
			Keys: map[string]interface{}{
				"user_id": 1,
				"status":  1,
			},
		},
		{
			Keys: map[string]interface{}{
				"next_run": 1,
			},
		},
		{
			Keys: map[string]interface{}{
				"created_at": -1,
			},
		},
	}

	_, err := tasksCollection.Indexes().CreateMany(ctx, taskIndexes)
	if err != nil {
		return err
	}

	// 执行日志集合索引
	logsCollection := GetCollection("execution_logs")
	logIndexes := []mongo.IndexModel{
		{
			Keys: map[string]interface{}{
				"task_id": 1,
				"started_at": -1,
			},
		},
		{
			Keys: map[string]interface{}{
				"status": 1,
			},
		},
	}

	_, err = logsCollection.Indexes().CreateMany(ctx, logIndexes)
	if err != nil {
		return err
	}

	// Agent工作流集合索引
	workflowsCollection := GetCollection("workflows")
	workflowIndexes := []mongo.IndexModel{
		{
			Keys: map[string]interface{}{
				"user_id": 1,
				"type":    1,
			},
		},
		{
			Keys: map[string]interface{}{
				"is_template": 1,
			},
		},
	}

	_, err = workflowsCollection.Indexes().CreateMany(ctx, workflowIndexes)
	if err != nil {
		return err
	}

	log.Println("Database indexes created successfully")
	return nil
}
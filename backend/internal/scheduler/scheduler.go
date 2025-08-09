/**
 * 任务调度器模块
 * 负责定时任务的调度和执行管理
 */

package scheduler

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/robfig/cron/v3"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"aischedule/internal/models"
)

// TaskExecutor 任务执行器接口
type TaskExecutor interface {
	Execute(ctx context.Context, task *models.Task) error
}

// Scheduler 任务调度器
type Scheduler struct {
	cron     *cron.Cron
	tasks    map[primitive.ObjectID]*ScheduledTask
	executor TaskExecutor
	mutex    sync.RWMutex
	running  bool
}

// ScheduledTask 已调度的任务
type ScheduledTask struct {
	Task    *models.Task
	EntryID cron.EntryID
	NextRun time.Time
}

// New 创建新的调度器
func New() *Scheduler {
	return &Scheduler{
		cron:  cron.New(cron.WithSeconds()),
		tasks: make(map[primitive.ObjectID]*ScheduledTask),
		mutex: sync.RWMutex{},
	}
}

// SetExecutor 设置任务执行器
func (s *Scheduler) SetExecutor(executor TaskExecutor) {
	s.executor = executor
}

// Start 启动调度器
func (s *Scheduler) Start() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.running {
		return nil
	}

	s.cron.Start()
	s.running = true
	log.Println("Task scheduler started")
	return nil
}

// Stop 停止调度器
func (s *Scheduler) Stop() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if !s.running {
		return nil
	}

	ctx := s.cron.Stop()
	<-ctx.Done()
	s.running = false
	log.Println("Task scheduler stopped")
	return nil
}

// AddTask 添加任务到调度器
func (s *Scheduler) AddTask(task *models.Task) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// 如果任务已存在，先移除
	if existingTask, exists := s.tasks[task.ID]; exists {
		s.cron.Remove(existingTask.EntryID)
	}

	// 解析Cron表达式
	entryID, err := s.cron.AddFunc(task.CronConfig.Expression, func() {
		s.executeTask(task)
	})
	if err != nil {
		return err
	}

	// 计算下次运行时间
	nextRun := s.cron.Entry(entryID).Next

	// 保存调度任务
	s.tasks[task.ID] = &ScheduledTask{
		Task:    task,
		EntryID: entryID,
		NextRun: nextRun,
	}

	log.Printf("Task %s scheduled, next run: %v", task.Name, nextRun)
	return nil
}

// RemoveTask 从调度器中移除任务
func (s *Scheduler) RemoveTask(taskID primitive.ObjectID) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if scheduledTask, exists := s.tasks[taskID]; exists {
		s.cron.Remove(scheduledTask.EntryID)
		delete(s.tasks, taskID)
		log.Printf("Task %s removed from scheduler", scheduledTask.Task.Name)
	}
}

// PauseTask 暂停任务
func (s *Scheduler) PauseTask(taskID primitive.ObjectID) {
	s.RemoveTask(taskID)
}

// ResumeTask 恢复任务
func (s *Scheduler) ResumeTask(task *models.Task) error {
	return s.AddTask(task)
}

// GetScheduledTasks 获取所有已调度的任务
func (s *Scheduler) GetScheduledTasks() map[primitive.ObjectID]*ScheduledTask {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// 创建副本以避免并发问题
	result := make(map[primitive.ObjectID]*ScheduledTask)
	for id, task := range s.tasks {
		result[id] = task
	}
	return result
}

// GetTaskNextRun 获取任务的下次运行时间
func (s *Scheduler) GetTaskNextRun(taskID primitive.ObjectID) *time.Time {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if scheduledTask, exists := s.tasks[taskID]; exists {
		return &scheduledTask.NextRun
	}
	return nil
}

// IsTaskScheduled 检查任务是否已调度
func (s *Scheduler) IsTaskScheduled(taskID primitive.ObjectID) bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	_, exists := s.tasks[taskID]
	return exists
}

// ExecuteTaskNow 立即执行任务
func (s *Scheduler) ExecuteTaskNow(task *models.Task) {
	go s.executeTask(task)
}

// IsRunning 检查调度器是否正在运行
func (s *Scheduler) IsRunning() bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.running
}

// GetActiveJobCount 获取活跃任务数量
func (s *Scheduler) GetActiveJobCount() int {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return len(s.tasks)
}

// ValidateCronExpression 验证Cron表达式
func (s *Scheduler) ValidateCronExpression(expression string) error {
	_, err := cron.ParseStandard(expression)
	return err
}

// executeTask 执行任务的内部方法
func (s *Scheduler) executeTask(task *models.Task) {
	log.Printf("Executing task: %s", task.Name)

	// 更新最后运行时间
	now := time.Now()
	task.LastRun = &now

	// 如果设置了执行器，使用执行器执行任务
	if s.executor != nil {
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(task.AgentConfig.Timeout)*time.Second)
		defer cancel()

		err := s.executor.Execute(ctx, task)
		if err != nil {
			log.Printf("Task execution failed: %s, error: %v", task.Name, err)
			task.FailureCount++
		} else {
			log.Printf("Task executed successfully: %s", task.Name)
			task.SuccessCount++
		}
	} else {
		log.Printf("No executor set for task: %s", task.Name)
	}

	// 更新执行计数
	task.ExecutionCount++

	// 更新下次运行时间
	s.mutex.Lock()
	if scheduledTask, exists := s.tasks[task.ID]; exists {
		scheduledTask.NextRun = s.cron.Entry(scheduledTask.EntryID).Next
		task.NextRun = &scheduledTask.NextRun
	}
	s.mutex.Unlock()
}

// GetStats 获取调度器统计信息
func (s *Scheduler) GetStats() map[string]interface{} {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	totalTasks := len(s.tasks)
	runningTasks := 0
	
	// 统计正在运行的任务数量
	for _, task := range s.tasks {
		if task.Task.Status == models.TaskStatusActive {
			runningTasks++
		}
	}

	return map[string]interface{}{
		"total_scheduled_tasks": totalTasks,
		"running_tasks":        runningTasks,
		"scheduler_running":    s.running,
		"cron_entries":         len(s.cron.Entries()),
	}
}
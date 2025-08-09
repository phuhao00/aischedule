/**
 * AI Schedule MCP Tool - 任务调度中心页面
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { useAppStore, useFilteredTasks, useTaskStats, Task, TaskStatus, TaskPriority } from '@/store';
import { cn } from '@/lib/utils';

// 状态标签组件
function StatusBadge({ status }: { status: TaskStatus }) {
  const statusConfig = {
    [TaskStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: '等待中' },
    [TaskStatus.RUNNING]: { color: 'bg-blue-100 text-blue-800', icon: Play, label: '运行中' },
    [TaskStatus.SUCCESS]: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: '成功' },
    [TaskStatus.FAILED]: { color: 'bg-red-100 text-red-800', icon: XCircle, label: '失败' },
    [TaskStatus.PAUSED]: { color: 'bg-gray-100 text-gray-800', icon: Pause, label: '暂停' }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.color)}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
}

// 优先级标签组件
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const priorityConfig = {
    [TaskPriority.LOW]: { color: 'bg-gray-100 text-gray-800', label: '低' },
    [TaskPriority.MEDIUM]: { color: 'bg-blue-100 text-blue-800', label: '中' },
    [TaskPriority.HIGH]: { color: 'bg-orange-100 text-orange-800', label: '高' },
    [TaskPriority.URGENT]: { color: 'bg-red-100 text-red-800', label: '紧急' }
  };
  
  const config = priorityConfig[priority];
  
  return (
    <span className={cn('inline-flex items-center px-2 py-1 rounded text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
}

// 任务卡片组件
function TaskCard({ task }: { task: Task }) {
  const { updateTask, deleteTask } = useAppStore();
  const [showActions, setShowActions] = useState(false);
  
  const handleToggleStatus = () => {
    const newStatus = task.status === TaskStatus.RUNNING ? TaskStatus.PAUSED : TaskStatus.RUNNING;
    updateTask(task.id, { status: newStatus });
  };
  
  const handleDelete = () => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTask(task.id);
    }
  };
  
  const successRate = task.executionCount > 0 ? (task.successCount / task.executionCount * 100).toFixed(1) : '0';
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
          
          <div className="flex items-center space-x-3 mb-3">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>Cron: {task.cronExpression}</p>
            <p>上次运行: {task.lastRun ? new Date(task.lastRun).toLocaleString() : '从未运行'}</p>
            <p>下次运行: {task.nextRun ? new Date(task.nextRun).toLocaleString() : '未安排'}</p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={handleToggleStatus}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {task.status === TaskStatus.RUNNING ? (
                  <><Pause className="w-4 h-4" /><span>暂停任务</span></>
                ) : (
                  <><Play className="w-4 h-4" /><span>启动任务</span></>
                )}
              </button>
              <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Edit className="w-4 h-4" />
                <span>编辑任务</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除任务</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 执行统计 */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{task.executionCount}</p>
            <p className="text-xs text-gray-500">总执行次数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{task.successCount}</p>
            <p className="text-xs text-gray-500">成功次数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
            <p className="text-xs text-gray-500">成功率</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { taskFilters, setTaskFilters, addTask } = useAppStore();
  const filteredTasks = useFilteredTasks();
  const taskStats = useTaskStats();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // 模拟数据初始化
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: '1',
        name: '代码质量检查',
        description: '每日自动运行代码质量检查，包括ESLint、TypeScript检查等',
        cronExpression: '0 9 * * *',
        status: TaskStatus.RUNNING,
        priority: TaskPriority.HIGH,
        agentId: 'agent-1',
        workflowId: 'workflow-1',
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        executionCount: 15,
        successCount: 14,
        failureCount: 1
      },
      {
        id: '2',
        name: '自动化测试',
        description: '运行单元测试和集成测试，确保代码质量',
        cronExpression: '0 */2 * * *',
        status: TaskStatus.SUCCESS,
        priority: TaskPriority.MEDIUM,
        agentId: 'agent-2',
        workflowId: 'workflow-2',
        lastRun: new Date(Date.now() - 30 * 60 * 1000),
        nextRun: new Date(Date.now() + 90 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        executionCount: 36,
        successCount: 35,
        failureCount: 1
      },
      {
        id: '3',
        name: '部署到测试环境',
        description: '自动部署最新代码到测试环境',
        cronExpression: '0 18 * * 1-5',
        status: TaskStatus.FAILED,
        priority: TaskPriority.URGENT,
        agentId: 'agent-3',
        workflowId: 'workflow-3',
        lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000),
        nextRun: new Date(Date.now() + 14 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        executionCount: 8,
        successCount: 6,
        failureCount: 2
      }
    ];
    
    // 只在没有任务时添加模拟数据
    if (filteredTasks.length === 0) {
      mockTasks.forEach(task => addTask(task));
    }
  }, []);
  
  return (
    <div className="p-6">
      {/* 页面标题和操作 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">任务调度中心</h1>
            <p className="text-gray-600 mt-2">管理和监控所有定时任务的执行状态</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>创建任务</span>
          </button>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                <p className="text-sm text-gray-600">总任务数</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{taskStats.running}</p>
                <p className="text-sm text-gray-600">运行中</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{taskStats.pending}</p>
                <p className="text-sm text-gray-600">等待中</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{taskStats.success}</p>
                <p className="text-sm text-gray-600">成功</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{taskStats.failed}</p>
                <p className="text-sm text-gray-600">失败</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 筛选器 */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">筛选:</span>
          </div>
          
          <select
            value={taskFilters.status}
            onChange={(e) => setTaskFilters({ status: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有状态</option>
            <option value={TaskStatus.RUNNING}>运行中</option>
            <option value={TaskStatus.PENDING}>等待中</option>
            <option value={TaskStatus.SUCCESS}>成功</option>
            <option value={TaskStatus.FAILED}>失败</option>
            <option value={TaskStatus.PAUSED}>暂停</option>
          </select>
          
          <select
            value={taskFilters.priority}
            onChange={(e) => setTaskFilters({ priority: e.target.value as any })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有优先级</option>
            <option value={TaskPriority.URGENT}>紧急</option>
            <option value={TaskPriority.HIGH}>高</option>
            <option value={TaskPriority.MEDIUM}>中</option>
            <option value={TaskPriority.LOW}>低</option>
          </select>
        </div>
      </div>
      
      {/* 任务列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
          <p className="text-gray-600 mb-4">开始创建您的第一个定时任务</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>创建任务</span>
          </button>
        </div>
      )}
    </div>
  );
}
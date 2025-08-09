/**
 * AI Schedule MCP Tool - 执行监控面板页面
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Pause, 
  Play, 
  RotateCcw, 
  Filter, 
  Search, 
  Download, 
  RefreshCw, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Terminal,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAppStore, ExecutionLog } from '@/store';
import { cn } from '@/lib/utils';

// 状态标签组件
function StatusBadge({ status }: { status: ExecutionLog['status'] }) {
  const statusConfig = {
    running: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: '运行中' },
    completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: '已完成' },
    failed: { icon: XCircle, color: 'bg-red-100 text-red-800', label: '失败' },
    cancelled: { icon: Pause, color: 'bg-gray-100 text-gray-800', label: '已取消' }
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={cn('inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
}

// 执行日志卡片组件
function ExecutionLogCard({ log }: { log: ExecutionLog }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`;
    return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分钟`;
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{log.taskName}</h3>
            <StatusBadge status={log.status} />
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{log.startTime.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(log.startTime, log.endTime)}</span>
            </div>
            {log.agentId && (
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4" />
                <span>Agent: {log.agentId}</span>
              </div>
            )}
          </div>
          
          {log.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">执行错误</p>
                  <p className="text-sm text-red-700 mt-1">{log.error}</p>
                </div>
              </div>
            </div>
          )}
          
          {log.result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">执行结果</p>
                  <p className="text-sm text-green-700 mt-1">{log.result}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {log.status === 'running' && (
            <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="停止执行">
              <Pause className="w-4 h-4" />
            </button>
          )}
          
          {(log.status === 'failed' || log.status === 'cancelled') && (
            <button className="p-2 text-blue-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="重新执行">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="查看日志">
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 详细信息 */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-1">任务ID</p>
              <p className="text-gray-600 font-mono">{log.taskId}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">执行ID</p>
              <p className="text-gray-600 font-mono">{log.id}</p>
            </div>
            {log.agentId && (
              <div>
                <p className="font-medium text-gray-900 mb-1">Agent ID</p>
                <p className="text-gray-600 font-mono">{log.agentId}</p>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 mb-1">触发方式</p>
              <p className="text-gray-600">定时触发</p>
            </div>
          </div>
          
          {log.metadata && (
            <div className="mt-4">
              <p className="font-medium text-gray-900 mb-2">元数据</p>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 统计卡片组件
function StatCard({ title, value, change, icon: Icon, color }: {
  title: string;
  value: string | number;
  change?: { value: number; trend: 'up' | 'down' };
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className={cn(
              'flex items-center space-x-1 mt-2 text-sm',
              change.trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {change.trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', color)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// 实时监控组件
function RealTimeMonitor() {
  const [metrics, setMetrics] = useState({
    activeJobs: 3,
    queuedJobs: 7,
    cpuUsage: 45,
    memoryUsage: 62,
    networkIO: 1.2,
    diskIO: 0.8
  });
  
  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        networkIO: Math.max(0, prev.networkIO + (Math.random() - 0.5) * 0.5),
        diskIO: Math.max(0, prev.diskIO + (Math.random() - 0.5) * 0.3)
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">实时监控</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">CPU使用率</span>
            <span className="text-sm text-gray-600">{metrics.cpuUsage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.cpuUsage}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">内存使用率</span>
            <span className="text-sm text-gray-600">{metrics.memoryUsage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.memoryUsage}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">网络I/O</span>
            <span className="text-sm text-gray-600">{metrics.networkIO.toFixed(1)} MB/s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.networkIO * 20)}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">磁盘I/O</span>
            <span className="text-sm text-gray-600">{metrics.diskIO.toFixed(1)} MB/s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.diskIO * 25)}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600">活跃任务: {metrics.activeJobs}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-gray-600">队列任务: {metrics.queuedJobs}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500">最后更新: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function Monitor() {
  const { executionLogs, setExecutionLogs } = useAppStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('today');
  
  // 模拟数据初始化
  useEffect(() => {
    const mockLogs: ExecutionLog[] = [
      {
        id: 'exec-1',
        taskId: 'task-1',
        taskName: '代码质量检查',
        status: 'completed',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        result: '检查完成，发现3个警告，0个错误',
        agentId: 'agent-1',
        metadata: {
          lintWarnings: 3,
          lintErrors: 0,
          coverage: 85.2,
          filesChecked: 42
        }
      },
      {
        id: 'exec-2',
        taskId: 'task-2',
        taskName: '自动化测试',
        status: 'running',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        agentId: 'agent-2',
        metadata: {
          currentStep: '集成测试',
          progress: 65,
          testsRun: 128,
          testsPassed: 125
        }
      },
      {
        id: 'exec-3',
        taskId: 'task-3',
        taskName: '部署到生产环境',
        status: 'failed',
        startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 10 * 60 * 1000),
        error: '部署失败：数据库连接超时',
        agentId: 'agent-3',
        metadata: {
          deploymentStage: 'database-migration',
          errorCode: 'DB_TIMEOUT',
          retryCount: 3
        }
      },
      {
        id: 'exec-4',
        taskId: 'task-4',
        taskName: '文档生成',
        status: 'completed',
        startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 6 * 60 * 60 * 1000 + 3 * 60 * 1000),
        result: '文档生成完成，共生成15个页面',
        agentId: 'agent-1',
        metadata: {
          pagesGenerated: 15,
          apiEndpoints: 42,
          codeExamples: 28
        }
      },
      {
        id: 'exec-5',
        taskId: 'task-1',
        taskName: '代码质量检查',
        status: 'cancelled',
        startTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 8 * 60 * 60 * 1000 + 2 * 60 * 1000),
        agentId: 'agent-1',
        metadata: {
          reason: 'user_cancelled',
          progress: 25
        }
      }
    ];
    
    if (executionLogs.length === 0) {
      setExecutionLogs(mockLogs);
    }
  }, []);
  
  // 筛选日志
  const filteredLogs = executionLogs.filter(log => {
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSearch = log.taskName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 时间范围筛选
    const now = new Date();
    let matchesTime = true;
    
    if (timeRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchesTime = log.startTime >= today;
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesTime = log.startTime >= weekAgo;
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesTime = log.startTime >= monthAgo;
    }
    
    return matchesStatus && matchesSearch && matchesTime;
  });
  
  // 计算统计数据
  const stats = {
    total: executionLogs.length,
    running: executionLogs.filter(log => log.status === 'running').length,
    completed: executionLogs.filter(log => log.status === 'completed').length,
    failed: executionLogs.filter(log => log.status === 'failed').length,
    successRate: executionLogs.length > 0 
      ? Math.round((executionLogs.filter(log => log.status === 'completed').length / executionLogs.length) * 100)
      : 0
  };
  
  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">执行监控面板</h1>
            <p className="text-gray-600 mt-2">实时监控任务执行状态和系统性能</p>
          </div>
          
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>导出日志</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
        </div>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="总执行次数"
            value={stats.total}
            icon={BarChart3}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="运行中"
            value={stats.running}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title="已完成"
            value={stats.completed}
            change={{ value: 12, trend: 'up' }}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="失败"
            value={stats.failed}
            change={{ value: 5, trend: 'down' }}
            icon={XCircle}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            title="成功率"
            value={`${stats.successRate}%`}
            change={{ value: 3, trend: 'up' }}
            icon={TrendingUp}
            color="bg-purple-100 text-purple-600"
          />
        </div>
        
        {/* 实时监控 */}
        <div className="mb-8">
          <RealTimeMonitor />
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有状态</option>
              <option value="running">运行中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有时间</option>
            <option value="today">今天</option>
            <option value="week">最近一周</option>
            <option value="month">最近一月</option>
          </select>
        </div>
      </div>
      
      {/* 执行日志列表 */}
      <div>
        {filteredLogs.length > 0 ? (
          <div className="space-y-4">
            {filteredLogs.map(log => (
              <ExecutionLogCard key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无执行记录</h3>
            <p className="text-gray-600">当任务开始执行时，执行记录将显示在这里</p>
          </div>
        )}
      </div>
    </div>
  );
}
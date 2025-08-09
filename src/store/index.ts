/**
 * AI Schedule MCP Tool - 全局状态管理
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { create } from 'zustand';

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  PAUSED = 'paused'
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 任务接口定义
export interface Task {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  status: TaskStatus;
  priority: TaskPriority;
  agentId: string;
  workflowId: string;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
}

// Agent接口定义
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  version: string;
  lastHeartbeat: Date;
}

// 工作流接口定义
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isTemplate: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop';
  config: Record<string, any>;
  nextSteps: string[];
  position: { x: number; y: number };
}

// 执行日志接口定义
export interface ExecutionLog {
  id: string;
  taskId: string;
  taskName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: string;
  error?: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

// 系统配置接口定义
export interface SystemConfig {
  mcpServer: {
    url: string;
    apiKey: string;
    timeout: number;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: string;
  };
  performance: {
    maxConcurrentTasks: number;
    logRetentionDays: number;
  };
}

// 主状态接口
interface AppState {
  // 任务相关状态
  tasks: Task[];
  selectedTask: Task | null;
  taskFilters: {
    status: TaskStatus | 'all';
    priority: TaskPriority | 'all';
    search: string;
  };
  
  // Agent相关状态
  agents: Agent[];
  selectedAgent: Agent | null;
  
  // 工作流相关状态
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  
  // 执行日志状态
  executionLogs: ExecutionLog[];
  
  // 系统配置状态
  systemConfig: SystemConfig;
  
  // UI状态
  sidebarCollapsed: boolean;
  currentPage: string;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setSelectedTask: (task: Task | null) => void;
  setTaskFilters: (filters: Partial<AppState['taskFilters']>) => void;
  
  setAgents: (agents: Agent[]) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  setSelectedWorkflow: (workflow: Workflow | null) => void;
  
  setExecutionLogs: (logs: ExecutionLog[]) => void;
  addExecutionLog: (log: ExecutionLog) => void;
  
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
}

// 创建状态store
export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  tasks: [],
  selectedTask: null,
  taskFilters: {
    status: 'all',
    priority: 'all',
    search: ''
  },
  
  agents: [],
  selectedAgent: null,
  
  workflows: [],
  selectedWorkflow: null,
  
  executionLogs: [],
  
  systemConfig: {
    mcpServer: {
      url: 'http://localhost:3001',
      apiKey: '',
      timeout: 30000
    },
    notifications: {
      email: false,
      slack: false,
      webhook: ''
    },
    performance: {
      maxConcurrentTasks: 5,
      logRetentionDays: 30
    }
  },
  
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  
  // Actions实现
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
    )
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id),
    selectedTask: state.selectedTask?.id === id ? null : state.selectedTask
  })),
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  setTaskFilters: (filters) => set((state) => ({
    taskFilters: { ...state.taskFilters, ...filters }
  })),
  
  setAgents: (agents) => set({ agents }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  
  setWorkflows: (workflows) => set({ workflows }),
  
  addWorkflow: (workflow) => set((state) => ({
    workflows: [...state.workflows, workflow]
  })),
  
  updateWorkflow: (id, updates) => set((state) => ({
    workflows: state.workflows.map(workflow => 
      workflow.id === id ? { ...workflow, ...updates, updatedAt: new Date() } : workflow
    )
  })),
  
  deleteWorkflow: (id) => set((state) => ({
    workflows: state.workflows.filter(workflow => workflow.id !== id),
    selectedWorkflow: state.selectedWorkflow?.id === id ? null : state.selectedWorkflow
  })),
  
  setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow }),
  
  setExecutionLogs: (logs) => set({ executionLogs: logs }),
  
  addExecutionLog: (log) => set((state) => ({
    executionLogs: [log, ...state.executionLogs]
  })),
  
  updateSystemConfig: (config) => set((state) => ({
    systemConfig: { ...state.systemConfig, ...config }
  })),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentPage: (page) => set({ currentPage: page })
}));

// 选择器函数
export const useFilteredTasks = () => {
  const { tasks, taskFilters } = useAppStore();
  
  return tasks.filter(task => {
    const statusMatch = taskFilters.status === 'all' || task.status === taskFilters.status;
    const priorityMatch = taskFilters.priority === 'all' || task.priority === taskFilters.priority;
    const searchMatch = taskFilters.search === '' || 
      task.name.toLowerCase().includes(taskFilters.search.toLowerCase()) ||
      task.description.toLowerCase().includes(taskFilters.search.toLowerCase());
    
    return statusMatch && priorityMatch && searchMatch;
  });
};

export const useTaskStats = () => {
  const tasks = useAppStore(state => state.tasks);
  
  return {
    total: tasks.length,
    running: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
    success: tasks.filter(t => t.status === TaskStatus.SUCCESS).length,
    failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
    pending: tasks.filter(t => t.status === TaskStatus.PENDING).length
  };
};
/**
 * AI Schedule MCP Tool - 任务配置页面
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Clock, 
  Bot, 
  Settings, 
  Play, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAppStore, Task, TaskStatus, TaskPriority } from '@/store';
import { cn } from '@/lib/utils';

// Cron表达式预设
const cronPresets = [
  { label: '每分钟', value: '* * * * *', description: '每分钟执行一次' },
  { label: '每小时', value: '0 * * * *', description: '每小时的第0分钟执行' },
  { label: '每天上午9点', value: '0 9 * * *', description: '每天上午9:00执行' },
  { label: '每天下午6点', value: '0 18 * * *', description: '每天下午6:00执行' },
  { label: '工作日上午9点', value: '0 9 * * 1-5', description: '周一到周五上午9:00执行' },
  { label: '每周一上午9点', value: '0 9 * * 1', description: '每周一上午9:00执行' },
  { label: '每月1号上午9点', value: '0 9 1 * *', description: '每月1号上午9:00执行' }
];

// 可用Agent列表
const availableAgents = [
  {
    id: 'agent-1',
    name: 'Code Review Agent',
    description: '专门用于代码审查和质量检查',
    capabilities: ['代码分析', 'ESLint检查', 'TypeScript检查', '安全扫描'],
    status: 'online' as const
  },
  {
    id: 'agent-2', 
    name: 'Test Runner Agent',
    description: '自动化测试执行代理',
    capabilities: ['单元测试', '集成测试', '端到端测试', '性能测试'],
    status: 'online' as const
  },
  {
    id: 'agent-3',
    name: 'Deploy Agent',
    description: '自动化部署代理',
    capabilities: ['构建打包', '环境部署', '回滚操作', '健康检查'],
    status: 'offline' as const
  },
  {
    id: 'agent-4',
    name: 'Documentation Agent',
    description: '文档生成和维护代理',
    capabilities: ['API文档生成', 'README更新', '变更日志', '代码注释'],
    status: 'online' as const
  }
];

// 工作流模板
const workflowTemplates = [
  {
    id: 'workflow-1',
    name: '代码质量检查流程',
    description: '包含代码格式化、ESLint检查、TypeScript检查等步骤',
    category: '代码质量',
    steps: ['代码拉取', 'ESLint检查', 'TypeScript检查', '安全扫描', '生成报告']
  },
  {
    id: 'workflow-2',
    name: '自动化测试流程',
    description: '运行完整的测试套件，包括单元测试和集成测试',
    category: '测试',
    steps: ['环境准备', '依赖安装', '单元测试', '集成测试', '覆盖率报告']
  },
  {
    id: 'workflow-3',
    name: '部署流程',
    description: '自动化构建、测试和部署到指定环境',
    category: '部署',
    steps: ['代码构建', '运行测试', '构建镜像', '部署到环境', '健康检查']
  },
  {
    id: 'workflow-4',
    name: '文档更新流程',
    description: '自动生成和更新项目文档',
    category: '文档',
    steps: ['扫描代码变更', '生成API文档', '更新README', '提交变更']
  }
];

export default function TaskConfig() {
  const navigate = useNavigate();
  const { addTask } = useAppStore();
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cronExpression: '0 9 * * *',
    priority: TaskPriority.MEDIUM,
    agentId: '',
    workflowId: '',
    environment: {
      workingDirectory: '',
      environmentVariables: '',
      resourceLimits: {
        memory: '512MB',
        cpu: '1',
        timeout: '30'
      }
    }
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showCronHelper, setShowCronHelper] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '任务名称不能为空';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '任务描述不能为空';
    }
    
    if (!formData.cronExpression.trim()) {
      newErrors.cronExpression = 'Cron表达式不能为空';
    }
    
    if (!formData.agentId) {
      newErrors.agentId = '请选择执行Agent';
    }
    
    if (!formData.workflowId) {
      newErrors.workflowId = '请选择工作流模板';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    const newTask: Task = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      cronExpression: formData.cronExpression,
      status: TaskStatus.PENDING,
      priority: formData.priority,
      agentId: formData.agentId,
      workflowId: formData.workflowId,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0
    };
    
    addTask(newTask);
    navigate('/');
  };
  
  // 步骤组件
  const steps = [
    { id: 1, name: '基本信息', description: '设置任务名称和描述' },
    { id: 2, name: '定时配置', description: '配置执行时间规则' },
    { id: 3, name: 'Agent选择', description: '选择执行代理' },
    { id: 4, name: '工作流配置', description: '选择工作流模板' },
    { id: 5, name: '执行环境', description: '配置运行环境' }
  ];
  
  const selectedAgent = availableAgents.find(agent => agent.id === formData.agentId);
  const selectedWorkflow = workflowTemplates.find(workflow => workflow.id === formData.workflowId);
  
  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">创建新任务</h1>
            <p className="text-gray-600 mt-2">配置定时任务的执行规则和参数</p>
          </div>
        </div>
        
        {/* 步骤指示器 */}
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              )}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-2">
                <p className={cn(
                  'text-sm font-medium',
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                )}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 mx-4',
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* 步骤1: 基本信息 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">基本信息</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="输入任务名称，如：代码质量检查"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务描述 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="详细描述任务的功能和目的..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={TaskPriority.LOW}>低优先级</option>
                  <option value={TaskPriority.MEDIUM}>中优先级</option>
                  <option value={TaskPriority.HIGH}>高优先级</option>
                  <option value={TaskPriority.URGENT}>紧急</option>
                </select>
              </div>
            </div>
          )}
          
          {/* 步骤2: 定时配置 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">定时配置</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cron表达式 *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.cronExpression}
                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                    className={cn(
                      'flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono',
                      errors.cronExpression ? 'border-red-300' : 'border-gray-300'
                    )}
                    placeholder="0 9 * * *"
                  />
                  <button
                    onClick={() => setShowCronHelper(!showCronHelper)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>
                {errors.cronExpression && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.cronExpression}
                  </p>
                )}
              </div>
              
              {/* Cron预设选择器 */}
              {showCronHelper && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">常用时间设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cronPresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setFormData({ ...formData, cronExpression: preset.value })}
                        className={cn(
                          'text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors',
                          formData.cronExpression === preset.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        )}
                      >
                        <p className="font-medium text-gray-900">{preset.label}</p>
                        <p className="text-sm text-gray-600">{preset.description}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">{preset.value}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 步骤3: Agent选择 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Bot className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">选择执行Agent</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setFormData({ ...formData, agentId: agent.id })}
                    className={cn(
                      'text-left p-4 border rounded-lg transition-colors',
                      formData.agentId === agent.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50',
                      agent.status === 'offline' && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={agent.status === 'offline'}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        agent.status === 'online' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      )}>
                        {agent.status === 'online' ? '在线' : '离线'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              
              {errors.agentId && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.agentId}
                </p>
              )}
            </div>
          )}
          
          {/* 步骤4: 工作流配置 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Play className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">选择工作流模板</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflowTemplates.map((workflow) => (
                  <button
                    key={workflow.id}
                    onClick={() => setFormData({ ...formData, workflowId: workflow.id })}
                    className={cn(
                      'text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors',
                      formData.workflowId === workflow.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {workflow.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">执行步骤:</p>
                      {workflow.steps.map((step, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <span className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              
              {errors.workflowId && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.workflowId}
                </p>
              )}
            </div>
          )}
          
          {/* 步骤5: 执行环境 */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">执行环境配置</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作目录
                </label>
                <input
                  type="text"
                  value={formData.environment.workingDirectory}
                  onChange={(e) => setFormData({
                    ...formData,
                    environment: { ...formData.environment, workingDirectory: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/workspace/project"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  环境变量
                </label>
                <textarea
                  value={formData.environment.environmentVariables}
                  onChange={(e) => setFormData({
                    ...formData,
                    environment: { ...formData.environment, environmentVariables: e.target.value }
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="NODE_ENV=production\nAPI_KEY=your_api_key"
                />
                <p className="mt-1 text-xs text-gray-500">每行一个环境变量，格式：KEY=VALUE</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内存限制
                  </label>
                  <select
                    value={formData.environment.resourceLimits.memory}
                    onChange={(e) => setFormData({
                      ...formData,
                      environment: {
                        ...formData.environment,
                        resourceLimits: { ...formData.environment.resourceLimits, memory: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="256MB">256MB</option>
                    <option value="512MB">512MB</option>
                    <option value="1GB">1GB</option>
                    <option value="2GB">2GB</option>
                    <option value="4GB">4GB</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPU限制
                  </label>
                  <select
                    value={formData.environment.resourceLimits.cpu}
                    onChange={(e) => setFormData({
                      ...formData,
                      environment: {
                        ...formData.environment,
                        resourceLimits: { ...formData.environment.resourceLimits, cpu: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0.5">0.5 核</option>
                    <option value="1">1 核</option>
                    <option value="2">2 核</option>
                    <option value="4">4 核</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    超时时间(分钟)
                  </label>
                  <input
                    type="number"
                    value={formData.environment.resourceLimits.timeout}
                    onChange={(e) => setFormData({
                      ...formData,
                      environment: {
                        ...formData.environment,
                        resourceLimits: { ...formData.environment.resourceLimits, timeout: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="120"
                  />
                </div>
              </div>
              
              {/* 配置预览 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">任务配置预览</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">任务名称:</span>
                    <span className="font-medium">{formData.name || '未设置'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">执行时间:</span>
                    <span className="font-mono">{formData.cronExpression}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">执行Agent:</span>
                    <span className="font-medium">{selectedAgent?.name || '未选择'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">工作流:</span>
                    <span className="font-medium">{selectedWorkflow?.name || '未选择'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">优先级:</span>
                    <span className="font-medium">
                      {formData.priority === TaskPriority.LOW && '低'}
                      {formData.priority === TaskPriority.MEDIUM && '中'}
                      {formData.priority === TaskPriority.HIGH && '高'}
                      {formData.priority === TaskPriority.URGENT && '紧急'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={cn(
                'px-4 py-2 border rounded-lg transition-colors',
                currentStep === 1 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              上一步
            </button>
            
            <div className="flex space-x-3">
              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>创建任务</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
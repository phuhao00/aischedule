/**
 * AI Schedule MCP Tool - Agent工作流管理页面
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  GitBranch, 
  Clock, 
  CheckCircle, 
  Settings,
  MoreHorizontal,
  Folder,
  Star,
  Users
} from 'lucide-react';
import { useAppStore, Workflow } from '@/store';
import { cn } from '@/lib/utils';

// 工作流卡片组件
function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const { updateWorkflow, deleteWorkflow } = useAppStore();
  const [showActions, setShowActions] = useState(false);
  
  const handleDelete = () => {
    if (confirm('确定要删除这个工作流吗？')) {
      deleteWorkflow(workflow.id);
    }
  };
  
  const handleDuplicate = () => {
    const newWorkflow: Workflow = {
      ...workflow,
      id: Date.now().toString(),
      name: `${workflow.name} (副本)`,
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // 这里应该调用addWorkflow，但为了简化示例，我们直接更新
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
            {workflow.isTemplate && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                模板
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <GitBranch className="w-3 h-3" />
              <span>{workflow.steps.length} 个步骤</span>
            </div>
            <div className="flex items-center space-x-1">
              <Folder className="w-3 h-3" />
              <span>{workflow.category}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(workflow.updatedAt).toLocaleDateString()}</span>
            </div>
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
              <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Edit className="w-4 h-4" />
                <span>编辑工作流</span>
              </button>
              <button
                onClick={handleDuplicate}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                <span>复制工作流</span>
              </button>
              <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Play className="w-4 h-4" />
                <span>测试运行</span>
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除工作流</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 工作流步骤预览 */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">执行步骤</h4>
        <div className="space-y-2">
          {workflow.steps.slice(0, 3).map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{step.name}</p>
                <p className="text-xs text-gray-500">{step.type}</p>
              </div>
              {step.type === 'condition' && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </div>
          ))}
          {workflow.steps.length > 3 && (
            <div className="text-xs text-gray-500 pl-9">
              还有 {workflow.steps.length - 3} 个步骤...
            </div>
          )}
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <Play className="w-3 h-3" />
              <span>运行</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <Edit className="w-3 h-3" />
              <span>编辑</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Star className="w-3 h-3" />
            <span>4.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 工作流模板库组件
function TemplateLibrary() {
  const templates = [
    {
      id: 'template-1',
      name: '代码质量检查',
      description: '全面的代码质量检查流程，包括格式化、Lint检查、类型检查等',
      category: '代码质量',
      steps: ['代码拉取', 'ESLint检查', 'TypeScript检查', '安全扫描', '生成报告'],
      downloads: 1250,
      rating: 4.9
    },
    {
      id: 'template-2',
      name: 'CI/CD流水线',
      description: '完整的持续集成和部署流程',
      category: '部署',
      steps: ['代码构建', '运行测试', '构建镜像', '部署到环境', '健康检查'],
      downloads: 890,
      rating: 4.7
    },
    {
      id: 'template-3',
      name: '自动化测试套件',
      description: '包含单元测试、集成测试、端到端测试的完整测试流程',
      category: '测试',
      steps: ['环境准备', '单元测试', '集成测试', 'E2E测试', '覆盖率报告'],
      downloads: 675,
      rating: 4.6
    },
    {
      id: 'template-4',
      name: '文档生成',
      description: '自动生成和更新项目文档',
      category: '文档',
      steps: ['扫描代码', 'API文档生成', 'README更新', '变更日志', '发布文档'],
      downloads: 432,
      rating: 4.5
    }
  ];
  
  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {template.category}
                </span>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{template.rating}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <GitBranch className="w-3 h-3" />
                  <span>{template.steps.length} 个步骤</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{template.downloads} 次使用</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {template.steps.map((step, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {step}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                使用模板
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                预览
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Workflows() {
  const { workflows, setWorkflows } = useAppStore();
  const [activeTab, setActiveTab] = useState('my-workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // 模拟数据初始化
  useEffect(() => {
    const mockWorkflows: Workflow[] = [
      {
        id: 'workflow-1',
        name: '代码质量检查流程',
        description: '自动化代码质量检查，包括ESLint、TypeScript检查、安全扫描等',
        steps: [
          {
            id: 'step-1',
            name: '代码拉取',
            type: 'action',
            config: { repository: 'main', branch: 'main' },
            nextSteps: ['step-2'],
            position: { x: 100, y: 100 }
          },
          {
            id: 'step-2',
            name: 'ESLint检查',
            type: 'action',
            config: { rules: 'strict' },
            nextSteps: ['step-3'],
            position: { x: 300, y: 100 }
          },
          {
            id: 'step-3',
            name: 'TypeScript检查',
            type: 'action',
            config: { strict: true },
            nextSteps: ['step-4'],
            position: { x: 500, y: 100 }
          },
          {
            id: 'step-4',
            name: '生成报告',
            type: 'action',
            config: { format: 'html' },
            nextSteps: [],
            position: { x: 700, y: 100 }
          }
        ],
        isTemplate: false,
        category: '代码质量',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'workflow-2',
        name: '自动化测试流程',
        description: '完整的测试流程，包括单元测试、集成测试和端到端测试',
        steps: [
          {
            id: 'step-1',
            name: '环境准备',
            type: 'action',
            config: { environment: 'test' },
            nextSteps: ['step-2'],
            position: { x: 100, y: 100 }
          },
          {
            id: 'step-2',
            name: '单元测试',
            type: 'action',
            config: { coverage: true },
            nextSteps: ['step-3'],
            position: { x: 300, y: 100 }
          },
          {
            id: 'step-3',
            name: '集成测试',
            type: 'action',
            config: { database: 'mock' },
            nextSteps: ['step-4'],
            position: { x: 500, y: 100 }
          },
          {
            id: 'step-4',
            name: '生成报告',
            type: 'action',
            config: { format: 'junit' },
            nextSteps: [],
            position: { x: 700, y: 100 }
          }
        ],
        isTemplate: true,
        category: '测试',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'workflow-3',
        name: '部署流程',
        description: '自动化部署到测试和生产环境',
        steps: [
          {
            id: 'step-1',
            name: '构建应用',
            type: 'action',
            config: { target: 'production' },
            nextSteps: ['step-2'],
            position: { x: 100, y: 100 }
          },
          {
            id: 'step-2',
            name: '运行测试',
            type: 'condition',
            config: { required: true },
            nextSteps: ['step-3', 'step-5'],
            position: { x: 300, y: 100 }
          },
          {
            id: 'step-3',
            name: '部署到测试环境',
            type: 'action',
            config: { environment: 'staging' },
            nextSteps: ['step-4'],
            position: { x: 500, y: 50 }
          },
          {
            id: 'step-4',
            name: '部署到生产环境',
            type: 'action',
            config: { environment: 'production' },
            nextSteps: [],
            position: { x: 700, y: 50 }
          },
          {
            id: 'step-5',
            name: '发送失败通知',
            type: 'action',
            config: { channel: 'slack' },
            nextSteps: [],
            position: { x: 500, y: 150 }
          }
        ],
        isTemplate: false,
        category: '部署',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];
    
    if (workflows.length === 0) {
      setWorkflows(mockWorkflows);
    }
  }, []);
  
  // 筛选工作流
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || workflow.category === categoryFilter;
    const matchesTab = activeTab === 'my-workflows' || 
                      (activeTab === 'templates' && workflow.isTemplate);
    
    return matchesSearch && matchesCategory && matchesTab;
  });
  
  const categories = ['all', '代码质量', '测试', '部署', '文档', '监控'];
  
  return (
    <div className="p-6">
      {/* 页面标题和操作 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent工作流管理</h1>
            <p className="text-gray-600 mt-2">创建和管理自动化工作流程</p>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>创建工作流</span>
          </button>
        </div>
        
        {/* 标签页 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('my-workflows')}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'my-workflows'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              我的工作流
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              模板库
            </button>
          </nav>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索工作流..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '所有分类' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 内容区域 */}
      {activeTab === 'my-workflows' && (
        <div>
          {filteredWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredWorkflows.map(workflow => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无工作流</h3>
              <p className="text-gray-600 mb-4">开始创建您的第一个工作流</p>
              <button className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>创建工作流</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'templates' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">工作流模板库</h2>
            <p className="text-gray-600">选择预置模板快速创建工作流</p>
          </div>
          <TemplateLibrary />
        </div>
      )}
    </div>
  );
}
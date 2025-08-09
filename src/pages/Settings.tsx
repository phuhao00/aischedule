/**
 * AI Schedule MCP Tool - 系统设置页面
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  Bell, 
  Shield, 
  Database, 
  Zap, 
  Users, 
  Globe, 
  Palette, 
  Monitor, 
  HardDrive, 
  Wifi, 
  Lock, 
  Key, 
  Mail, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Upload,
  Download,
  Trash2,
  Plus
} from 'lucide-react';
import { useAppStore, SystemConfig } from '@/store';
import { cn } from '@/lib/utils';

// 设置分组组件
function SettingGroup({ title, description, icon: Icon, children }: {
  title: string;
  description: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// 设置项组件
function SettingItem({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );
}

// 开关组件
function Toggle({ checked, onChange }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-blue-600' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// 通知设置组件
function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    taskCompletion: true,
    taskFailure: true,
    systemAlerts: true,
    weeklyReport: false,
    emailAddress: 'user@example.com',
    notificationHours: { start: '09:00', end: '18:00' }
  });
  
  return (
    <SettingGroup
      title="通知设置"
      description="配置系统通知和提醒方式"
      icon={Bell}
    >
      <SettingItem
        label="邮件通知"
        description="通过邮件接收重要通知"
      >
        <Toggle
          checked={settings.emailNotifications}
          onChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="推送通知"
        description="浏览器推送通知"
      >
        <Toggle
          checked={settings.pushNotifications}
          onChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="任务完成通知"
        description="任务成功完成时发送通知"
      >
        <Toggle
          checked={settings.taskCompletion}
          onChange={(checked) => setSettings(prev => ({ ...prev, taskCompletion: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="任务失败通知"
        description="任务执行失败时发送通知"
      >
        <Toggle
          checked={settings.taskFailure}
          onChange={(checked) => setSettings(prev => ({ ...prev, taskFailure: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="系统警告"
        description="系统异常和警告通知"
      >
        <Toggle
          checked={settings.systemAlerts}
          onChange={(checked) => setSettings(prev => ({ ...prev, systemAlerts: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="周报"
        description="每周发送执行统计报告"
      >
        <Toggle
          checked={settings.weeklyReport}
          onChange={(checked) => setSettings(prev => ({ ...prev, weeklyReport: checked }))}
        />
      </SettingItem>
      
      {settings.emailNotifications && (
        <SettingItem
          label="邮箱地址"
          description="接收通知的邮箱地址"
        >
          <input
            type="email"
            value={settings.emailAddress}
            onChange={(e) => setSettings(prev => ({ ...prev, emailAddress: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </SettingItem>
      )}
      
      <SettingItem
        label="通知时间"
        description="设置接收通知的时间范围"
      >
        <div className="flex items-center space-x-2">
          <input
            type="time"
            value={settings.notificationHours.start}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              notificationHours: { ...prev.notificationHours, start: e.target.value }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500">至</span>
          <input
            type="time"
            value={settings.notificationHours.end}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              notificationHours: { ...prev.notificationHours, end: e.target.value }
            }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </SettingItem>
    </SettingGroup>
  );
}

// 安全设置组件
function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true,
    apiKeyRotation: true,
    auditLogging: true
  });
  
  return (
    <SettingGroup
      title="安全设置"
      description="配置系统安全和访问控制"
      icon={Shield}
    >
      <SettingItem
        label="双因素认证"
        description="启用双因素认证增强账户安全"
      >
        <Toggle
          checked={settings.twoFactorAuth}
          onChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="会话超时"
        description="用户会话自动过期时间（分钟）"
      >
        <select
          value={settings.sessionTimeout}
          onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={15}>15分钟</option>
          <option value={30}>30分钟</option>
          <option value={60}>1小时</option>
          <option value={120}>2小时</option>
          <option value={480}>8小时</option>
        </select>
      </SettingItem>
      
      <SettingItem
        label="密码过期"
        description="强制用户定期更换密码（天）"
      >
        <select
          value={settings.passwordExpiry}
          onChange={(e) => setSettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={30}>30天</option>
          <option value={60}>60天</option>
          <option value={90}>90天</option>
          <option value={180}>180天</option>
          <option value={0}>永不过期</option>
        </select>
      </SettingItem>
      
      <SettingItem
        label="登录通知"
        description="新设备登录时发送通知"
      >
        <Toggle
          checked={settings.loginNotifications}
          onChange={(checked) => setSettings(prev => ({ ...prev, loginNotifications: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="API密钥轮换"
        description="定期自动轮换API密钥"
      >
        <Toggle
          checked={settings.apiKeyRotation}
          onChange={(checked) => setSettings(prev => ({ ...prev, apiKeyRotation: checked }))}
        />
      </SettingItem>
      
      <SettingItem
        label="审计日志"
        description="记录所有用户操作和系统事件"
      >
        <Toggle
          checked={settings.auditLogging}
          onChange={(checked) => setSettings(prev => ({ ...prev, auditLogging: checked }))}
        />
      </SettingItem>
    </SettingGroup>
  );
}

// 系统配置组件
function SystemConfiguration() {
  const [settings, setSettings] = useState({
    maxConcurrentTasks: 10,
    taskTimeout: 3600,
    retryAttempts: 3,
    logLevel: 'info',
    dataRetention: 90,
    backupFrequency: 'daily',
    timezone: 'Asia/Shanghai'
  });
  
  return (
    <SettingGroup
      title="系统配置"
      description="配置系统运行参数和性能设置"
      icon={SettingsIcon}
    >
      <SettingItem
        label="最大并发任务数"
        description="同时执行的最大任务数量"
      >
        <input
          type="number"
          min="1"
          max="100"
          value={settings.maxConcurrentTasks}
          onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrentTasks: parseInt(e.target.value) }))}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </SettingItem>
      
      <SettingItem
        label="任务超时时间"
        description="单个任务的最大执行时间（秒）"
      >
        <select
          value={settings.taskTimeout}
          onChange={(e) => setSettings(prev => ({ ...prev, taskTimeout: parseInt(e.target.value) }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={300}>5分钟</option>
          <option value={600}>10分钟</option>
          <option value={1800}>30分钟</option>
          <option value={3600}>1小时</option>
          <option value={7200}>2小时</option>
          <option value={0}>无限制</option>
        </select>
      </SettingItem>
      
      <SettingItem
        label="重试次数"
        description="任务失败后的自动重试次数"
      >
        <input
          type="number"
          min="0"
          max="10"
          value={settings.retryAttempts}
          onChange={(e) => setSettings(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </SettingItem>
      
      <SettingItem
        label="日志级别"
        description="系统日志记录的详细程度"
      >
        <select
          value={settings.logLevel}
          onChange={(e) => setSettings(prev => ({ ...prev, logLevel: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="error">错误</option>
          <option value="warn">警告</option>
          <option value="info">信息</option>
          <option value="debug">调试</option>
        </select>
      </SettingItem>
      
      <SettingItem
        label="数据保留期"
        description="执行日志和数据的保留天数"
      >
        <select
          value={settings.dataRetention}
          onChange={(e) => setSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={7}>7天</option>
          <option value={30}>30天</option>
          <option value={90}>90天</option>
          <option value={180}>180天</option>
          <option value={365}>1年</option>
          <option value={0}>永久保留</option>
        </select>
      </SettingItem>
      
      <SettingItem
        label="备份频率"
        description="系统数据自动备份频率"
      >
        <select
          value={settings.backupFrequency}
          onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="hourly">每小时</option>
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="disabled">禁用</option>
        </select>
      </SettingItem>
      
      <SettingItem
        label="时区"
        description="系统默认时区设置"
      >
        <select
          value={settings.timezone}
          onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
          <option value="UTC">协调世界时 (UTC)</option>
          <option value="America/New_York">纽约时间 (UTC-5)</option>
          <option value="Europe/London">伦敦时间 (UTC+0)</option>
          <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
        </select>
      </SettingItem>
    </SettingGroup>
  );
}

// 集成设置组件
function IntegrationSettings() {
  const [integrations, setIntegrations] = useState([
    {
      id: 'slack',
      name: 'Slack',
      description: '团队协作和通知',
      enabled: true,
      configured: true,
      icon: '💬'
    },
    {
      id: 'github',
      name: 'GitHub',
      description: '代码仓库集成',
      enabled: true,
      configured: true,
      icon: '🐙'
    },
    {
      id: 'jira',
      name: 'Jira',
      description: '项目管理和问题跟踪',
      enabled: false,
      configured: false,
      icon: '📋'
    },
    {
      id: 'docker',
      name: 'Docker',
      description: '容器化部署',
      enabled: true,
      configured: true,
      icon: '🐳'
    },
    {
      id: 'aws',
      name: 'AWS',
      description: '云服务集成',
      enabled: false,
      configured: false,
      icon: '☁️'
    }
  ]);
  
  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, enabled: !integration.enabled }
        : integration
    ));
  };
  
  return (
    <SettingGroup
      title="集成设置"
      description="配置第三方服务和工具集成"
      icon={Zap}
    >
      <div className="space-y-4">
        {integrations.map(integration => (
          <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <h4 className="font-medium text-gray-900">{integration.name}</h4>
                <p className="text-sm text-gray-600">{integration.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {integration.configured ? (
                    <span className="inline-flex items-center space-x-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span>已配置</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs text-yellow-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>需要配置</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!integration.configured && integration.enabled && (
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  配置
                </button>
              )}
              <Toggle
                checked={integration.enabled}
                onChange={() => toggleIntegration(integration.id)}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900">添加新集成</h4>
            <p className="text-sm text-blue-700 mt-1">
              需要添加其他服务集成？请联系管理员或查看文档了解支持的集成列表。
            </p>
            <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
              查看文档 →
            </button>
          </div>
        </div>
      </div>
    </SettingGroup>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [hasChanges, setHasChanges] = useState(false);
  
  const tabs = [
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'system', label: '系统配置', icon: SettingsIcon },
    { id: 'integrations', label: '集成设置', icon: Zap }
  ];
  
  const handleSave = () => {
    // 这里应该保存设置到后端
    console.log('保存设置');
    setHasChanges(false);
  };
  
  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？这将恢复到默认配置。')) {
      // 这里应该重置设置
      console.log('重置设置');
      setHasChanges(false);
    }
  };
  
  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
            <p className="text-gray-600 mt-2">配置系统参数和个人偏好</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重置</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <Save className="w-4 h-4" />
              <span>保存设置</span>
            </button>
          </div>
        </div>
        
        {/* 标签页导航 */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* 设置内容 */}
      <div className="space-y-8">
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'system' && <SystemConfiguration />}
        {activeTab === 'integrations' && <IntegrationSettings />}
      </div>
      
      {/* 底部提示 */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">您有未保存的更改</span>
            <button
              onClick={handleSave}
              className="ml-3 px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
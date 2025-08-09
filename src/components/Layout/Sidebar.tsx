/**
 * AI Schedule MCP Tool - 侧边栏导航组件
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Calendar, 
  GitBranch, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

const navigationItems = [
  {
    name: '任务调度中心',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    name: '任务配置',
    icon: Calendar,
    href: '/tasks'
  },
  {
    name: 'Agent工作流',
    icon: GitBranch,
    href: '/workflows'
  },
  {
    name: '执行监控',
    icon: Activity,
    href: '/monitor'
  },
  {
    name: '系统设置',
    icon: Settings,
    href: '/settings'
  }
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <div className={cn(
      'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Schedule</h1>
              <p className="text-xs text-gray-500">MCP Tool</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-5 w-5', sidebarCollapsed ? 'mx-auto' : 'mr-3')} />
              {!sidebarCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 底部状态 */}
      <div className="p-4 border-t border-gray-200">
        {!sidebarCollapsed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-800">系统运行中</span>
            </div>
            <p className="text-xs text-green-600 mt-1">MCP连接正常</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
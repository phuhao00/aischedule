/**
 * AI Schedule MCP Tool - 主布局组件
 * 作者: AI Assistant
 * 创建时间: 2024
 */

import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

export default function Layout() {
  const sidebarCollapsed = useAppStore(state => state.sidebarCollapsed);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <Header />
        
        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">
          <div className={cn(
            'h-full transition-all duration-300',
            sidebarCollapsed ? 'ml-0' : 'ml-0'
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
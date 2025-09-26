'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Bot, 
  Settings, 
  Menu, 
  X,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
  },
  {
    name: 'Backtest',
    href: '/backtest',
    icon: TrendingUp,
  },
  {
    name: 'Bot Trading',
    href: '/trading',
    icon: Bot,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Neuratrade
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {isCollapsed ? (
            <Menu className="w-4 h-4 text-gray-400" />
          ) : (
            <X className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-green-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50",
                isCollapsed && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-gray-800">
        <div className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20",
          isCollapsed && "justify-center"
        )}>
          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-green-400">Live</span>
              <span className="text-xs text-gray-400">MetaAPI Connected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

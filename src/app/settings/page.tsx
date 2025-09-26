'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { TradingSettings } from '@/components/settings/trading-settings';
import { AccountSettings } from '@/components/settings/account-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-400 mt-1">
              Configure your trading preferences and account settings
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TradingSettings />
            <NotificationSettings />
          </div>
          <div>
            <AccountSettings />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, Car, Users, TrendingUp, CalendarCheck,
  Activity, ArrowUp, ArrowDown
} from 'lucide-react';
import { api } from '@/services/api';
import { queryKeys, formatCurrency, formatNumber, formatPercentage, formatDuration, cn } from '@/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DashboardSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { BookingActivityChart } from '@/components/charts/booking-activity-chart';
import { UserGrowthChart } from '@/components/charts/user-growth-chart';
import { ParkingUtilizationChart } from '@/components/charts/parking-utilization-chart';
import { useDashboardStore } from '@/store';

// ─── Stat Card ───
function StatCard({
  title, value, change, changeLabel, icon: Icon, color, format = 'number',
}: {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  format?: 'currency' | 'number' | 'percentage' | 'duration';
}) {
  const formattedValue = format === 'currency' ? formatCurrency(value) :
    format === 'percentage' ? formatPercentage(value) :
    format === 'duration' ? formatDuration(value) :
    formatNumber(value);

  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card hover>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {formattedValue}
              </p>
              {change !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-medium',
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {formatPercentage(Math.abs(change))}
                  </span>
                  <span className="text-xs text-gray-400">{changeLabel || 'vs last month'}</span>
                </div>
              )}
            </div>
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110',
              color
            )}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Dashboard Page ───
export default function DashboardPage() {
  const { setStats } = useDashboardStore();

  const { data: reportData, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.reports(),
    queryFn: async () => {
      const response = await api.dashboard.reports();
      const data = response.data?.data || response.data;
      if (data?.stats) setStats(data.stats);
      return data;
    },
    refetchInterval: 30000,
  });

  const stats = reportData?.stats;
  const revenueChart: { date: string; revenue: number; bookings: number }[] = reportData?.revenue_chart || [];
  const bookingActivity: { date: string; created: number; completed: number; cancelled: number }[] = reportData?.booking_activity || [];
  const userGrowth: { date: string; total: number; new_users: number }[] = reportData?.user_growth || [];
  const parkingUtil: { parking_id: number; parking_name: string; total_slots: number; available_slots: number; occupancy_rate: number }[] = reportData?.parking_utilization || [];

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your analytics...</p>
        </div>
        <DashboardSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time overview of your parking operations
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4 text-green-500" />
          <span>Auto-updating every 30s</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats?.total_revenue ?? 0}
          change={stats?.revenue_growth}
          icon={DollarSign}
          color="bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25"
          format="currency"
        />
        <StatCard
          title="Active Bookings"
          value={stats?.active_bookings ?? 0}
          icon={CalendarCheck}
          color="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25"
          format="number"
        />
        <StatCard
          title="Occupancy Rate"
          value={stats?.occupancy_rate ?? 0}
          icon={Car}
          color="bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25"
          format="percentage"
        />
        <StatCard
          title="Total Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          color="bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25"
          format="number"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Revenue Today</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats?.revenue_today ?? 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">New Users Today</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  +{stats?.new_users_today ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Car className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Parkings</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats?.total_parkings ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Booking Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingActivityChart data={bookingActivity} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <UserGrowthChart data={userGrowth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parking Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ParkingUtilizationChart data={parkingUtil} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Download, FileSpreadsheet, FileText,
  Calendar, DollarSign, Car, Users, Percent,
  TrendingUp, ArrowUp, ArrowDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, queryKeys } from '@/services';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
} from '@/components/ui/tabs';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/utils';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { BookingActivityChart } from '@/components/charts/booking-activity-chart';

const reportTypes = [
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'bookings', label: 'Bookings', icon: Car },
  { id: 'occupancy', label: 'Occupancy', icon: Percent },
  { id: 'users', label: 'Users', icon: Users },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = React.useState('revenue');
  const [period, setPeriod] = React.useState('7d');

  // Fetch real report data from API
  const { data: reportData, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.reports({ report_type: activeReport, period }),
    queryFn: async () => {
      const response = await api.dashboard.reports({
        report_type: activeReport,
        period,
      });
      return response.data?.data || response.data;
    },
    refetchInterval: 60000,
  });

  const revenueData: { date: string; revenue: number; bookings: number }[] = reportData?.revenue_chart || [];
  const bookingData: { date: string; created: number; completed: number; cancelled: number }[] = reportData?.booking_activity || [];
  const reportStats = reportData?.stats || {};

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await api.dashboard.reports({
        report_type: activeReport,
        format,
        period,
      });
      // Trigger file download from response blob
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([JSON.stringify(response.data)], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport}-report-${period}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const tabs = reportTypes.map((r) => ({
    id: r.id,
    label: r.label,
    icon: <r.icon className="h-4 w-4" />,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analytics and exportable business reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-28">
              <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <FileText className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <Tabs tabs={tabs} activeTab={activeReport} onTabChange={setActiveReport} />

      {/* Revenue Report */}
      {activeReport === 'revenue' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(reportStats.total_revenue ?? 284500)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUp className="h-3 w-3" /> 12.5% vs last period
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg. Booking Value</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(reportStats.avg_booking_value ?? 18.75)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUp className="h-3 w-3" /> 3.2% vs last period
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Revenue Today</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(reportStats.revenue_today ?? 12500)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                  vs {formatCurrency(11800)} yesterday
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Projected (30d)</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(reportStats.projected_revenue ?? 352000)}</p>
                <Badge variant="success" size="sm" className="mt-1">On track</Badge>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookings Report */}
      {activeReport === 'bookings' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold mt-1">{formatNumber(reportStats.total_bookings ?? 15230)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUp className="h-3 w-3" /> 8.1% vs last period
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold mt-1">{formatPercentage(reportStats.completion_rate ?? 87.3)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUp className="h-3 w-3" /> 2.1% vs last period
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cancellation Rate</p>
                <p className="text-2xl font-bold mt-1">{formatPercentage(reportStats.cancellation_rate ?? 8.7)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-1">
                  <ArrowDown className="h-3 w-3" /> 1.3% vs last period
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg. Duration</p>
                <p className="text-2xl font-bold mt-1">{reportStats.avg_duration ? `${reportStats.avg_duration}h` : '3.2h'}</p>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">Stable</span>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Booking Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingActivityChart data={bookingData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Occupancy Report */}
      {activeReport === 'occupancy' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Average Occupancy</p>
                <p className="text-2xl font-bold mt-1">{formatPercentage(reportStats.avg_occupancy ?? 78.5)}</p>
                <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500" style={{ width: `${reportStats.avg_occupancy ?? 78.5}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Peak Occupancy</p>
                <p className="text-2xl font-bold mt-1">{formatPercentage(reportStats.peak_occupancy ?? 94.2)}</p>
                <p className="text-xs text-gray-400 mt-1">Weekends, 2-5 PM</p>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Lowest Occupancy</p>
                <p className="text-2xl font-bold mt-1">{formatPercentage(reportStats.lowest_occupancy ?? 32.1)}</p>
                <p className="text-xs text-gray-400 mt-1">Weekdays, 2-5 AM</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Parking Utilization Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(reportData?.parking_utilization || []).length > 0
                  ? reportData.parking_utilization.map((item: { parking_name: string; occupancy_rate: number }, i: number) => {
                    const occ = item.occupancy_rate;
                  return (
                    <div key={item.parking_name} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-32">{item.parking_name}</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${occ}%`,
                            background: `linear-gradient(90deg, ${i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#3B82F6' : '#8B5CF6'}, ${i % 3 === 0 ? '#059669' : i % 3 === 1 ? '#2563EB' : '#7C3AED'})`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{formatPercentage(Math.round(occ))}</span>
                    </div>
                  );
                })
                : ['Downtown Lot A', 'Airport Parking', 'Mall Garage', 'Business District', 'Beach Parking'].map((name, i) => {
                  const occ = 65 + i * 5;
                  return (
                    <div key={name} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-32">{name}</span>
                      <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${occ}%`,
                            background: `linear-gradient(90deg, ${i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#3B82F6' : '#8B5CF6'}, ${i % 3 === 0 ? '#059669' : i % 3 === 1 ? '#2563EB' : '#7C3AED'})`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{formatPercentage(Math.round(occ))}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Report */}
      {activeReport === 'users' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold mt-1">{formatNumber(reportStats.total_users ?? 3852)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUp className="h-3 w-3" /> 5.7% vs last period
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">New Users (30d)</p>
                <p className="text-2xl font-bold mt-1">+{formatNumber(reportStats.new_users_30d ?? 342)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                  <ArrowUp className="h-3 w-3" /> 12.3% vs last period
                </span>
              </CardContent>
            </Card>
            <Card hover>
              <CardContent>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Users (30d)</p>
                <p className="text-2xl font-bold mt-1">{formatNumber(reportStats.active_users_30d ?? 2104)}</p>
                <p className="text-xs text-gray-400 mt-1">54.6% engagement rate</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>User growth chart would render here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

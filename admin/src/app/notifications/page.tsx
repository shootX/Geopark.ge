'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Mail, MailOpen,
  Calendar, AlertCircle, Info, CheckCircle2,
  UserPlus, DollarSign, Car
} from 'lucide-react';
import { api, queryKeys } from '@/services';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store';
import { formatDateTime, timeAgo, cn } from '@/utils';
import type { AppNotification } from '@/types';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'booking': Car,
  'offer': DollarSign,
  'user': UserPlus,
  'alert': AlertCircle,
  'info': Info,
  'success': CheckCircle2,
  default: Bell,
};

const typeColors: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  offer: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  user: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  alert: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { markAsRead, markAllAsRead: storeMarkAllRead, clearAll, setNotifications } = useNotificationStore();
  const [filter, setFilter] = React.useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list({ filter }),
    queryFn: async () => {
      const res = await api.notifications.list({ filter });
      return res.data?.data || res.data || [];
    },
    refetchInterval: 15000,
  });

  const notifications: AppNotification[] = Array.isArray(data) ? data : data?.data || [];

  React.useEffect(() => {
    if (notifications.length > 0) {
      setNotifications(notifications);
    }
  }, [notifications, setNotifications]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: (_data, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count() });
    },
  });

  const { data: countData } = useQuery({
    queryKey: queryKeys.notifications.count(),
    queryFn: async () => {
      const res = await api.notifications.count();
      return res.data?.data || res.data?.count || 0;
    },
  });

  const unreadCount = typeof countData === 'number' ? countData : (countData as { count?: number })?.count || 0;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      storeMarkAllRead();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      success('Done', 'All notifications marked as read');
    } catch {
      error('Error', 'Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.notifications.clearAll();
      clearAll();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      success('Done', 'All notifications cleared');
    } catch {
      error('Error', 'Failed to clear notifications');
    }
  };

  const filtered = filter === 'all' ? notifications :
    filter === 'unread' ? notifications.filter((n) => !n.read_at) : notifications;

  const getIcon = (type: string) => {
    const key = type.split('\\').pop()?.toLowerCase() || 'default';
    const Icon = iconMap[key] || iconMap.default;
    return Icon;
  };

  const getColor = (type: string) => {
    const key = type.split('\\').pop()?.toLowerCase() || 'default';
    return typeColors[key] || typeColors.default;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark All Read
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={handleClearAll}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Clear All
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
        {unreadCount > 0 && (
          <Badge variant="info">{unreadCount} unread</Badge>
        )}
      </div>

      {/* Notification List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'All notifications have been read' : 'No notifications to display'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <AnimatePresence>
                {filtered.map((notif) => {
                  const Icon = getIcon(notif.type);
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'flex items-start gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30',
                        !notif.read_at && 'bg-blue-50/30 dark:bg-blue-950/20'
                      )}
                    >
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        getColor(notif.type)
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notif.data?.title}
                              {!notif.read_at && (
                                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {notif.data?.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {timeAgo(notif.created_at)}
                            </span>
                            {!notif.read_at && (
                              <button
                                onClick={() => markReadMutation.mutate(notif.id)}
                                className="rounded-lg p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                title="Mark as read"
                              >
                                <MailOpen className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {notif.data?.action_url && (
                          <a
                            href={notif.data.action_url}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-1"
                          >
                            View details →
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

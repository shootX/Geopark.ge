'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck, CheckCircle, XCircle, Clock,
  MoreHorizontal, Eye, Ban, User, Car
} from 'lucide-react';
import { api, queryKeys } from '@/services';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/tables/data-table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, formatDateTime, formatDuration, getBookingStatusConfig } from '@/utils';
import type { Booking, TableFilters, PaginationMeta } from '@/types';

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [showDetailDialog, setShowDetailDialog] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: async () => {
      const response = await api.bookings.adminList(filters);
      return response.data?.data || response.data || [];
    },
  });

  const bookings: Booking[] = Array.isArray(data) ? data : data?.data || [];
  const meta: PaginationMeta | undefined = data?.meta;

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.bookings.approve(id),
    onSuccess: () => {
      success('Booking approved', 'The booking has been approved');
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: () => error('Error', 'Failed to approve booking'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.bookings.cancel(id),
    onSuccess: () => {
      success('Booking cancelled', 'Booking has been cancelled');
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
    onError: () => error('Error', 'Failed to cancel booking'),
  });

  const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'default'> = {
    pending: 'warning',
    approved: 'info',
    active: 'success',
    completed: 'default',
    cancelled: 'destructive',
    rejected: 'destructive',
  };

  const columns = [
    {
      key: 'id',
      label: 'Booking #',
      render: (value: unknown) => (
        <span className="font-mono text-xs font-medium text-gray-900 dark:text-gray-100">
          #{String(value).padStart(6, '0')}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (value: unknown) => {
        const user = value as { full_name?: string; email?: string } | undefined;
        return user ? (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] font-semibold">
              {user.full_name?.charAt(0) || '?'}
            </div>
            <span className="text-sm">{user.full_name || 'Unknown'}</span>
          </div>
        ) : <span className="text-gray-400">—</span>;
      },
    },
    {
      key: 'parking',
      label: 'Parking',
      render: (value: unknown) => {
        const parking = value as { title?: string } | undefined;
        return parking?.title || '—';
      },
    },
    {
      key: 'start_time',
      label: 'Start',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatDateTime(value as string)}
        </span>
      ),
    },
    {
      key: 'duration_hours',
      label: 'Duration',
      render: (value: unknown) => formatDuration(value as number),
    },
    {
      key: 'total_price',
      label: 'Amount',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-medium">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: 'booking_status',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => {
        const cfg = getBookingStatusConfig(value as string);
        return <Badge variant={statusBadgeVariant[value as string] || 'default'}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (_value: unknown, row: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedBooking(row as unknown as Booking); setShowDetailDialog(true); }}>
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            {row.booking_status === 'pending' && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); approveMutation.mutate(row.id as number); }}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Approve
              </DropdownMenuItem>
            )}
            {(row.booking_status === 'pending' || row.booking_status === 'approved') && (
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(row.id as number); }}
              >
                <XCircle className="h-4 w-4 mr-2" /> Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage all parking bookings</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: meta?.total || bookings.length, color: 'bg-blue-100 dark:bg-blue-900/30', icon: CalendarCheck, iconColor: 'text-blue-600' },
          { label: 'Active', value: bookings.filter((b: Booking) => b.booking_status === 'active').length, color: 'bg-green-100 dark:bg-green-900/30', icon: Clock, iconColor: 'text-green-600' },
          { label: 'Pending', value: bookings.filter((b: Booking) => b.booking_status === 'pending').length, color: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock, iconColor: 'text-amber-600' },
          { label: 'Completed', value: bookings.filter((b: Booking) => b.booking_status === 'completed').length, color: 'bg-gray-100 dark:bg-gray-800', icon: CheckCircle, iconColor: 'text-gray-600' },
        ].map((stat) => (
          <Card key={stat.label} hover>
            <CardContent className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={(filters as Record<string, string>).status || 'all'}
          onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={bookings as unknown as Record<string, unknown>[]}
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            loading={isLoading}
            searchPlaceholder="Search bookings..."
            emptyMessage="No bookings found"
            emptyIcon={<CalendarCheck className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        {selectedBooking && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking #{String(selectedBooking.id).padStart(6, '0')}</DialogTitle>
              <DialogDescription>Full booking details and timeline</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">User</p>
                <p className="font-medium">{selectedBooking.user?.full_name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{selectedBooking.user?.email}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Parking</p>
                <p className="font-medium">{selectedBooking.parking?.title || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{selectedBooking.parking?.address}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Time</p>
                <p className="font-medium">{formatDateTime(selectedBooking.start_time)}</p>
                <p className="text-xs text-gray-400">to {formatDateTime(selectedBooking.end_time)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Payment</p>
                <p className="font-medium">{formatCurrency(selectedBooking.total_price)}</p>
                <p className="text-xs text-gray-400">{selectedBooking.duration_hours} hours</p>
              </div>
            </div>
            {selectedBooking.vehicle_plate && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                <p className="font-mono font-medium">{selectedBooking.vehicle_plate}</p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Badge variant={statusBadgeVariant[selectedBooking.booking_status] || 'default'} size="lg">
                {getBookingStatusConfig(selectedBooking.booking_status).label}
              </Badge>
              {selectedBooking.booking_status === 'pending' && (
                <>
                  <Button size="sm" variant="success" onClick={() => { approveMutation.mutate(selectedBooking.id); setShowDetailDialog(false); }}>
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { cancelMutation.mutate(selectedBooking.id); setShowDetailDialog(false); }}>
                    <XCircle className="mr-1.5 h-4 w-4" /> Reject
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard, DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, Ban, RotateCcw, MoreHorizontal, Eye
} from 'lucide-react';
import { api, queryKeys } from '@/services';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/tables/data-table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, getTransactionStatusConfig } from '@/utils';
import type { Transaction, TableFilters, PaginationMeta } from '@/types';

export default function TransactionsPage() {
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedTxn, setSelectedTxn] = React.useState<Transaction | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: async () => {
      const res = await api.transactions.adminList(filters);
      return res.data?.data || res.data || [];
    },
  });

  const txns: Transaction[] = Array.isArray(data) ? data : data?.transactions || [];
  const meta: PaginationMeta | undefined = data?.meta;

  const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'default' | 'purple'> = {
    pending: 'warning',
    held: 'info',
    released: 'success',
    refunded: 'purple',
    failed: 'destructive',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3.5 w-3.5" />,
    held: <ArrowDownRight className="h-3.5 w-3.5" />,
    released: <CheckCircle2 className="h-3.5 w-3.5" />,
    refunded: <RotateCcw className="h-3.5 w-3.5" />,
    failed: <Ban className="h-3.5 w-3.5" />,
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '80px',
      render: (value: unknown) => (
        <span className="font-mono text-xs text-gray-500">#{String(value).padStart(6, '0')}</span>
      ),
    },
    {
      key: 'booking',
      label: 'Booking',
      render: (value: unknown) => {
        const booking = value as { id?: number } | undefined;
        return (
          <span className="font-mono text-xs">
            #{String(booking?.id ?? '—').padStart(6, '0')}
          </span>
        );
      },
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(value as number)}
          </span>
          <span className="text-xs text-gray-500">
            Fee: {formatCurrency(row.platform_fee as number)}
          </span>
        </div>
      ),
    },
    {
      key: 'owner_amount',
      label: 'Owner Gets',
      render: (value: unknown) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => {
        const cfg = getTransactionStatusConfig(value as string);
        return (
          <Badge variant={statusBadgeVariant[value as string] || 'default'}>
            <span className="flex items-center gap-1">
              {statusIcons[value as string]}
              {cfg.label}
            </span>
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-gray-500 text-sm">{formatDateTime(value as string)}</span>
      ),
    },
    {
      key: 'actions', label: '', width: '60px',
      render: (_v: unknown, row: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTxn(row as unknown as Transaction); setShowDetail(true); }}>
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const heldAmount = txns
    .filter((t: Transaction) => t.status === 'held')
    .reduce((s: number, t: Transaction) => s + t.total_amount, 0);

  const releasedAmount = txns
    .filter((t: Transaction) => t.status === 'released')
    .reduce((s: number, t: Transaction) => s + t.total_amount, 0);

  const totalFees = txns
    .filter((t: Transaction) => t.status === 'released')
    .reduce((s: number, t: Transaction) => s + t.platform_fee, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Escrow payment transactions overview</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Transactions', value: meta?.total || txns.length, color: 'bg-blue-100 dark:bg-blue-900/30', icon: CreditCard, iconColor: 'text-blue-600' },
          { label: 'Held in Escrow', value: formatCurrency(heldAmount), color: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock, iconColor: 'text-amber-600' },
          { label: 'Total Released', value: formatCurrency(releasedAmount), color: 'bg-green-100 dark:bg-green-900/30', icon: ArrowUpRight, iconColor: 'text-green-600' },
          { label: 'Platform Fees', value: formatCurrency(totalFees), color: 'bg-purple-100 dark:bg-purple-900/30', icon: DollarSign, iconColor: 'text-purple-600' },
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

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={txns as unknown as Record<string, unknown>[]}
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            loading={isLoading}
            searchPlaceholder="Filter transactions..."
            emptyMessage="No transactions found"
            emptyIcon={<CreditCard className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        {selectedTxn && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Escrow payment #{String(selectedTxn.id).padStart(6, '0')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedTxn.total_amount)}
                </span>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Fee (3%)</span>
                  <span className="font-medium text-amber-600">{formatCurrency(selectedTxn.platform_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Owner Payout</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedTxn.owner_amount)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <Badge variant={statusBadgeVariant[selectedTxn.status] || 'default'}>
                    {getTransactionStatusConfig(selectedTxn.status).label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Booking</span>
                  <p className="font-mono text-xs">#{String(selectedTxn.booking_id).padStart(6, '0')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Renter</span>
                  <p className="font-medium">{selectedTxn.renter?.full_name || `User #${selectedTxn.renter_id}`}</p>
                </div>
                <div>
                  <span className="text-gray-500">Owner</span>
                  <p className="font-medium">{selectedTxn.owner?.full_name || `User #${selectedTxn.owner_id}`}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="font-medium">{formatDateTime(selectedTxn.created_at)}</p>
                </div>
              </div>

              {selectedTxn.held_at && (
                <div className="text-xs text-gray-500">
                  Held at: {formatDateTime(selectedTxn.held_at)}
                </div>
              )}
              {selectedTxn.released_at && (
                <div className="text-xs text-green-600">
                  Released at: {formatDateTime(selectedTxn.released_at)}
                </div>
              )}
              {selectedTxn.refunded_at && (
                <div className="text-xs text-purple-600">
                  Refunded at: {formatDateTime(selectedTxn.refunded_at)}
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

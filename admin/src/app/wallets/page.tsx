'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet as WalletIcon, DollarSign, User, Shield,
  ShieldOff, MoreHorizontal, Eye, Ban
} from 'lucide-react';
import { api, queryKeys } from '@/services';
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
import { formatCurrency, formatDate, getWalletStatusConfig } from '@/utils';
import type { Wallet, TableFilters, PaginationMeta } from '@/types';

export default function WalletsPage() {
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedWallet, setSelectedWallet] = React.useState<Wallet | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.wallets.list(filters),
    queryFn: async () => {
      const res = await api.wallets.adminList(filters);
      return res.data?.data || res.data || [];
    },
  });

  const wallets: Wallet[] = Array.isArray(data) ? data : data?.wallets || [];
  const meta: PaginationMeta | undefined = data?.meta;

  const columns = [
    {
      key: 'user',
      label: 'User',
      sortable: false,
      render: (value: unknown) => {
        const user = value as { full_name?: string; email?: string } | undefined;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white">
              <WalletIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.full_name || '—'}</p>
              <p className="text-xs text-gray-500">{user?.email || '—'}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'balance',
      label: 'Balance',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (value: unknown) => (
        <Badge variant="outline">{value as string || 'GEL'}</Badge>
      ),
    },
    {
      key: 'is_blocked',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => {
        const cfg = getWalletStatusConfig(value as boolean);
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-gray-500 text-sm">{formatDate(value as string)}</span>
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedWallet(row as unknown as Wallet); setShowDetail(true); }}>
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            {row.is_blocked ? (
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Shield className="h-4 w-4 mr-2 text-green-600" /> Unblock Wallet
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                <Ban className="h-4 w-4 mr-2" /> Block Wallet
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Wallets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage user wallets and balances</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Wallets', value: wallets.length, color: 'bg-purple-100 dark:bg-purple-900/30', icon: WalletIcon, iconColor: 'text-purple-600' },
          { label: 'Total Balance', value: formatCurrency(wallets.reduce((s: number, w: Wallet) => s + w.balance, 0)), color: 'bg-green-100 dark:bg-green-900/30', icon: DollarSign, iconColor: 'text-green-600' },
          { label: 'Blocked', value: wallets.filter((w: Wallet) => w.is_blocked).length, color: 'bg-red-100 dark:bg-red-900/30', icon: ShieldOff, iconColor: 'text-red-600' },
          { label: 'Active', value: wallets.filter((w: Wallet) => !w.is_blocked).length, color: 'bg-emerald-100 dark:bg-emerald-900/30', icon: Shield, iconColor: 'text-emerald-600' },
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
            data={wallets as unknown as Record<string, unknown>[]}
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            loading={isLoading}
            searchPlaceholder="Search wallets by user name or email..."
            emptyMessage="No wallets found"
            emptyIcon={<WalletIcon className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        {selectedWallet && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Details</DialogTitle>
              <DialogDescription>
                {selectedWallet.user?.full_name || `User #${selectedWallet.user_id}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Balance</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedWallet.balance)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Currency</span>
                  <p className="font-medium">{selectedWallet.currency || 'GEL'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p>
                    <Badge variant={getWalletStatusConfig(selectedWallet.is_blocked).variant}>
                      {getWalletStatusConfig(selectedWallet.is_blocked).label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="font-medium">{formatDate(selectedWallet.created_at)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Wallet ID</span>
                  <p className="font-mono text-xs">#{selectedWallet.id}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

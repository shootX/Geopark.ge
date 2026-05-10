'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Percent, CheckCircle, XCircle, MessageSquare,
  DollarSign, User, ParkingSquare, Clock
} from 'lucide-react';
import { api, queryKeys } from '@/services';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/tables/data-table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate, getOfferStatusConfig } from '@/utils';
import type { Offer, TableFilters, PaginationMeta } from '@/types';

export default function OffersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedOffer, setSelectedOffer] = React.useState<Offer | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.offers.list(filters),
    queryFn: async () => {
      const res = await api.offers.list(filters);
      return res.data?.data || res.data || [];
    },
  });

  const offers: Offer[] = Array.isArray(data) ? data : data?.data || [];
  const meta: PaginationMeta | undefined = data?.meta;

  const acceptMutation = useMutation({
    mutationFn: (id: number) => api.offers.accept(id),
    onSuccess: () => { success('Offer accepted', ''); queryClient.invalidateQueries({ queryKey: queryKeys.offers.all }); },
    onError: () => error('Error', 'Failed to accept offer'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.offers.reject(id),
    onSuccess: () => { success('Offer rejected', ''); queryClient.invalidateQueries({ queryKey: queryKeys.offers.all }); },
    onError: () => error('Error', 'Failed to reject offer'),
  });

  const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'default'> = {
    pending: 'warning', accepted: 'success', rejected: 'destructive', countered: 'info', expired: 'default',
  };

  const columns = [
    { key: 'id', label: 'ID', render: (v: unknown) => <span className="font-mono text-xs">#{String(v).slice(0, 8)}</span> },
    { key: 'sender', label: 'Sender', render: (v: unknown) => (v as { full_name?: string })?.full_name || '—' },
    { key: 'booking', label: 'Booking', render: (v: unknown) => (v as { id?: number }) ? `#${String((v as { id?: number })?.id).padStart(6, '0')}` : '—' },
    { key: 'price_offer', label: 'Amount', sortable: true, render: (v: unknown) => <span className="font-medium">{formatCurrency(v as number)}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (v: unknown) => {
      const cfg = getOfferStatusConfig(v as string);
      return <Badge variant={statusBadgeVariant[v as string] || 'default'}>{cfg.label}</Badge>;
    }},
    { key: 'created_at', label: 'Date', sortable: true, render: (v: unknown) => <span className="text-gray-500 text-sm">{formatDate(v as string)}</span> },
    {
      key: 'actions', label: '', width: '60px',
      render: (_v: unknown, row: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">...</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOffer(row as unknown as Offer); setShowDetail(true); }}>
              <DollarSign className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            {row.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(row.id as number); }}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Accept
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(row.id as number); }}>
                  <XCircle className="h-4 w-4 mr-2" /> Reject
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Offers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage incoming parking offers</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Offers', value: meta?.total || offers.length, color: 'bg-blue-100 dark:bg-blue-900/30', icon: Percent, iconColor: 'text-blue-600' },
          { label: 'Pending', value: offers.filter((o: Offer) => o.status === 'pending').length, color: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock, iconColor: 'text-amber-600' },
          { label: 'Accepted', value: offers.filter((o: Offer) => o.status === 'accepted').length, color: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle, iconColor: 'text-green-600' },
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
            data={offers as unknown as Record<string, unknown>[]}
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            loading={isLoading}
            emptyMessage="No offers found"
            emptyIcon={<Percent className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        {selectedOffer && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Offer Details</DialogTitle>
              <DialogDescription>Negotiation and pricing details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(selectedOffer.price_offer)}</span>
              </div>
              {selectedOffer.message && (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Message</p>
                  <p className="text-sm">{selectedOffer.message}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Badge variant={statusBadgeVariant[selectedOffer.status] || 'default'} size="lg">
                  {getOfferStatusConfig(selectedOffer.status).label}
                </Badge>
                {selectedOffer.status === 'pending' && (
                  <>
                    <Button size="sm" variant="success" onClick={() => { acceptMutation.mutate(selectedOffer.id); setShowDetail(false); }}>
                      <CheckCircle className="mr-1.5 h-4 w-4" /> Accept
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { rejectMutation.mutate(selectedOffer.id); setShowDetail(false); }}>
                      <XCircle className="mr-1.5 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

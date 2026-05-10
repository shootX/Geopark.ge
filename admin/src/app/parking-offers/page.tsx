'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2, MapPin, Star, Clock, DollarSign,
  MoreHorizontal, Eye, Ban, CheckCircle2
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
import { formatCurrency, formatDate, getParkingOfferStatusConfig } from '@/utils';
import type { ParkingOffer, TableFilters, PaginationMeta, MarketplaceStats } from '@/types';

export default function ParkingOffersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedOffer, setSelectedOffer] = React.useState<ParkingOffer | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.parkingOffers.list(filters),
    queryFn: async () => {
      const res = await api.parkingOffers.adminList(filters);
      return res.data?.data || res.data || [];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: queryKeys.parkingOffers.stats(),
    queryFn: async () => {
      const res = await api.parkingOffers.stats();
      return res.data?.data || res.data || {};
    },
  });

  const offers: ParkingOffer[] = Array.isArray(data) ? data : data?.offers || [];
  const meta: PaginationMeta | undefined = data?.meta;
  const stats: MarketplaceStats = statsData || {};

  const statusBadgeVariant: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'default'> = {
    active: 'success', paused: 'warning', blocked: 'destructive', draft: 'default',
  };

  const columns = [
    {
      key: 'title',
      label: 'Offer',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{value as string}</p>
            <p className="text-xs text-gray-500">
              {(row.owner as { full_name?: string })?.full_name || `User #${row.owner_id}`}
              {row.address ? ` · ${(row.address as string).slice(0, 30)}...` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'parking_type',
      label: 'Type',
      render: (value: unknown) => (
        <Badge variant={value === 'private' ? 'outline' : 'default'} size="sm">
          {(value as string) || '—'}
        </Badge>
      ),
    },
    {
      key: 'hourly_price',
      label: 'Price/hr',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(value as number)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => {
        const cfg = getParkingOfferStatusConfig(value as string);
        return <Badge variant={statusBadgeVariant[value as string] || 'default'}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'average_rating',
      label: 'Rating',
      sortable: true,
      render: (value: unknown) => {
        const rating = value as number;
        return rating > 0 ? (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: 'total_reviews',
      label: 'Reviews',
      render: (value: unknown) => <span className="text-gray-500">{(value as number) || 0}</span>,
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOffer(row as unknown as ParkingOffer); setShowDetail(true); }}>
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            {row.status !== 'blocked' && (
              <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                <Ban className="h-4 w-4 mr-2" /> Block Offer
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Parking Offers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Marketplace parking offers from users</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Offers', value: stats.total_offers ?? offers.length, color: 'bg-blue-100 dark:bg-blue-900/30', icon: Building2, iconColor: 'text-blue-600' },
          { label: 'Active', value: stats.active_offers ?? offers.filter((o: ParkingOffer) => o.status === 'active').length, color: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2, iconColor: 'text-green-600' },
          { label: 'Platform Fees', value: formatCurrency(stats.total_platform_fees ?? 0), color: 'bg-emerald-100 dark:bg-emerald-900/30', icon: DollarSign, iconColor: 'text-emerald-600' },
          { label: 'Total Revenue', value: formatCurrency(stats.total_revenue ?? 0), color: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock, iconColor: 'text-amber-600' },
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
            searchPlaceholder="Search parking offers..."
            emptyMessage="No parking offers found"
            emptyIcon={<Building2 className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        {selectedOffer && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedOffer.title}</DialogTitle>
              <DialogDescription>Owner: {selectedOffer.owner?.full_name || `User #${selectedOffer.owner_id}`}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Hourly Price</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(selectedOffer.hourly_price)}</span>
              </div>
              {selectedOffer.description && (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm">{selectedOffer.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Type</span>
                  <p className="font-medium capitalize">{selectedOffer.parking_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p>
                    <Badge variant={statusBadgeVariant[selectedOffer.status] || 'default'}>
                      {getParkingOfferStatusConfig(selectedOffer.status).label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Rating</span>
                  <p className="font-medium">
                    {selectedOffer.average_rating > 0
                      ? `${selectedOffer.average_rating.toFixed(1)} ⭐ (${selectedOffer.total_reviews})`
                      : 'No ratings'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Min Hours</span>
                  <p className="font-medium">{selectedOffer.minimum_hours || 1}h</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Address</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm">{selectedOffer.address}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

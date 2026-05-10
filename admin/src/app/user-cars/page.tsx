'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car, Trash2, Flag, MoreHorizontal, Eye,
  ShieldAlert, User as UserIcon, Star, Calendar
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
import { formatDate, formatDateTime } from '@/utils';
import type { UserCar, TableFilters, PaginationMeta } from '@/types';

const CATEGORY_ICONS: Record<string, string> = {
  sedan: '🚗',
  hatchback: '🚘',
  suv: '🚙',
  crossover: '🚙',
  coupe: '🏎️',
  convertible: '🚘',
  wagon: '🚗',
  minivan: '🚐',
  van: '🚐',
  pickup: '🛻',
  truck: '🚛',
  bus: '🚌',
  motorcycle: '🏍️',
  other: '🚗',
};

const CATEGORY_OPTIONS = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'suv', label: 'SUV' },
  { value: 'crossover', label: 'Crossover' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'convertible', label: 'Convertible' },
  { value: 'wagon', label: 'Wagon' },
  { value: 'minivan', label: 'Minivan' },
  { value: 'van', label: 'Van' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'truck', label: 'Truck' },
  { value: 'bus', label: 'Bus' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'other', label: 'Other' },
];

const FUEL_OPTIONS = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'plugin_hybrid', label: 'Plug-in Hybrid' },
  { value: 'lpg', label: 'LPG' },
];

export default function UserCarsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedCar, setSelectedCar] = React.useState<UserCar | null>(null);
  const [showDetailDialog, setShowDetailDialog] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.userCars.list(filters),
    queryFn: async () => {
      const response = await api.userCars.list(filters);
      return response.data?.data || response.data || [];
    },
  });

  const cars: UserCar[] = Array.isArray(data)
    ? data
    : (data as { cars?: UserCar[] })?.cars || [];
  const meta: PaginationMeta | undefined = Array.isArray(data)
    ? undefined
    : (data as { meta?: PaginationMeta })?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.userCars.delete(id),
    onSuccess: () => {
      success('Vehicle deleted', 'Vehicle has been removed');
      queryClient.invalidateQueries({ queryKey: queryKeys.userCars.all });
    },
    onError: () => error('Error', 'Failed to delete vehicle'),
  });

  const flagMutation = useMutation({
    mutationFn: (id: number) => api.userCars.flag(id),
    onSuccess: () => {
      success('Vehicle flagged', 'Vehicle has been flagged for review');
    },
    onError: () => error('Error', 'Failed to flag vehicle'),
  });

  const columns = [
    {
      key: 'plate_number',
      label: 'Plate Number',
      sortable: true,
      render: (value: unknown) => (
        <span className="font-mono text-sm font-semibold tracking-wider text-gray-900 dark:text-gray-100">
          {value as string}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (value: unknown) => {
        const user = value as { full_name?: string; email?: string; id?: number } | undefined;
        return user ? (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-semibold">
              {user.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <span className="text-sm">{user.full_name || 'Unknown'}</span>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      key: 'brand',
      label: 'Brand / Model',
      sortable: true,
      render: (_value: unknown, row: Record<string, unknown>) => (
        <span className="text-sm">
          {row.brand as string} <span className="text-gray-400">{row.model as string}</span>
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const icon = CATEGORY_ICONS[value as string] || '🚗';
        return (
          <span className="text-sm">
            {icon} {(row.category_label as string) || (value as string)}
          </span>
        );
      },
    },
    {
      key: 'fuel_type',
      label: 'Fuel / Year',
      render: (_value: unknown, row: Record<string, unknown>) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {(row.fuel_type_label as string) || (row.fuel_type as string)} · {row.year as number}
        </span>
      ),
    },
    {
      key: 'is_default',
      label: 'Default',
      render: (value: unknown) =>
        value ? (
          <Badge variant="success" size="sm">
            <Star className="h-3 w-3 mr-1 fill-current" /> Default
          </Badge>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">—</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(value as string, 'MMM dd, yyyy')}
        </span>
      ),
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
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCar(row as unknown as UserCar);
                setShowDetailDialog(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                flagMutation.mutate(row.id as number);
              }}
            >
              <Flag className="h-4 w-4 mr-2 text-amber-600" /> Flag as Suspicious
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this vehicle?')) {
                  deleteMutation.mutate(row.id as number);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const uniqueUsers = React.useMemo(() => {
    const userIds = new Set(cars.map((c) => c.user_id));
    return userIds.size;
  }, [cars]);

  const defaultCars = React.useMemo(
    () => cars.filter((c) => c.is_default).length,
    [cars]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          User Vehicles
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage all registered vehicles across the platform
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total Vehicles',
            value: meta?.total || cars.length,
            color: 'bg-blue-100 dark:bg-blue-900/30',
            icon: Car,
            iconColor: 'text-blue-600',
          },
          {
            label: 'Default Vehicles',
            value: defaultCars,
            color: 'bg-emerald-100 dark:bg-emerald-900/30',
            icon: Star,
            iconColor: 'text-emerald-600',
          },
          {
            label: 'Unique Users',
            value: uniqueUsers,
            color: 'bg-purple-100 dark:bg-purple-900/30',
            icon: UserIcon,
            iconColor: 'text-purple-600',
          },
          {
            label: 'Flagged',
            value: '—',
            color: 'bg-amber-100 dark:bg-amber-900/30',
            icon: ShieldAlert,
            iconColor: 'text-amber-600',
          },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={(filters as Record<string, string>).category || 'all'}
          onValueChange={(v) =>
            setFilters({ ...filters, category: v === 'all' ? undefined : v, page: 1 })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {CATEGORY_ICONS[opt.value] || '🚗'} {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={(filters as Record<string, string>).fuel_type || 'all'}
          onValueChange={(v) =>
            setFilters({ ...filters, fuel_type: v === 'all' ? undefined : v, page: 1 })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuel Types</SelectItem>
            {FUEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={cars as unknown as Record<string, unknown>[]}
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            loading={isLoading}
            searchPlaceholder="Search by plate number..."
            emptyMessage="No vehicles found"
            emptyIcon={<Car className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        {selectedCar && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {CATEGORY_ICONS[selectedCar.category] || '🚗'}{' '}
                {selectedCar.brand} {selectedCar.model}
              </DialogTitle>
              <DialogDescription>
                Vehicle #{selectedCar.id} ·{' '}
                <span className="font-mono">{selectedCar.plate_number}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Owner</p>
                <p className="font-medium">
                  {(selectedCar.user as { full_name?: string })?.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400">
                  {(selectedCar.user as { email?: string })?.email}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Plate Number</p>
                <p className="font-mono font-medium text-lg tracking-wider">
                  {selectedCar.plate_number}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <p className="font-medium">
                  {CATEGORY_ICONS[selectedCar.category] || '🚗'}{' '}
                  {selectedCar.category_label}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Fuel Type</p>
                <p className="font-medium">{selectedCar.fuel_type_label}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Year</p>
                <p className="font-medium">{selectedCar.year}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Default Vehicle</p>
                <p className="font-medium">
                  {selectedCar.is_default ? (
                    <Badge variant="success" size="sm">
                      <Star className="h-3 w-3 mr-1 fill-current" /> Yes
                    </Badge>
                  ) : (
                    'No'
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="font-medium">{formatDateTime(selectedCar.created_at)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="font-medium">{formatDateTime(selectedCar.updated_at)}</p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => flagMutation.mutate(selectedCar.id)}
                >
                  <Flag className="h-4 w-4 mr-1.5 text-amber-600" />
                  Flag as Suspicious
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this vehicle?')) {
                    deleteMutation.mutate(selectedCar.id);
                    setShowDetailDialog(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

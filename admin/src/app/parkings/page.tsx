'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ParkingSquare, Plus, Search, MapPin, Car, Clock,
  MoreHorizontal, Edit3, Trash2, Eye, ToggleLeft, ToggleRight
} from 'lucide-react';
import { api, queryKeys } from '@/services';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatCurrency, formatDate, getParkingStatusConfig } from '@/utils';
import type { Parking, TableFilters, PaginationMeta } from '@/types';

export default function ParkingsPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedParking, setSelectedParking] = React.useState<Parking | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.parkings.list(filters),
    queryFn: async () => {
      const response = await api.parkings.adminList(filters);
      return response.data?.data || response.data || [];
    },
  });

  const parkings: Parking[] = Array.isArray(data) ? data : data?.data || [];
  const meta: PaginationMeta | undefined = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.parkings.delete(id),
    onSuccess: () => {
      success('Parking deleted', 'Parking has been removed');
      queryClient.invalidateQueries({ queryKey: queryKeys.parkings.all });
      setShowDeleteDialog(false);
    },
    onError: () => error('Error', 'Failed to delete parking'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => api.parkings.toggleStatus(id),
    onSuccess: () => {
      success('Status updated', 'Parking status has been changed');
      queryClient.invalidateQueries({ queryKey: queryKeys.parkings.all });
    },
    onError: () => error('Error', 'Failed to update status'),
  });

  const statusConfigs: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    active: 'success',
    inactive: 'default',
    maintenance: 'warning',
  };

  const columns = [
    {
      key: 'title',
      label: 'Parking',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <ParkingSquare className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{value as string}</p>
            <p className="text-xs text-gray-500">{row.address as string}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: unknown) => (
        <Badge variant={statusConfigs[value as string] || 'default'}>
          {(value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'total_slots',
      label: 'Total Slots',
      sortable: true,
    },
    {
      key: 'available_slots',
      label: 'Available',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => {
        const available = value as number;
        const total = row.total_slots as number;
        const pct = total > 0 ? Math.round((available / total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <span className={available > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {available}
            </span>
            <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${100 - pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'base_price',
      label: 'Base Price',
      sortable: true,
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-gray-500 dark:text-gray-400">{formatDate(value as string)}</span>
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedParking(row as unknown as Parking); }}>
              <Eye className="h-4 w-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Edit3 className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate(row.id as number); }}>
              {row.status === 'active' ? (
                <><ToggleLeft className="h-4 w-4 mr-2" /> Deactivate</>
              ) : (
                <><ToggleRight className="h-4 w-4 mr-2" /> Activate</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={(e) => { e.stopPropagation(); setSelectedParking(row as unknown as Parking); setShowDeleteDialog(true); }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Parkings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage parking locations and availability</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Parking
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <ParkingSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Parkings</p>
              <p className="text-lg font-bold">{parkings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Car className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Slots</p>
              <p className="text-lg font-bold">{parkings.reduce((s: number, p: Parking) => s + p.total_slots, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Available</p>
              <p className="text-lg font-bold">{parkings.reduce((s: number, p: Parking) => s + p.available_slots, 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-lg font-bold">{parkings.filter((p: Parking) => p.status === 'active').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={parkings as unknown as Record<string, unknown>[]}
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            loading={isLoading}
            searchPlaceholder="Search parkings..."
            emptyMessage="No parkings found"
            emptyIcon={<ParkingSquare className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        {selectedParking && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Parking</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedParking.title}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(selectedParking.id)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

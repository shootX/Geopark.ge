'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Search, Filter, Mail, Phone, Calendar,
  Shield, MoreHorizontal, UserCheck, UserX,
  Trash2, Edit, Ban, CheckCircle, AlertTriangle
} from 'lucide-react';
import { api, queryKeys } from '@/services';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/tables/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/utils';
import type { User, TableFilters, PaginationMeta } from '@/types';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [filters, setFilters] = React.useState<TableFilters>({});
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showUserDialog, setShowUserDialog] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const response = await api.users.list(filters);
      // response = AxiosResponse { data: { success: true, data: { users: [...], meta: {...} } } }
      // Извлекаем вложенный объект { users: [...], meta: {...} }
      return response.data?.data || response.data;
    },
  });

  // data = { users: [...], meta: {...} } (после response.data?.data)
  const users: User[] = data?.users || [];
  const meta: PaginationMeta | undefined = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.users.delete(id),
    onSuccess: () => {
      success('User deleted', 'The user has been removed successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setShowDeleteDialog(false);
    },
    onError: () => error('Error', 'Failed to delete user'),
  });

  const toggleBlockMutation = useMutation({
    mutationFn: (id: number) => api.users.update(id, { status: 'blocked' }),
    onSuccess: () => {
      success('User blocked', 'User has been blocked successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: () => error('Error', 'Failed to block user'),
  });

  const roleColors: Record<string, 'default' | 'success' | 'warning' | 'info' | 'purple'> = {
    admin: 'purple',
    owner: 'info',
    user: 'default',
  };

  const columns = [
    {
      key: 'full_name',
      label: 'User',
      sortable: true,
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
            {(value as string)?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{value as string}</p>
            <p className="text-xs text-gray-500">{row.email as string}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: unknown) => {
        const role = (value as string) ?? '';
        return (
          <Badge variant={roleColors[role] || 'default'}>
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : '—'}
          </Badge>
        );
      },
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value: unknown) => value ? (value as string) : <span className="text-gray-400">—</span>,
    },
    {
      key: 'email_verified_at',
      label: 'Verified',
      render: (value: unknown) => (
        value ? (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Yes
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            No
          </span>
        )
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (value: unknown) => (
        <span className="text-gray-500 dark:text-gray-400">
          {formatDate(value as string)}
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
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedUser(row as unknown as User); setShowUserDialog(true); }}>
              <UserCheck className="h-4 w-4 mr-2" /> View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleBlockMutation.mutate(row.id as number); }}>
              <Ban className="h-4 w-4 mr-2" /> Block User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={(e) => { e.stopPropagation(); setSelectedUser(row as unknown as User); setShowDeleteDialog(true); }}
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage all users, roles, and permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-lg font-bold">{meta?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
              <p className="text-lg font-bold">{users.filter((u: User) => u.role === 'admin').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
              <p className="text-lg font-bold">{users.filter((u: User) => u.email_verified_at).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <UserX className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unverified</p>
              <p className="text-lg font-bold">{users.filter((u: User) => !u.email_verified_at).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-9"
              />
            </div>
            <Select
              value={(filters as Record<string, string>).role || 'all'}
              onValueChange={(v) => setFilters({ ...filters, role: v === 'all' ? undefined : v, page: 1 })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={(filters as Record<string, string>).verified || 'all'}
              onValueChange={(v) => setFilters({ ...filters, verified: v === 'all' ? undefined : v, page: 1 })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users as unknown as Record<string, unknown>[]}
            meta={meta}
            filters={filters}
            onFiltersChange={setFilters}
            loading={isLoading}
            searchPlaceholder="Search users..."
            emptyMessage="No users found"
            emptyIcon={<Users className="h-6 w-6 text-gray-400" />}
          />
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        {selectedUser && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>Detailed information about this user</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedUser.full_name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <Badge variant={roleColors[selectedUser.role] || 'default'} className="mt-1">
                    {selectedUser.role?.charAt(0).toUpperCase() + selectedUser.role?.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedUser.phone || '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="h-3.5 w-3.5" /> Joined
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDateTime(selectedUser.created_at)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <Shield className="h-3.5 w-3.5" /> Permissions
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedUser.permissions?.length || 0} assigned</p>
                </div>
              </div>
              {selectedUser.permissions && selectedUser.permissions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.permissions.map((perm) => (
                      <Badge key={perm} variant="outline" size="sm">{perm}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        {selectedUser && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedUser.full_name}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button
                variant="destructive"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selectedUser.id)}
              >
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

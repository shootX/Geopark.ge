'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ChevronDown, ChevronUp, ChevronsUpDown, Search,
  ChevronLeft, ChevronRight, Filter, X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TableColumn, BulkAction, TableFilters, PaginationMeta } from '@/types';

// ─── Debounce utility ───
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Memoized Table Row ───
const TableRow = React.memo(function TableRow({
  row,
  columns,
  idField,
  onRowClick,
  selectedRows,
  onSelectedRowsChange,
}: {
  row: Record<string, unknown>;
  columns: TableColumn[];
  idField: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  selectedRows?: Set<string | number>;
  onSelectedRowsChange?: (selected: Set<string | number>) => void;
}) {
  const isSelected = selectedRows?.has(row[idField] as string | number);

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30',
        onRowClick && 'cursor-pointer',
        isSelected && 'bg-blue-50/50 dark:bg-blue-900/20'
      )}
      onClick={() => onRowClick?.(row)}
    >
      {onSelectedRowsChange && (
        <td className="px-3 py-3 w-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => {
              const newSet = new Set(selectedRows);
              const id = row[idField] as string | number;
              if (newSet.has(id)) newSet.delete(id);
              else newSet.add(id);
              onSelectedRowsChange(newSet);
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label="Select row"
          />
        </td>
      )}
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          {col.render ? col.render(row[col.key], row) : (row[col.key] as React.ReactNode) || '-'}
        </td>
      ))}
    </tr>
  );
});

// ─── Data Table ───
interface DataTableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  meta?: PaginationMeta;
  filters?: TableFilters;
  onFiltersChange?: (filters: TableFilters) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, selectedIds: (string | number)[]) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  selectedRows?: Set<string | number>;
  onSelectedRowsChange?: (selected: Set<string | number>) => void;
  idField?: string;
  className?: string;
}

export function DataTable({
  columns,
  data,
  meta,
  filters,
  onFiltersChange,
  onRowClick,
  bulkActions,
  onBulkAction,
  loading,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  emptyIcon,
  selectedRows: externalSelectedRows,
  onSelectedRowsChange,
  idField = 'id',
  className,
}: DataTableProps) {
  const [sortColumn, setSortColumn] = React.useState(filters?.sort_by || '');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>(filters?.sort_order || 'desc');
  const [searchValue, setSearchValue] = React.useState(filters?.search || '');
  const [internalSelectedRows, setInternalSelectedRows] = React.useState<Set<string | number>>(new Set());
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const selectedRows = externalSelectedRows || internalSelectedRows;
  const setSelectedRows = onSelectedRowsChange || setInternalSelectedRows;

  // Debounce search by 300ms
  const debouncedSearch = useDebounce(searchValue, 300);
  React.useEffect(() => {
    if (debouncedSearch !== filters?.search) {
      onFiltersChange?.({ ...filters, search: debouncedSearch, page: 1 });
    }
    // Intentionally only react to debouncedSearch changes to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters/onFiltersChange refs change on every render
  }, [debouncedSearch]);

  // ─── Virtualization for large datasets ───
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => tableContainerRef.current?.querySelector('tbody')?.parentElement || null,
    estimateSize: () => 53,
    overscan: 10,
  });

  // ─── Stable callback refs ───
  const handleSort = React.useCallback((columnKey: string) => {
    const newOrder = sortColumn === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortOrder(newOrder);
    onFiltersChange?.({ ...filters, sort_by: columnKey, sort_order: newOrder });
  }, [sortColumn, sortOrder, filters, onFiltersChange]);

  const handlePageChange = React.useCallback((page: number) => {
    onFiltersChange?.({ ...filters, page });
  }, [filters, onFiltersChange]);

  const toggleAll = React.useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((row) => row[idField] as string | number)));
    }
  }, [data, idField, selectedRows.size, setSelectedRows]);

  const clearFilters = React.useCallback(() => {
    setSearchValue('');
    onFiltersChange?.({});
  }, [onFiltersChange]);

  const hasActiveFilters = React.useMemo(() => {
    if (!filters) return false;
    return Object.values(filters).some((v) => v !== undefined && v !== null && v !== '' && v !== 0);
  }, [filters]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-8"
            aria-label={searchPlaceholder}
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(''); onFiltersChange?.({ ...filters, search: '', page: 1 }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} aria-label="Clear all filters">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          )}

          {bulkActions && selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedRows.size} selected
              </span>
              {bulkActions.map((action) => (
                <Button
                  key={action.action}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => onBulkAction?.(action.action, Array.from(selectedRows))}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {meta && (
            <Select
              value={(filters?.per_page || 10).toString()}
              onValueChange={(v) => onFiltersChange?.({ ...filters, per_page: parseInt(v), page: 1 })}
            >
              <SelectTrigger className="w-20" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/50 dark:border-gray-700/50" ref={tableContainerRef}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
                {onSelectedRowsChange && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedRows.size === data.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                      col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && handleSort(col.key)}
                    aria-sort={
                      sortColumn === col.key
                        ? sortOrder === 'asc' ? 'ascending' : 'descending'
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">
                          {sortColumn === col.key ? (
                            sortOrder === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800" style={{ position: 'relative' }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {onSelectedRowsChange && <td className="px-3 py-3"><div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onSelectedRowsChange ? 1 : 0)} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {emptyIcon || (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                          <Search className="h-6 w-6 text-gray-400" aria-hidden="true" />
                        </div>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Virtualized rows — only render visible ones
                <>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = data[virtualRow.index];
                    if (!row) return null;
                    return (
                      <tr key={row[idField] as string | number || virtualRow.index}>
                        <td colSpan={columns.length + (onSelectedRowsChange ? 1 : 0)}>
                          <table style={{ width: '100%', tableLayout: 'fixed' }}>
                            <tbody>
                              <TableRow
                                row={row}
                                columns={columns}
                                idField={idField}
                                onRowClick={onRowClick}
                                selectedRows={selectedRows}
                                onSelectedRowsChange={onSelectedRowsChange}
                              />
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {meta.from} to {meta.to} of {meta.total} entries
          </p>
          <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.current_page <= 1}
              onClick={() => handlePageChange(meta.current_page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(meta.current_page - 2, meta.last_page - 4)) + i;
              if (pageNum > meta.last_page) return null;
              return (
                <Button
                  key={pageNum}
                  variant={meta.current_page === pageNum ? 'default' : 'ghost'}
                  size="sm"
                  className="min-w-[2rem]"
                  onClick={() => handlePageChange(pageNum)}
                  aria-label={`Page ${pageNum}`}
                  aria-current={meta.current_page === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => handlePageChange(meta.current_page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

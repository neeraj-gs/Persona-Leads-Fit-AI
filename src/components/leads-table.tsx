'use client';

import { useState, useMemo } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Building2,
  User,
  Briefcase,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LeadRanking {
  id: string;
  isRelevant: boolean;
  relevanceScore: number;
  companyRank: number | null;
  reasoning: string | null;
  department: string | null;
  seniority: string | null;
  buyerType: string | null;
  companySizeCategory: string | null;
  positiveSignals: string | null;
  negativeSignals: string | null;
  lead: {
    id: string;
    accountName: string;
    leadFirstName: string | null;
    leadLastName: string | null;
    leadJobTitle: string | null;
    accountDomain: string | null;
    accountEmployeeRange: string | null;
    accountIndustry: string | null;
  };
}

interface LeadsTableProps {
  data: LeadRanking[];
  isLoading?: boolean;
}

export function LeadsTable({ data, isLoading }: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'relevanceScore', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadRanking | null>(null);

  const columns = useMemo<ColumnDef<LeadRanking>[]>(
    () => [
      {
        accessorKey: 'companyRank',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Rank
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const rank = row.getValue('companyRank') as number | null;
          const isRelevant = row.original.isRelevant;
          return rank ? (
            <Badge variant={rank === 1 ? 'default' : 'secondary'}>#{rank}</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {isRelevant ? '-' : 'N/A'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'relevanceScore',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            Score
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const score = row.getValue('relevanceScore') as number;
          const bgColor =
            score >= 70 ? 'bg-green-100 text-green-800' :
            score >= 40 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800';
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
              {score}
            </span>
          );
        },
      },
      {
        id: 'name',
        accessorFn: (row) => `${row.lead.leadFirstName || ''} ${row.lead.leadLastName || ''}`.trim(),
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            <User className="mr-2 h-4 w-4" />
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const firstName = row.original.lead.leadFirstName || '';
          const lastName = row.original.lead.leadLastName || '';
          return (
            <span className="font-medium">
              {firstName} {lastName}
            </span>
          );
        },
      },
      {
        id: 'title',
        accessorFn: (row) => row.lead.leadJobTitle,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const title = row.original.lead.leadJobTitle;
          return title ? (
            <span className="text-sm">{title}</span>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          );
        },
      },
      {
        id: 'company',
        accessorFn: (row) => row.lead.accountName,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const company = row.original.lead.accountName;
          const size = row.original.lead.accountEmployeeRange;
          return (
            <div>
              <span className="font-medium">{company}</span>
              {size && (
                <span className="text-xs text-muted-foreground ml-2">({size})</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'buyerType',
        header: 'Buyer Type',
        cell: ({ row }) => {
          const buyerType = row.getValue('buyerType') as string | null;
          if (!buyerType) return <span className="text-muted-foreground">-</span>;

          const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
            decision_maker: 'default',
            champion: 'secondary',
            influencer: 'outline',
            not_relevant: 'destructive',
          };

          return (
            <Badge variant={variants[buyerType] || 'outline'}>
              {buyerType.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'isRelevant',
        header: 'Relevant',
        cell: ({ row }) => {
          const isRelevant = row.getValue('isRelevant') as boolean;
          return (
            <Badge variant={isRelevant ? 'default' : 'destructive'}>
              {isRelevant ? 'Yes' : 'No'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search leads..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              Detailed AI analysis for this lead
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">
                    {selectedLead.lead.leadFirstName} {selectedLead.lead.leadLastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p className="text-lg font-semibold">{selectedLead.lead.accountName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p>{selectedLead.lead.leadJobTitle || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Size</label>
                  <p>{selectedLead.lead.accountEmployeeRange || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">AI Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Score</label>
                    <p className="text-2xl font-bold">{selectedLead.relevanceScore}/100</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Rank</label>
                    <p className="text-2xl font-bold">
                      {selectedLead.companyRank ? `#${selectedLead.companyRank}` : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Buyer Type</label>
                    <p>{selectedLead.buyerType?.replace('_', ' ') || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Seniority</label>
                    <p>{selectedLead.seniority?.replace('_', ' ') || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium text-muted-foreground">Reasoning</label>
                <p className="mt-1 text-sm">{selectedLead.reasoning || 'No reasoning provided'}</p>
              </div>

              {selectedLead.positiveSignals && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Positive Signals</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {JSON.parse(selectedLead.positiveSignals).map((signal: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-green-100">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedLead.negativeSignals && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Negative Signals</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {JSON.parse(selectedLead.negativeSignals).map((signal: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-red-100">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

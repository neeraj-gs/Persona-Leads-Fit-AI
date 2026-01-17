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
  Search,
  Crown,
  Star,
  Target,
  X,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
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

  const getBuyerTypeIcon = (buyerType: string | null) => {
    switch (buyerType) {
      case 'decision_maker':
        return <Crown className="h-3 w-3" />;
      case 'champion':
        return <Star className="h-3 w-3" />;
      case 'influencer':
        return <Target className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getBuyerTypeStyles = (buyerType: string | null) => {
    switch (buyerType) {
      case 'decision_maker':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'champion':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'influencer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'not_relevant':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-secondary text-muted-foreground';
    }
  };

  const columns = useMemo<ColumnDef<LeadRanking>[]>(
    () => [
      {
        accessorKey: 'companyRank',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 font-semibold"
          >
            Rank
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const rank = row.getValue('companyRank') as number | null;
          const isRelevant = row.original.isRelevant;
          if (rank === 1) {
            return (
              <div className="flex items-center justify-center w-8 h-8 rounded-full gradient-primary text-white font-bold text-sm">
                1
              </div>
            );
          }
          return rank ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-foreground font-semibold text-sm">
              {rank}
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 text-muted-foreground text-xs">
              {isRelevant ? '-' : 'N/A'}
            </div>
          );
        },
      },
      {
        accessorKey: 'relevanceScore',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 font-semibold"
          >
            Score
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const score = row.getValue('relevanceScore') as number;
          const getScoreColor = () => {
            if (score >= 70) return 'from-green-500 to-emerald-400';
            if (score >= 40) return 'from-amber-500 to-yellow-400';
            return 'from-red-500 to-orange-400';
          };
          return (
            <div className="relative w-14">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getScoreColor()}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold">
                {score}
              </span>
            </div>
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
            className="px-0 font-semibold"
          >
            <User className="mr-1 h-3 w-3" />
            Name
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const firstName = row.original.lead.leadFirstName || '';
          const lastName = row.original.lead.leadLastName || '';
          const isRelevant = row.original.isRelevant;
          return (
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                isRelevant ? 'gradient-primary' : 'bg-slate-300'
              }`}>
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
              <span className={`font-medium ${!isRelevant ? 'text-muted-foreground' : ''}`}>
                {firstName} {lastName}
              </span>
            </div>
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
            className="px-0 font-semibold"
          >
            <Briefcase className="mr-1 h-3 w-3" />
            Title
            <ArrowUpDown className="ml-1 h-3 w-3" />
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
            className="px-0 font-semibold"
          >
            <Building2 className="mr-1 h-3 w-3" />
            Company
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const company = row.original.lead.accountName;
          const size = row.original.lead.accountEmployeeRange;
          return (
            <div>
              <span className="font-medium">{company}</span>
              {size && (
                <Badge variant="secondary" className="ml-2 text-xs font-normal">
                  {size}
                </Badge>
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

          return (
            <Badge className={`${getBuyerTypeStyles(buyerType)} border gap-1`}>
              {getBuyerTypeIcon(buyerType)}
              {buyerType.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'isRelevant',
        header: 'Status',
        cell: ({ row }) => {
          const isRelevant = row.getValue('isRelevant') as boolean;
          return isRelevant ? (
            <Badge className="bg-green-100 text-green-700 border border-green-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Qualified
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              <X className="h-3 w-3 mr-1" />
              Filtered
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLead(lead)}
              className="h-8 px-2 hover:bg-primary/10 hover:text-primary"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
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
      <div className="space-y-4 p-6">
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20 bg-secondary/50 border-0">
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

        {/* Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-secondary/30 hover:bg-secondary/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs uppercase tracking-wider">
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
                  <TableCell colSpan={columns.length} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-muted-foreground">Loading results...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    className={`
                      transition-colors hover:bg-secondary/30 cursor-pointer
                      ${!row.original.isRelevant ? 'opacity-60' : ''}
                    `}
                    onClick={() => setSelectedLead(row.original)}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
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
                  <TableCell colSpan={columns.length} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">No results found</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-semibold text-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>
            {' '}to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>
            {' '}of{' '}
            <span className="font-semibold text-foreground">
              {table.getFilteredRowModel().rows.length}
            </span>
            {' '}results
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const pageIndex = table.getState().pagination.pageIndex;
                let page = i;
                if (table.getPageCount() > 5) {
                  if (pageIndex < 3) {
                    page = i;
                  } else if (pageIndex > table.getPageCount() - 4) {
                    page = table.getPageCount() - 5 + i;
                  } else {
                    page = pageIndex - 2 + i;
                  }
                }
                return (
                  <Button
                    key={page}
                    variant={pageIndex === page ? 'default' : 'outline'}
                    size="icon"
                    className={`h-8 w-8 ${pageIndex === page ? 'gradient-primary text-white' : ''}`}
                    onClick={() => table.setPageIndex(page)}
                  >
                    {page + 1}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
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
        <DialogContent className="max-w-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLead && (
                <>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold ${
                    selectedLead.isRelevant ? 'gradient-primary' : 'bg-slate-400'
                  }`}>
                    {selectedLead.lead.leadFirstName?.charAt(0)}
                    {selectedLead.lead.leadLastName?.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xl">
                      {selectedLead.lead.leadFirstName} {selectedLead.lead.leadLastName}
                    </span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {selectedLead.lead.leadJobTitle || 'No title'}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6 mt-4">
              {/* Score Card */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
                  <p className="text-3xl font-bold text-primary">{selectedLead.relevanceScore}</p>
                  <p className="text-xs text-muted-foreground">Relevance Score</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 border text-center">
                  <p className="text-3xl font-bold">
                    {selectedLead.companyRank ? `#${selectedLead.companyRank}` : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Company Rank</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 border text-center">
                  <Badge className={`${getBuyerTypeStyles(selectedLead.buyerType)} text-sm`}>
                    {selectedLead.buyerType?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">Buyer Type</p>
                </div>
              </div>

              {/* Company Info */}
              <div className="p-4 rounded-xl bg-secondary/30 border">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{selectedLead.lead.accountName}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-medium">{selectedLead.lead.accountEmployeeRange || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Industry</p>
                    <p className="font-medium">{selectedLead.lead.accountIndustry || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Domain</p>
                    <p className="font-medium">{selectedLead.lead.accountDomain || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="p-4 rounded-xl bg-secondary/30 border">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold">AI Analysis</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedLead.reasoning || 'No reasoning provided'}
                </p>
              </div>

              {/* Signals */}
              <div className="grid grid-cols-2 gap-4">
                {selectedLead.positiveSignals && (
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700">Positive Signals</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedLead.positiveSignals).map((signal: string, i: number) => (
                        <Badge key={i} className="bg-green-100 text-green-700 border-green-200">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLead.negativeSignals && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-700">Negative Signals</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedLead.negativeSignals).map((signal: string, i: number) => (
                        <Badge key={i} className="bg-red-100 text-red-700 border-red-200">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

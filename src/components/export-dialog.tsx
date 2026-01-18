'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Filter,
  Building2,
  Users,
  Target,
  Star,
  Crown,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface ExportDialogProps {
  runId: string;
  totalLeads: number;
  relevantLeads: number;
  totalCompanies: number;
  onExport?: () => void;
}

type LeadSelectionMode = 'all' | 'top_per_company' | 'best_per_company';
type CompanySelectionMode = 'all' | 'top_by_score' | 'top_by_lead_count';
type BuyerTypeFilter = 'all' | 'decision_maker' | 'champion' | 'influencer';
type SeniorityFilter = 'all' | 'founder' | 'c_level' | 'vp' | 'director' | 'manager';
type CompanySizeFilter = 'all' | 'startup' | 'smb' | 'mid_market' | 'enterprise';

export function ExportDialog({
  runId,
  totalLeads,
  relevantLeads,
  totalCompanies,
  onExport,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Lead selection
  const [leadSelectionMode, setLeadSelectionMode] = useState<LeadSelectionMode>('all');
  const [topLeadsPerCompany, setTopLeadsPerCompany] = useState(3);

  // Company selection
  const [companySelectionMode, setCompanySelectionMode] = useState<CompanySelectionMode>('all');
  const [topCompaniesCount, setTopCompaniesCount] = useState(5);

  // Filters
  const [buyerTypeFilter, setBuyerTypeFilter] = useState<BuyerTypeFilter>('all');
  const [seniorityFilter, setSeniorityFilter] = useState<SeniorityFilter>('all');
  const [companySizeFilter, setCompanySizeFilter] = useState<CompanySizeFilter>('all');
  const [minRelevanceScore, setMinRelevanceScore] = useState(0);
  const [includeNonRelevant, setIncludeNonRelevant] = useState(false);

  // Generate export description
  const exportDescription = useMemo(() => {
    const parts: string[] = [];
    let estimatedRows = relevantLeads;
    let companiesIncluded = totalCompanies;

    // Lead selection description
    if (leadSelectionMode === 'all') {
      parts.push('All leads');
    } else if (leadSelectionMode === 'top_per_company') {
      parts.push(`Top ${topLeadsPerCompany} lead${topLeadsPerCompany > 1 ? 's' : ''} per company`);
      estimatedRows = Math.min(totalCompanies * topLeadsPerCompany, relevantLeads);
    } else if (leadSelectionMode === 'best_per_company') {
      parts.push('Best lead only per company');
      estimatedRows = Math.min(totalCompanies, relevantLeads);
    }

    // Company selection description
    if (companySelectionMode === 'top_by_score') {
      companiesIncluded = Math.min(topCompaniesCount, totalCompanies);
      parts.push(`from top ${topCompaniesCount} companies by score`);
      if (leadSelectionMode === 'all') {
        estimatedRows = Math.round(relevantLeads * (topCompaniesCount / totalCompanies));
      } else if (leadSelectionMode === 'top_per_company') {
        estimatedRows = topCompaniesCount * topLeadsPerCompany;
      } else {
        estimatedRows = topCompaniesCount;
      }
    } else if (companySelectionMode === 'top_by_lead_count') {
      companiesIncluded = Math.min(topCompaniesCount, totalCompanies);
      parts.push(`from top ${topCompaniesCount} companies by contact count`);
      if (leadSelectionMode === 'best_per_company') {
        estimatedRows = topCompaniesCount;
      }
    }

    // Filters description
    const filters: string[] = [];

    if (buyerTypeFilter !== 'all') {
      const labels: Record<BuyerTypeFilter, string> = {
        all: '', decision_maker: 'Decision Makers', champion: 'Champions', influencer: 'Influencers',
      };
      filters.push(labels[buyerTypeFilter]);
    }

    if (seniorityFilter !== 'all') {
      const labels: Record<SeniorityFilter, string> = {
        all: '', founder: 'Founders', c_level: 'C-Level', vp: 'VPs', director: 'Directors', manager: 'Managers',
      };
      filters.push(labels[seniorityFilter]);
    }

    if (companySizeFilter !== 'all') {
      const labels: Record<CompanySizeFilter, string> = {
        all: '', startup: 'Startups', smb: 'SMBs', mid_market: 'Mid-Market', enterprise: 'Enterprise',
      };
      filters.push(labels[companySizeFilter]);
    }

    if (minRelevanceScore > 0) {
      filters.push(`score ≥${minRelevanceScore}%`);
    }

    if (filters.length > 0) {
      parts.push(`• ${filters.join(', ')}`);
      estimatedRows = Math.round(estimatedRows * 0.6);
    }

    if (includeNonRelevant) {
      parts.push('(+non-relevant)');
      estimatedRows = Math.round(estimatedRows * 1.3);
    }

    return {
      text: parts.join(' '),
      estimatedRows: Math.max(1, Math.min(estimatedRows, includeNonRelevant ? totalLeads : relevantLeads)),
      companiesIncluded,
    };
  }, [
    leadSelectionMode, topLeadsPerCompany, companySelectionMode, topCompaniesCount,
    buyerTypeFilter, seniorityFilter, companySizeFilter, minRelevanceScore,
    includeNonRelevant, totalLeads, relevantLeads, totalCompanies,
  ]);

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        runId,
        leadSelectionMode,
        ...(leadSelectionMode === 'top_per_company' && { topLeadsPerCompany: topLeadsPerCompany.toString() }),
        companySelectionMode,
        ...((companySelectionMode === 'top_by_score' || companySelectionMode === 'top_by_lead_count') && {
          topCompaniesCount: topCompaniesCount.toString(),
        }),
        ...(buyerTypeFilter !== 'all' && { buyerType: buyerTypeFilter }),
        ...(seniorityFilter !== 'all' && { seniority: seniorityFilter }),
        ...(companySizeFilter !== 'all' && { companySize: companySizeFilter }),
        ...(minRelevanceScore > 0 && { minScore: minRelevanceScore.toString() }),
        includeNonRelevant: includeNonRelevant.toString(),
      });

      const response = await fetch(`/api/export?${params.toString()}`);

      if (!response.ok) throw new Error('Export failed');

      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `export-${runId.slice(0, 8)}.csv`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onExport?.();
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setLeadSelectionMode('all');
    setTopLeadsPerCompany(3);
    setCompanySelectionMode('all');
    setTopCompaniesCount(5);
    setBuyerTypeFilter('all');
    setSeniorityFilter('all');
    setCompanySizeFilter('all');
    setMinRelevanceScore(0);
    setIncludeNonRelevant(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Ranked Leads
          </DialogTitle>
          <DialogDescription>
            Configure filters and export to CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lead Selection - Compact */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Lead Selection
            </Label>
            <Select value={leadSelectionMode} onValueChange={(v) => setLeadSelectionMode(v as LeadSelectionMode)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All relevant leads</SelectItem>
                <SelectItem value="top_per_company">Top N leads per company</SelectItem>
                <SelectItem value="best_per_company">Best lead only (rank #1)</SelectItem>
              </SelectContent>
            </Select>
            {leadSelectionMode === 'top_per_company' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Top</span>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={topLeadsPerCompany}
                  onChange={(e) => setTopLeadsPerCompany(parseInt(e.target.value) || 1)}
                  className="w-16 h-8"
                />
                <span className="text-sm text-muted-foreground">leads per company</span>
              </div>
            )}
          </div>

          {/* Company Selection - Compact */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Company Selection
            </Label>
            <Select value={companySelectionMode} onValueChange={(v) => setCompanySelectionMode(v as CompanySelectionMode)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {totalCompanies} companies</SelectItem>
                <SelectItem value="top_by_score">Top N by relevance score</SelectItem>
                <SelectItem value="top_by_lead_count">Top N by contact count</SelectItem>
              </SelectContent>
            </Select>
            {companySelectionMode !== 'all' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Top</span>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={topCompaniesCount}
                  onChange={(e) => setTopCompaniesCount(parseInt(e.target.value) || 1)}
                  className="w-16 h-8"
                />
                <span className="text-sm text-muted-foreground">companies</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Filters - Compact Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filters (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={buyerTypeFilter} onValueChange={(v) => setBuyerTypeFilter(v as BuyerTypeFilter)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Buyer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buyer Types</SelectItem>
                  <SelectItem value="decision_maker">
                    <span className="flex items-center gap-1.5"><Crown className="h-3 w-3 text-purple-500" />Decision Makers</span>
                  </SelectItem>
                  <SelectItem value="champion">
                    <span className="flex items-center gap-1.5"><Star className="h-3 w-3 text-green-500" />Champions</span>
                  </SelectItem>
                  <SelectItem value="influencer">
                    <span className="flex items-center gap-1.5"><Target className="h-3 w-3 text-blue-500" />Influencers</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={seniorityFilter} onValueChange={(v) => setSeniorityFilter(v as SeniorityFilter)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seniority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seniority</SelectItem>
                  <SelectItem value="founder">Founder/Owner</SelectItem>
                  <SelectItem value="c_level">C-Level</SelectItem>
                  <SelectItem value="vp">VP</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>

              <Select value={companySizeFilter} onValueChange={(v) => setCompanySizeFilter(v as CompanySizeFilter)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Company Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="startup">Startup (1-50)</SelectItem>
                  <SelectItem value="smb">SMB (51-200)</SelectItem>
                  <SelectItem value="mid_market">Mid-Market (201-1K)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1K+)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={minRelevanceScore || ''}
                  onChange={(e) => setMinRelevanceScore(parseInt(e.target.value) || 0)}
                  className="h-9"
                  placeholder="Min score"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="include-non-relevant"
                checked={includeNonRelevant}
                onCheckedChange={(checked) => setIncludeNonRelevant(checked === true)}
              />
              <Label htmlFor="include-non-relevant" className="text-sm font-normal cursor-pointer">
                Include non-relevant leads
              </Label>
            </div>
          </div>

          <Separator />

          {/* Export Preview - Compact */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Export Preview
              </span>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs gap-1">
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{exportDescription.text}</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                ~{exportDescription.estimatedRows} rows
              </Badge>
              <Badge variant="outline" className="text-xs">
                {exportDescription.companiesIncluded} companies
              </Badge>
            </div>
          </div>
        </div>

        {/* Footer - Always visible */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="flex-1 gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

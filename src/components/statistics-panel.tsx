'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  DollarSign,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Target,
  Sparkles,
  Activity,
} from 'lucide-react';

interface RankingRun {
  id: string;
  status: string;
  totalLeads: number;
  processedLeads: number;
  relevantLeads: number;
  totalCost: number;
  totalTokens: number;
  createdAt: string;
  completedAt: string | null;
}

interface RankingProgress {
  status: string;
  totalLeads: number;
  processedLeads: number;
  relevantLeads: number;
  totalCost: number;
  totalTokens: number;
  progress: number;
}

interface StatisticsPanelProps {
  currentRun?: RankingRun | null;
  progress?: RankingProgress | null;
  companyStats?: Array<{
    companySizeCategory: string | null;
    _count: { id: number };
    _avg: { relevanceScore: number | null };
  }>;
}

export function StatisticsPanel({ currentRun, progress, companyStats }: StatisticsPanelProps) {
  const stats = progress || (currentRun ? {
    totalLeads: currentRun.totalLeads,
    processedLeads: currentRun.processedLeads,
    relevantLeads: currentRun.relevantLeads,
    totalCost: currentRun.totalCost,
    totalTokens: currentRun.totalTokens,
    progress: currentRun.totalLeads > 0
      ? (currentRun.processedLeads / currentRun.totalLeads) * 100
      : 0,
    status: currentRun.status,
  } : null);

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
          <Activity className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Active Run</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Start a new ranking run to see real-time statistics and progress
        </p>
      </div>
    );
  }

  const relevanceRate = stats.totalLeads > 0
    ? ((stats.relevantLeads / stats.totalLeads) * 100).toFixed(1)
    : '0';

  const costPerLead = stats.processedLeads > 0
    ? (stats.totalCost / stats.processedLeads).toFixed(6)
    : '0';

  const isProcessing = stats.status === 'processing';

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      {isProcessing && (
        <div className="relative p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/20 to-transparent animate-shimmer" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    AI Analysis in Progress
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Processing leads with GPT-4o-mini</p>
                </div>
              </div>
              <Badge className="gradient-primary text-white font-mono">
                {stats.progress.toFixed(0)}%
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full progress-gradient rounded-full transition-all duration-500"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats.processedLeads} of {stats.totalLeads} leads
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.ceil((stats.totalLeads - stats.processedLeads) * 0.5)}s remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Leads */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 border overflow-hidden group hover:border-primary/30 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {stats.processedLeads} done
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-3xl font-bold">{stats.totalLeads.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Relevant Leads */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 overflow-hidden group hover:border-green-500/40 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                {relevanceRate}%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Relevant Leads</p>
              <p className="text-3xl font-bold text-green-600">{stats.relevantLeads.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Total Cost */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-mono">
                ${costPerLead}/lead
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-3xl font-bold text-amber-600">${stats.totalCost.toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Tokens Used */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-mono">
                {stats.processedLeads > 0 ? Math.round(stats.totalTokens / stats.processedLeads) : 0}/lead
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tokens Used</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalTokens > 1000 ? `${(stats.totalTokens / 1000).toFixed(1)}k` : stats.totalTokens}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Relevance Breakdown */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-secondary/30 to-transparent border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Relevance Breakdown</h3>
              <p className="text-sm text-muted-foreground">Lead qualification distribution</p>
            </div>
          </div>
          {stats.status === 'completed' && (
            <Badge className="gradient-success text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Analysis Complete
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Relevant */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Relevant Leads</span>
              </div>
              <span className="text-sm font-bold text-green-600">{stats.relevantLeads}</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalLeads > 0 ? (stats.relevantLeads / stats.totalLeads) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Qualified as potential buyers or influencers
            </p>
          </div>

          {/* Not Relevant */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm font-medium">Not Relevant</span>
              </div>
              <span className="text-sm font-bold text-slate-500">{stats.processedLeads - stats.relevantLeads}</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-slate-400 to-slate-300 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalLeads > 0 ? ((stats.processedLeads - stats.relevantLeads) / stats.totalLeads) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Filtered out based on persona criteria
            </p>
          </div>
        </div>

        {/* Quick Insights */}
        {stats.processedLeads > 0 && (
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{relevanceRate}%</p>
              <p className="text-xs text-muted-foreground">Relevance Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.processedLeads > 0 ? Math.round(stats.totalTokens / stats.processedLeads) : 0}</p>
              <p className="text-xs text-muted-foreground">Avg Tokens/Lead</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${(stats.totalCost * 1000).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Cost per 1k Leads</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserCheck,
  DollarSign,
  Zap,
  TrendingUp,
  Building2,
  Clock,
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
  // Use progress data if available, otherwise fall back to currentRun
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">No ranking run selected</p>
          </CardContent>
        </Card>
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
    <div className="space-y-4">
      {/* Progress bar when processing */}
      {isProcessing && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" />
              Ranking in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {stats.processedLeads} of {stats.totalLeads} leads processed ({stats.progress.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.processedLeads} processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relevant Leads</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.relevantLeads}</div>
            <p className="text-xs text-muted-foreground">
              {relevanceRate}% relevance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              ${costPerLead} per lead
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTokens > 1000 ? `${(stats.totalTokens / 1000).toFixed(1)}k` : stats.totalTokens}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.processedLeads > 0 ? Math.round(stats.totalTokens / stats.processedLeads) : 0} per lead
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company size breakdown */}
      {companyStats && companyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Size Breakdown
            </CardTitle>
            <CardDescription>Distribution by company size category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {companyStats.map((stat) => (
                <div key={stat.companySizeCategory || 'unknown'} className="text-center">
                  <div className="text-lg font-semibold">{stat._count.id}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {stat.companySizeCategory?.replace('_', ' ') || 'Unknown'}
                  </div>
                  {stat._avg.relevanceScore !== null && (
                    <div className="text-xs text-muted-foreground">
                      Avg: {stat._avg.relevanceScore.toFixed(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relevance distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Relevance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Relevant</span>
              <span className="font-medium">{stats.relevantLeads}</span>
            </div>
            <Progress
              value={stats.totalLeads > 0 ? (stats.relevantLeads / stats.totalLeads) * 100 : 0}
              className="h-2"
            />
            <div className="flex items-center justify-between text-sm">
              <span>Not Relevant</span>
              <span className="font-medium">{stats.processedLeads - stats.relevantLeads}</span>
            </div>
            <Progress
              value={stats.totalLeads > 0 ? ((stats.processedLeads - stats.relevantLeads) / stats.totalLeads) * 100 : 0}
              className="h-2 [&>div]:bg-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

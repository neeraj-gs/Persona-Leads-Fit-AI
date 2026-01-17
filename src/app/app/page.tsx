'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import { CSVUpload } from '@/components/csv-upload';
import { LeadsTable } from '@/components/leads-table';
import { RankingControls } from '@/components/ranking-controls';
import { StatisticsPanel } from '@/components/statistics-panel';
import { ABTestPanel } from '@/components/ab-test-panel';
import { OrgChart } from '@/components/org-chart';
import { useLeads } from '@/hooks/use-leads';
import { useRankings } from '@/hooks/use-rankings';
import {
  Database,
  BarChart3,
  FlaskConical,
  Network,
  Sparkles,
  Upload,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  ChevronRight,
  Activity,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export default function AppPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('upload');

  const {
    leads,
    isLoading: leadsLoading,
    fetchLeads,
    uploadLeads,
  } = useLeads();

  const {
    runs,
    currentRun,
    results,
    progress,
    isRanking,
    fetchRuns,
    fetchRunResults,
    startRanking,
    subscribeToProgress,
    deleteRun,
    exportResults,
  } = useRankings();

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
    try {
      await fetch('/api/prompts', { method: 'PUT' });
      const response = await fetch('/api/prompts');
      const data = await response.json();
      if (data.success) {
        setPrompts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchRuns();
    fetchPrompts();
  }, [fetchLeads, fetchRuns, fetchPrompts]);

  const handleUploadComplete = useCallback((batchId: string, totalLeads: number) => {
    toast.success(`Successfully uploaded ${totalLeads} leads`, {
      description: 'Your leads are ready for AI ranking',
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    });
    fetchLeads();
    setActiveTab('ranking');
  }, [fetchLeads]);

  const handleStartRanking = useCallback(async (params: { name?: string; promptId?: string }) => {
    const runId = await startRanking(params);
    if (runId) {
      toast.success('AI Ranking Started', {
        description: 'Processing your leads with AI analysis',
        icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      });
      subscribeToProgress(runId);
      setSelectedRunId(runId);
      setActiveTab('results');
    } else {
      toast.error('Failed to start ranking');
    }
    return runId;
  }, [startRanking, subscribeToProgress]);

  const handleSelectRun = useCallback((runId: string) => {
    setSelectedRunId(runId);
    fetchRunResults(runId);
    setActiveTab('results');
  }, [fetchRunResults]);

  const handleDeleteRun = useCallback(async (runId: string) => {
    const success = await deleteRun(runId);
    if (success) {
      toast.success('Ranking run deleted');
      if (selectedRunId === runId) {
        setSelectedRunId(undefined);
      }
    } else {
      toast.error('Failed to delete ranking run');
    }
    return success;
  }, [deleteRun, selectedRunId]);

  useEffect(() => {
    if (progress === null && selectedRunId && !isRanking) {
      fetchRunResults(selectedRunId);
      fetchRuns();
    }
  }, [progress, selectedRunId, isRanking, fetchRunResults, fetchRuns]);

  // Calculate stats
  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const totalLeadsProcessed = runs.reduce((sum, r) => sum + r.processedLeads, 0);
  const totalCost = runs.reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {/* Background Decoration */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-chart-2/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg glow-primary">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Persona Ranker
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-primary" />
                    AI-Powered Lead Intelligence
                  </p>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Leads</p>
                  <p className="font-semibold">{leads.length.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
                <Activity className="h-4 w-4 text-chart-2" />
                <div>
                  <p className="text-xs text-muted-foreground">Runs</p>
                  <p className="font-semibold">{completedRuns}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
                <DollarSign className="h-4 w-4 text-chart-3" />
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="font-semibold">${totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab Navigation */}
          <div className="flex items-center justify-center">
            <TabsList className="glass-card p-1.5 h-auto">
              <TabsTrigger
                value="upload"
                className="flex items-center gap-2 px-6 py-3 text-foreground data-[state=active]:bg-secondary data-[state=active]:font-semibold rounded-lg transition-all"
              >
                <Upload className="h-4 w-4" />
                <span className="font-medium">Upload</span>
              </TabsTrigger>
              <TabsTrigger
                value="ranking"
                className="flex items-center gap-2 px-6 py-3 text-foreground data-[state=active]:bg-secondary data-[state=active]:font-semibold rounded-lg transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Ranking</span>
                {isRanking && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="flex items-center gap-2 px-6 py-3 text-foreground data-[state=active]:bg-secondary data-[state=active]:font-semibold rounded-lg transition-all"
              >
                <Target className="h-4 w-4" />
                <span className="font-medium">Results</span>
                {results.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-primary/10 text-foreground">
                    {results.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="flex items-center gap-2 px-6 py-3 text-foreground data-[state=active]:bg-secondary data-[state=active]:font-semibold rounded-lg transition-all"
              >
                <FlaskConical className="h-4 w-4" />
                <span className="font-medium">Advanced</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
              <Badge className="badge-gradient px-4 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered Analysis
              </Badge>
              <h2 className="text-4xl font-bold tracking-tight">
                Upload Your Leads
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Transform your raw lead data into actionable insights with our AI ranking system.
                Upload a CSV file to get started.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              {/* Upload Card */}
              <div className="lg:col-span-3">
                <Card className="glass-card card-elevated overflow-hidden">
                  <CardHeader className="border-b bg-gradient-to-r from-secondary/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-primary">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Upload Leads CSV</CardTitle>
                        <CardDescription>
                          Drag and drop or click to browse your files
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <CSVUpload
                      onUpload={uploadLeads}
                      onUploadComplete={handleUploadComplete}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Info Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Data Card */}
                <Card className="glass-card card-elevated stat-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Database className="h-4 w-4 text-primary" />
                      Current Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leads.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Total Leads</span>
                          </div>
                          <span className="text-2xl font-bold text-primary">
                            {leads.length.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Companies</span>
                          </div>
                          <span className="text-2xl font-bold text-chart-2">
                            {new Set(leads.map(l => l.accountName)).size}
                          </span>
                        </div>
                        <Button
                          onClick={() => setActiveTab('ranking')}
                          className="w-full gradient-primary text-white hover:opacity-90"
                        >
                          Start Ranking
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                          <Database className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No leads uploaded yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload a CSV to get started
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Instructions Card */}
                <Card className="glass-card card-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-4 w-4 text-chart-4" />
                      Quick Start Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { step: '1', text: 'Upload CSV with lead data', icon: Upload },
                        { step: '2', text: 'Configure and start AI ranking', icon: BarChart3 },
                        { step: '3', text: 'View results and export', icon: Target },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                            {item.step}
                          </div>
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-8 animate-fade-in">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card className="glass-card card-elevated sticky top-24">
                  <CardHeader className="border-b bg-gradient-to-r from-secondary/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-primary">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Ranking Controls</CardTitle>
                        <CardDescription>
                          Configure and start AI analysis
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RankingControls
                      prompts={prompts}
                      runs={runs}
                      isRanking={isRanking}
                      onStartRanking={handleStartRanking}
                      onSelectRun={handleSelectRun}
                      onDeleteRun={handleDeleteRun}
                      onExport={exportResults}
                      selectedRunId={selectedRunId}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card className="glass-card card-elevated">
                  <CardHeader className="border-b bg-gradient-to-r from-secondary/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-secondary">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Statistics</CardTitle>
                        <CardDescription>
                          Real-time ranking progress and metrics
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <StatisticsPanel
                      currentRun={currentRun}
                      progress={progress}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-8 animate-fade-in">
            {selectedRunId ? (
              <>
                <Card className="glass-card card-elevated">
                  <CardHeader className="border-b bg-gradient-to-r from-secondary/50 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg gradient-success">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle>Run Statistics</CardTitle>
                          <CardDescription>
                            {currentRun?.name || `Run ${selectedRunId.slice(0, 8)}`}
                          </CardDescription>
                        </div>
                      </div>
                      {currentRun?.status === 'completed' && (
                        <Badge className="gradient-success text-white">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {currentRun?.status === 'running' && (
                        <Badge className="gradient-warning text-white animate-pulse">
                          <Clock className="h-3 w-3 mr-1" />
                          Running
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <StatisticsPanel
                      currentRun={currentRun}
                      progress={progress}
                    />
                  </CardContent>
                </Card>

                <Card className="glass-card card-elevated">
                  <CardHeader className="border-b bg-gradient-to-r from-secondary/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-primary">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Ranked Leads</CardTitle>
                        <CardDescription>
                          {results.length} leads analyzed and ranked
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <LeadsTable
                      data={results}
                      isLoading={leadsLoading}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-card card-elevated">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
                      <Target className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Results Selected</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Start a new ranking analysis or select a previous run from the Ranking tab to view results.
                    </p>
                    <Button
                      onClick={() => setActiveTab('ranking')}
                      className="gradient-primary text-white"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Go to Ranking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-8 animate-fade-in">
            <Tabs defaultValue="ab-testing" className="w-full">
              <div className="flex items-center justify-center mb-8">
                <TabsList className="glass-card p-1.5 h-auto">
                  <TabsTrigger
                    value="ab-testing"
                    className="flex items-center gap-2 px-6 py-3 text-foreground data-[state=active]:bg-secondary data-[state=active]:font-semibold rounded-lg transition-all"
                  >
                    <FlaskConical className="h-4 w-4" />
                    <span className="font-medium">A/B Testing</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="visualization"
                    className="flex items-center gap-2 px-6 py-3 text-foreground data-[state=active]:bg-secondary data-[state=active]:font-semibold rounded-lg transition-all"
                  >
                    <Network className="h-4 w-4" />
                    <span className="font-medium">Multi-threading</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="ab-testing">
                <Card className="glass-card card-elevated">
                  <CardHeader className="border-b bg-gradient-to-r from-secondary/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-primary">
                        <FlaskConical className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>A/B Prompt Testing</CardTitle>
                        <CardDescription>
                          Compare different prompts to optimize accuracy and cost
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ABTestPanel />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualization">
                <Card className="glass-card card-elevated">
                  <CardHeader className="border-b bg-gradient-to-r from-secondary/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg gradient-secondary">
                        <Network className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Multi-threading Visualization</CardTitle>
                        <CardDescription>
                          Visualize contact hierarchy and engagement strategy
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <OrgChart results={results} runId={selectedRunId} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative border-t bg-background/80 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Persona Ranker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Throxy Technical Challenge - AI-Powered Lead Intelligence Platform
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Built with Next.js</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>OpenAI GPT-4o-mini</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

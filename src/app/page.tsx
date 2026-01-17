'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from 'sonner';
import { CSVUpload } from '@/components/csv-upload';
import { LeadsTable } from '@/components/leads-table';
import { RankingControls } from '@/components/ranking-controls';
import { StatisticsPanel } from '@/components/statistics-panel';
import { useLeads } from '@/hooks/use-leads';
import { useRankings } from '@/hooks/use-rankings';
import { Database, BarChart3, FlaskConical, Network } from 'lucide-react';

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export default function Home() {
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
      // First, seed default prompts if needed
      await fetch('/api/prompts', { method: 'PUT' });

      // Then fetch all prompts
      const response = await fetch('/api/prompts');
      const data = await response.json();
      if (data.success) {
        setPrompts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchLeads();
    fetchRuns();
    fetchPrompts();
  }, [fetchLeads, fetchRuns, fetchPrompts]);

  // Handle upload complete
  const handleUploadComplete = useCallback((batchId: string, totalLeads: number) => {
    toast.success(`Successfully uploaded ${totalLeads} leads`);
    fetchLeads();
    setActiveTab('ranking');
  }, [fetchLeads]);

  // Handle start ranking
  const handleStartRanking = useCallback(async (params: { name?: string; promptId?: string }) => {
    const runId = await startRanking(params);
    if (runId) {
      toast.success('Ranking started');
      subscribeToProgress(runId);
      setSelectedRunId(runId);
      setActiveTab('results');
    } else {
      toast.error('Failed to start ranking');
    }
    return runId;
  }, [startRanking, subscribeToProgress]);

  // Handle select run
  const handleSelectRun = useCallback((runId: string) => {
    setSelectedRunId(runId);
    fetchRunResults(runId);
    setActiveTab('results');
  }, [fetchRunResults]);

  // Handle delete run
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

  // Fetch results when run completes
  useEffect(() => {
    if (progress === null && selectedRunId && !isRanking) {
      fetchRunResults(selectedRunId);
      fetchRuns();
    }
  }, [progress, selectedRunId, isRanking, fetchRunResults, fetchRuns]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Throxy Persona Ranker</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered lead qualification and ranking system
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>{leads.length > 0 ? `${leads.length} leads loaded` : 'No leads loaded'}</div>
              <div>{runs.length} ranking runs</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CSVUpload
                onUpload={uploadLeads}
                onUploadComplete={handleUploadComplete}
              />
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Current Data</h3>
                  {leads.length > 0 ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Total Leads:</strong> {leads.length}</p>
                      <p><strong>Companies:</strong> {new Set(leads.map(l => l.accountName)).size}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No leads uploaded yet</p>
                  )}
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Upload a CSV file with lead data</li>
                    <li>Go to the Ranking tab to configure and start</li>
                    <li>View results and export ranked leads</li>
                  </ol>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
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
              </div>
              <div className="lg:col-span-2">
                <StatisticsPanel
                  currentRun={currentRun}
                  progress={progress}
                />
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {selectedRunId ? (
              <>
                <StatisticsPanel
                  currentRun={currentRun}
                  progress={progress}
                />
                <LeadsTable
                  data={results}
                  isLoading={leadsLoading}
                />
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No ranking run selected</p>
                <p className="text-sm mt-2">
                  Start a new ranking or select one from the history
                </p>
              </div>
            )}
          </TabsContent>

          {/* Advanced Tab (A/B Testing & Multi-threading) */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  A/B Prompt Testing
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Compare different prompts to find the most accurate and cost-effective approach.
                </p>
                <p className="text-xs text-muted-foreground">
                  Coming soon: Run the same leads through different prompts and compare results.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Multi-threading Visualization
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize organizational relationships and identify champion paths.
                </p>
                <p className="text-xs text-muted-foreground">
                  Coming soon: Interactive org chart showing recommended contact sequences.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Throxy Persona Ranker - Technical Challenge Submission
        </div>
      </footer>
    </div>
  );
}

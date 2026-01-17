'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Play,
  Download,
  Trash2,
  Settings,
  Loader2,
  History,
} from 'lucide-react';

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface RankingRun {
  id: string;
  name: string | null;
  status: string;
  totalLeads: number;
  relevantLeads: number;
  totalCost: number;
  createdAt: string;
}

interface RankingControlsProps {
  prompts: Prompt[];
  runs: RankingRun[];
  isRanking: boolean;
  onStartRanking: (params: { name?: string; promptId?: string }) => Promise<string | null>;
  onSelectRun: (runId: string) => void;
  onDeleteRun: (runId: string) => Promise<boolean>;
  onExport: (runId: string, topN?: number) => void;
  selectedRunId?: string;
}

export function RankingControls({
  prompts,
  runs,
  isRanking,
  onStartRanking,
  onSelectRun,
  onDeleteRun,
  onExport,
  selectedRunId,
}: RankingControlsProps) {
  const [runName, setRunName] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [exportTopN, setExportTopN] = useState<string>('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const handleStartRanking = async () => {
    const runId = await onStartRanking({
      name: runName || undefined,
      promptId: selectedPromptId || undefined,
    });
    if (runId) {
      setRunName('');
    }
  };

  const handleExport = () => {
    if (selectedRunId) {
      const topN = exportTopN ? parseInt(exportTopN) : undefined;
      onExport(selectedRunId, topN);
      setShowExportDialog(false);
    }
  };

  const defaultPrompt = prompts.find(p => p.isDefault);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ranking Controls
        </CardTitle>
        <CardDescription>
          Configure and start the AI ranking process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run Name */}
        <div className="space-y-2">
          <Label htmlFor="run-name">Run Name (optional)</Label>
          <Input
            id="run-name"
            placeholder="e.g., Q1 Manufacturing Campaign"
            value={runName}
            onChange={(e) => setRunName(e.target.value)}
            disabled={isRanking}
          />
        </div>

        {/* Prompt Selection */}
        <div className="space-y-2">
          <Label htmlFor="prompt">AI Prompt</Label>
          <Select
            value={selectedPromptId}
            onValueChange={setSelectedPromptId}
            disabled={isRanking || prompts.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={defaultPrompt ? `${defaultPrompt.name} (default)` : 'Select a prompt'} />
            </SelectTrigger>
            <SelectContent>
              {prompts.map((prompt) => (
                <SelectItem key={prompt.id} value={prompt.id}>
                  {prompt.name} {prompt.isDefault && '(default)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {prompts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No prompts available. Using default prompt.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={handleStartRanking}
            disabled={isRanking}
            className="flex-1"
          >
            {isRanking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ranking...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Ranking
              </>
            )}
          </Button>

          {/* Export Dialog */}
          <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!selectedRunId}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Ranked Leads</DialogTitle>
                <DialogDescription>
                  Export the ranking results to a CSV file
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="top-n">Top N per Company (optional)</Label>
                  <Input
                    id="top-n"
                    type="number"
                    min="1"
                    placeholder="e.g., 3 (leave empty for all)"
                    value={exportTopN}
                    onChange={(e) => setExportTopN(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only export the top N ranked leads per company. Leave empty to export all.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* History Dialog */}
          <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ranking History</DialogTitle>
                <DialogDescription>
                  View and manage previous ranking runs
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {runs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No ranking runs yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <div
                        key={run.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          selectedRunId === run.id ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {run.name || `Run ${run.id.slice(0, 8)}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(run.createdAt).toLocaleString()} •{' '}
                            {run.totalLeads} leads •{' '}
                            {run.relevantLeads} relevant •{' '}
                            ${run.totalCost.toFixed(4)}
                          </div>
                          <div className="text-xs">
                            Status:{' '}
                            <span className={
                              run.status === 'completed' ? 'text-green-600' :
                              run.status === 'failed' ? 'text-red-600' :
                              run.status === 'processing' ? 'text-blue-600' :
                              'text-muted-foreground'
                            }>
                              {run.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onSelectRun(run.id);
                              setShowHistoryDialog(false);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRun(run.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

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
  Play,
  Settings,
  Loader2,
} from 'lucide-react';
import { ExportDialog } from '@/components/export-dialog';

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
  selectedRunId?: string;
  totalCompanies?: number;
}

export function RankingControls({
  prompts,
  runs,
  isRanking,
  onStartRanking,
  onSelectRun,
  onDeleteRun,
  selectedRunId,
  totalCompanies = 0,
}: RankingControlsProps) {
  const [runName, setRunName] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');

  const handleStartRanking = async () => {
    const runId = await onStartRanking({
      name: runName || undefined,
      promptId: selectedPromptId || undefined,
    });
    if (runId) {
      setRunName('');
    }
  };

  const defaultPrompt = prompts.find(p => p.isDefault);
  const selectedRun = runs.find(r => r.id === selectedRunId);

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
          {selectedRunId && selectedRun && (
            <ExportDialog
              runId={selectedRunId}
              totalLeads={selectedRun.totalLeads}
              relevantLeads={selectedRun.relevantLeads}
              totalCompanies={totalCompanies}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

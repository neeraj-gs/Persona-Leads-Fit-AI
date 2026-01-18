'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PromptManager } from './prompt-manager';
import {
  Play,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Zap,
  Brain,
} from 'lucide-react';

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  isDefault: boolean;
  totalRuns: number;
  avgAccuracy: number | null;
  avgCost: number | null;
}

interface ABTestProgress {
  status: string;
  current: number;
  total: number;
  phase: string;
  details?: string;
  result?: unknown;
  error?: string;
}

interface ABTest {
  id: string;
  name: string;
  status: string;
  sampleSize: number;
  promptAId: string;
  promptBId: string;
  promptAAccuracy: number | null;
  promptBAccuracy: number | null;
  promptACost: number | null;
  promptBCost: number | null;
  winner: string | null;
  createdAt: string;
  completedAt: string | null;
  promptA: Prompt;
  promptB: Prompt;
  progress?: ABTestProgress | null;
}

interface EvaluationData {
  id?: string;
  name: string;
  title?: string;
  company: string;
  employeeRange?: string;
  rank?: number | string;
}

export function ABTestPanel() {
  const [activeTab, setActiveTab] = useState('setup');
  const [selectedPromptA, setSelectedPromptA] = useState<Prompt | null>(null);
  const [selectedPromptB, setSelectedPromptB] = useState<Prompt | null>(null);
  const [selectingFor, setSelectingFor] = useState<'A' | 'B' | null>(null);
  const [testName, setTestName] = useState('');
  const [evaluationData, setEvaluationData] = useState<EvaluationData[]>([]);
  const [evaluationFile, setEvaluationFile] = useState<File | null>(null);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [runningTestProgress, setRunningTestProgress] = useState<ABTestProgress | null>(null);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  // Auto Optimization state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationId, setOptimizationId] = useState<string | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState<{
    current: number;
    total: number;
    score: number;
    phase?: string;
    details?: string;
  } | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<{
    bestScore: number;
    improvement: number;
    iterations: number;
    savedPromptId?: string;
  } | null>(null);

  // Sampling state
  const [useSampling, setUseSampling] = useState(true);
  const [sampleSize, setSampleSize] = useState(50);

  /**
   * Stratified sampling - maintains distribution of relevant vs non-relevant leads
   */
  const sampleEvaluationData = useCallback((data: EvaluationData[], size: number): EvaluationData[] => {
    if (data.length <= size) return data;

    // Separate relevant and non-relevant leads
    const relevant = data.filter(d => d.rank && d.rank !== '-' && d.rank !== '');
    const nonRelevant = data.filter(d => !d.rank || d.rank === '-' || d.rank === '');

    // Calculate proportional sample sizes
    const relevantRatio = relevant.length / data.length;
    const relevantSampleSize = Math.round(size * relevantRatio);
    const nonRelevantSampleSize = size - relevantSampleSize;

    // Shuffle and sample
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const sampledRelevant = shuffleArray(relevant).slice(0, Math.min(relevantSampleSize, relevant.length));
    const sampledNonRelevant = shuffleArray(nonRelevant).slice(0, Math.min(nonRelevantSampleSize, nonRelevant.length));

    // Combine and shuffle final sample
    return shuffleArray([...sampledRelevant, ...sampledNonRelevant]);
  }, []);

  // Get the effective evaluation data (sampled or full)
  const getEffectiveEvaluationData = useCallback(() => {
    if (!useSampling || evaluationData.length <= sampleSize) {
      return evaluationData;
    }
    return sampleEvaluationData(evaluationData, sampleSize);
  }, [evaluationData, useSampling, sampleSize, sampleEvaluationData]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/ab-tests');
      const data = await response.json();
      if (data.success) {
        setTests(data.data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const handlePromptSelect = (prompt: Prompt) => {
    if (selectingFor === 'A') {
      setSelectedPromptA(prompt);
    } else if (selectingFor === 'B') {
      setSelectedPromptB(prompt);
    }
    setSelectingFor(null);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setEvaluationFile(file);
    const text = await file.text();

    // Parse CSV properly (handle quoted values with commas)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const lines = text.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      alert('CSV file must have headers and at least one data row');
      return;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));

    // More flexible column detection
    const nameIdx = headers.findIndex(h =>
      h === 'name' || h === 'full name' || h === 'fullname' || h.includes('full') && h.includes('name')
    );
    const companyIdx = headers.findIndex(h =>
      h === 'company' || h === 'company name' || h === 'companyname' || h === 'account'
    );
    const titleIdx = headers.findIndex(h =>
      h === 'title' || h === 'job title' || h === 'jobtitle' || h === 'position'
    );
    const employeeIdx = headers.findIndex(h =>
      h.includes('employee') || h.includes('size') || h.includes('range')
    );
    const rankIdx = headers.findIndex(h =>
      h === 'rank' || h === 'expected rank' || h === 'expectedrank' || h === 'expected_rank'
    );

    console.log('CSV Headers:', headers);
    console.log('Column indices:', { nameIdx, companyIdx, titleIdx, employeeIdx, rankIdx });

    if (nameIdx === -1 || companyIdx === -1) {
      alert(`CSV must have "name/full name" and "company" columns. Found headers: ${headers.join(', ')}`);
      return;
    }

    const data: EvaluationData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^["']|["']$/g, ''));
      if (values.length < Math.max(nameIdx, companyIdx) + 1) continue;
      if (!values[nameIdx] || !values[companyIdx]) continue; // Skip empty rows

      const rankValue = rankIdx !== -1 ? values[rankIdx] : undefined;

      data.push({
        id: `eval-${i}`,
        name: values[nameIdx],
        company: values[companyIdx],
        title: titleIdx !== -1 ? values[titleIdx] || undefined : undefined,
        employeeRange: employeeIdx !== -1 ? values[employeeIdx] || undefined : undefined,
        // Handle rank: "-" or empty means not relevant (null), numbers are ranks
        rank: rankValue === '-' || rankValue === '' || !rankValue ? '-' : rankValue,
      });
    }

    console.log('Parsed evaluation data:', data.length, 'leads');
    setEvaluationData(data);
  }, []);

  const startTest = async () => {
    if (!selectedPromptA || !selectedPromptB || evaluationData.length === 0) {
      alert('Please select two prompts and upload evaluation data');
      return;
    }

    // Get sampled or full evaluation data
    const effectiveData = getEffectiveEvaluationData();
    const sampleInfo = useSampling && evaluationData.length > sampleSize
      ? ` (${effectiveData.length} sampled from ${evaluationData.length})`
      : '';

    setRunningTest(true);
    setRunningTestProgress({
      status: 'running',
      current: 0,
      total: effectiveData.length * 2,
      phase: 'Starting A/B Test...',
    });

    try {
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptAId: selectedPromptA.id,
          promptBId: selectedPromptB.id,
          evaluationData: effectiveData,
          name: testName || `${selectedPromptA.name} vs ${selectedPromptB.name}${sampleInfo}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRunningTestId(data.data.testId);
        fetchTests();
        // Poll for completion with progress
        pollTestStatus(data.data.testId);
      } else {
        alert(data.error || 'Failed to start test');
        setRunningTest(false);
        setRunningTestProgress(null);
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test');
      setRunningTest(false);
      setRunningTestProgress(null);
    }
  };

  const pollTestStatus = async (testId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/ab-tests/${testId}`);
        const data = await response.json();
        if (data.success) {
          setTests(prev => prev.map(t => (t.id === testId ? data.data : t)));

          // Update progress if available
          if (data.data.progress) {
            setRunningTestProgress(data.data.progress);
          }

          if (data.data.status === 'running') {
            setTimeout(poll, 1000); // Poll faster for smoother progress
          } else {
            // Test completed or failed
            setRunningTest(false);
            setRunningTestId(null);
            setRunningTestProgress(null);
            fetchTests(); // Refresh the list
          }
        }
      } catch (error) {
        console.error('Error polling test status:', error);
      }
    };
    poll();
  };

  // Auto Optimization
  const startOptimization = async () => {
    if (evaluationData.length === 0) {
      alert('Please upload evaluation data first');
      return;
    }

    // Get sampled or full evaluation data
    const effectiveData = getEffectiveEvaluationData();

    setOptimizing(true);
    setOptimizationProgress({
      current: 0,
      total: 5,
      score: 0,
      phase: 'Initializing...',
      details: `Preparing baseline evaluation with ${effectiveData.length} leads`
    });
    setOptimizationResult(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationData: effectiveData,
          maxIterations: 5,
          targetScore: 85,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOptimizationId(data.data.optimizationId);
        pollOptimizationStatus(data.data.optimizationId);
      } else {
        alert(data.error || 'Failed to start optimization');
        setOptimizing(false);
      }
    } catch (error) {
      console.error('Error starting optimization:', error);
      alert('Failed to start optimization');
      setOptimizing(false);
    }
  };

  const pollOptimizationStatus = async (optId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/optimize?id=${optId}`);
        const data = await response.json();

        if (data.success) {
          // Update progress with phase and details
          setOptimizationProgress({
            current: data.data.progress.current,
            total: data.data.progress.total,
            score: data.data.progress.score,
            phase: data.data.progress.phase,
            details: data.data.progress.details,
          });

          if (data.data.status === 'completed' && data.data.result) {
            setOptimizationResult({
              bestScore: data.data.result.bestPrompt.score,
              improvement: data.data.result.improvement,
              iterations: data.data.result.totalIterations,
              savedPromptId: data.data.result.bestPrompt.savedPromptId,
            });
            setOptimizing(false);
          } else if (data.data.status === 'failed') {
            alert('Optimization failed: ' + (data.data.error || 'Unknown error'));
            setOptimizing(false);
          } else if (data.data.status === 'running') {
            setTimeout(poll, 1000); // Poll faster for smoother updates
          }
        }
      } catch (error) {
        console.error('Error polling optimization status:', error);
      }
    };
    poll();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getWinnerDisplay = (test: ABTest) => {
    if (test.status !== 'completed' || !test.winner) {
      return <Badge variant="secondary">Pending</Badge>;
    }

    switch (test.winner) {
      case 'prompt_a':
        return (
          <Badge variant="default" className="bg-green-500">
            <Trophy className="h-3 w-3 mr-1" />
            Prompt A
          </Badge>
        );
      case 'prompt_b':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Trophy className="h-3 w-3 mr-1" />
            Prompt B
          </Badge>
        );
      case 'tie':
        return (
          <Badge variant="secondary">
            <Minus className="h-3 w-3 mr-1" />
            Tie
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">A/B Test</TabsTrigger>
          <TabsTrigger value="optimize" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Auto Optimize
          </TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {/* Prompt Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prompt A */}
            <Card className={selectingFor === 'A' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline">A</Badge>
                  Prompt A
                </CardTitle>
                <CardDescription>Select the first prompt to test</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPromptA ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedPromptA.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectingFor('A')}
                      >
                        Change
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedPromptA.description || selectedPromptA.systemPrompt.slice(0, 100)}...
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectingFor('A')}
                  >
                    Select Prompt A
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Prompt B */}
            <Card className={selectingFor === 'B' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline">B</Badge>
                  Prompt B
                </CardTitle>
                <CardDescription>Select the second prompt to test</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPromptB ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedPromptB.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectingFor('B')}
                      >
                        Change
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedPromptB.description || selectedPromptB.systemPrompt.slice(0, 100)}...
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectingFor('B')}
                  >
                    Select Prompt B
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prompt Selection Panel */}
          {selectingFor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Select Prompt {selectingFor}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PromptManager
                  onPromptSelect={handlePromptSelect}
                  selectedPromptIds={[
                    ...(selectedPromptA ? [selectedPromptA.id] : []),
                    ...(selectedPromptB ? [selectedPromptB.id] : []),
                  ]}
                />
              </CardContent>
            </Card>
          )}

          {/* Evaluation Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Evaluation Data
              </CardTitle>
              <CardDescription>
                Upload a CSV with ground truth rankings to evaluate prompt accuracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eval-file">Evaluation CSV</Label>
                <Input
                  id="eval-file"
                  type="file"
                  accept=".csv"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <p className="text-xs text-muted-foreground">
                  CSV should have columns: name, company, title (optional), employeeRange (optional), rank (expected rank or &quot;-&quot; for not relevant)
                </p>
              </div>

              {evaluationData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {evaluationData.length} leads loaded
                    </span>
                    <Badge variant="secondary">
                      {evaluationFile?.name}
                    </Badge>
                  </div>
                  <div className="max-h-40 overflow-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Expected Rank</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluationData.slice(0, 5).map((lead, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{lead.name}</TableCell>
                            <TableCell>{lead.company}</TableCell>
                            <TableCell>{lead.title || '-'}</TableCell>
                            <TableCell>{lead.rank || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {evaluationData.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              ... and {evaluationData.length - 5} more
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Sampling Controls */}
                  {evaluationData.length > 50 && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="use-sampling" className="text-sm font-medium">
                            Use Random Sample
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Faster testing with a representative subset
                          </p>
                        </div>
                        <Switch
                          id="use-sampling"
                          checked={useSampling}
                          onCheckedChange={setUseSampling}
                        />
                      </div>

                      {useSampling && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sample-size" className="text-sm">
                              Sample Size
                            </Label>
                            <span className="text-sm font-medium">
                              {sampleSize} leads
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              id="sample-size"
                              min={20}
                              max={Math.min(200, evaluationData.length)}
                              step={10}
                              value={sampleSize}
                              onChange={(e) => setSampleSize(parseInt(e.target.value))}
                              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>20</span>
                            <span>{Math.min(200, evaluationData.length)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground pt-1">
                            Stratified sampling maintains the ratio of relevant vs non-relevant leads
                          </p>
                        </div>
                      )}

                      {/* Sample Preview */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">
                          Will evaluate:
                        </span>
                        <Badge variant={useSampling ? 'default' : 'secondary'}>
                          {useSampling ? sampleSize : evaluationData.length} leads
                          {useSampling && evaluationData.length > sampleSize && (
                            <span className="ml-1 opacity-70">
                              (from {evaluationData.length})
                            </span>
                          )}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name (optional)</Label>
                <Input
                  id="test-name"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="e.g., Detailed vs Concise Prompt"
                />
              </div>

              {/* Progress Bar for Running Test */}
              {runningTest && runningTestProgress && (
                <Card className="bg-blue-500/5 border-blue-500/30">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                          <span className="font-medium text-blue-700">Running A/B Test</span>
                        </div>
                        <Badge variant="secondary">
                          {runningTestProgress.current}/{runningTestProgress.total}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Progress
                          value={(runningTestProgress.current / runningTestProgress.total) * 100}
                          className="h-3"
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{runningTestProgress.phase}</span>
                          <span className="text-muted-foreground">{runningTestProgress.details}</span>
                        </div>
                      </div>

                      {/* Visual indicator for Prompt A vs B */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className={`p-3 rounded-lg border ${runningTestProgress.phase.includes('Prompt A') ? 'bg-green-500/10 border-green-500/50' : 'bg-muted/50 border-muted'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">A</Badge>
                            <span className="text-sm font-medium">{selectedPromptA?.name}</span>
                          </div>
                          {runningTestProgress.phase.includes('Prompt A') ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Evaluating...
                            </span>
                          ) : runningTestProgress.current > runningTestProgress.total / 2 ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Complete
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Waiting...</span>
                          )}
                        </div>
                        <div className={`p-3 rounded-lg border ${runningTestProgress.phase.includes('Prompt B') ? 'bg-blue-500/10 border-blue-500/50' : 'bg-muted/50 border-muted'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">B</Badge>
                            <span className="text-sm font-medium">{selectedPromptB?.name}</span>
                          </div>
                          {runningTestProgress.phase.includes('Prompt B') ? (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Evaluating...
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Waiting...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!runningTest && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={startTest}
                  disabled={!selectedPromptA || !selectedPromptB || evaluationData.length === 0 || runningTest}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start A/B Test
                </Button>
              )}

              {(!selectedPromptA || !selectedPromptB || evaluationData.length === 0) && !runningTest && (
                <p className="text-sm text-muted-foreground text-center">
                  {!selectedPromptA && 'Select Prompt A. '}
                  {!selectedPromptB && 'Select Prompt B. '}
                  {evaluationData.length === 0 && 'Upload evaluation data.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6">
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Automatic Prompt Optimization
              </CardTitle>
              <CardDescription>
                Use AI to automatically analyze failures and iteratively improve your ranking prompt.
                This implements the <strong>Hard Challenge</strong> from Throxy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  How it works
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Upload your evaluation set with ground truth rankings</li>
                  <li>AI evaluates the baseline prompt against the evaluation set</li>
                  <li>AI analyzes failures (false positives, false negatives, rank errors)</li>
                  <li>AI generates an improved prompt based on failure patterns</li>
                  <li>Process repeats until target accuracy or max iterations reached</li>
                  <li>Best performing prompt is saved to your Prompt Library</li>
                </ol>
              </div>

              {/* Evaluation Data for Optimization */}
              {evaluationData.length === 0 ? (
                <div className="border rounded-lg p-4 text-center">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload evaluation data in the A/B Test tab first
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('setup')}>
                    Go to A/B Test Setup
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Evaluation Data Loaded</span>
                    <Badge variant="secondary">{evaluationData.length} leads</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    File: {evaluationFile?.name || 'evaluation_set.csv'}
                  </p>
                </div>
              )}

              {/* Optimization Progress */}
              {optimizing && optimizationProgress && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary animate-pulse" />
                          <span className="font-medium text-primary">
                            {optimizationProgress.phase || 'Optimizing...'}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {optimizationProgress.current === 0 ? 'Baseline' : `Iteration ${optimizationProgress.current}/${optimizationProgress.total}`}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Progress
                          value={optimizationProgress.current === 0 ? 5 : (optimizationProgress.current / optimizationProgress.total) * 100}
                          className="h-3"
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {optimizationProgress.details || 'Processing...'}
                          </span>
                          <span className="font-medium">
                            Best: {optimizationProgress.score.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Iteration Steps */}
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Progress</div>
                        <div className="grid grid-cols-6 gap-1">
                          <div className={`h-2 rounded ${optimizationProgress.current >= 0 ? 'bg-primary' : 'bg-muted'}`} title="Baseline" />
                          {Array.from({ length: optimizationProgress.total }, (_, i) => (
                            <div
                              key={i}
                              className={`h-2 rounded ${optimizationProgress.current > i ? 'bg-primary' : optimizationProgress.current === i + 1 ? 'bg-primary/50 animate-pulse' : 'bg-muted'}`}
                              title={`Iteration ${i + 1}`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Baseline</span>
                          <span>Iteration {optimizationProgress.total}</span>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded p-3 space-y-1">
                        <div className="text-xs font-medium">What&apos;s happening:</div>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          <li className={optimizationProgress.current === 0 ? 'text-primary font-medium' : ''}>
                            • Evaluating prompt against {evaluationData.length} test leads
                          </li>
                          <li className={optimizationProgress.details?.includes('Analyzing') ? 'text-primary font-medium' : ''}>
                            • Analyzing false positives & negatives
                          </li>
                          <li className={optimizationProgress.details?.includes('Generating') ? 'text-primary font-medium' : ''}>
                            • Generating improved prompt version
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optimization Result */}
              {optimizationResult && (
                <Card className="border-green-500/50 bg-green-500/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-700">Optimization Complete!</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {optimizationResult.bestScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Best Score (F1)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          +{optimizationResult.improvement.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Improvement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {optimizationResult.iterations}
                        </div>
                        <div className="text-xs text-muted-foreground">Iterations</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The optimized prompt has been saved to your Prompt Library.
                      You can now use it in A/B tests or for production ranking.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Start Optimization Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={startOptimization}
                disabled={evaluationData.length === 0 || optimizing}
              >
                {optimizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing Prompt...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Auto Optimization
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Estimated time: 2-5 minutes • Uses ~100-200 API calls
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <PromptManager />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Test History</h3>
            <Button variant="outline" size="sm" onClick={fetchTests}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {tests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No A/B tests yet. Create your first test to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tests.map(test => (
                <Card key={test.id} className="cursor-pointer hover:border-primary/50" onClick={() => setSelectedTest(test)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <CardTitle className="text-base">{test.name}</CardTitle>
                      </div>
                      {getWinnerDisplay(test)}
                    </div>
                    <CardDescription>
                      {new Date(test.createdAt).toLocaleDateString()} · {test.sampleSize} leads
                    </CardDescription>
                  </CardHeader>
                  {test.status === 'completed' && (
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Prompt A: {test.promptA?.name}</span>
                            <span className="font-medium">{test.promptAAccuracy?.toFixed(1)}%</span>
                          </div>
                          <Progress value={test.promptAAccuracy || 0} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            Cost: ${test.promptACost?.toFixed(4) || '0.0000'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Prompt B: {test.promptB?.name}</span>
                            <span className="font-medium">{test.promptBAccuracy?.toFixed(1)}%</span>
                          </div>
                          <Progress value={test.promptBAccuracy || 0} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            Cost: ${test.promptBCost?.toFixed(4) || '0.0000'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                  {test.status === 'running' && (
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Test is running...
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

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
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      alert('CSV file must have headers and at least one data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
    const companyIdx = headers.findIndex(h => h === 'company' || h === 'company name');
    const titleIdx = headers.findIndex(h => h === 'title' || h === 'job title');
    const employeeIdx = headers.findIndex(h => h.includes('employee') || h.includes('size'));
    const rankIdx = headers.findIndex(h => h === 'rank' || h === 'expected rank');

    if (nameIdx === -1 || companyIdx === -1) {
      alert('CSV must have "name" and "company" columns');
      return;
    }

    const data: EvaluationData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < Math.max(nameIdx, companyIdx) + 1) continue;

      data.push({
        id: `eval-${i}`,
        name: values[nameIdx],
        company: values[companyIdx],
        title: titleIdx !== -1 ? values[titleIdx] : undefined,
        employeeRange: employeeIdx !== -1 ? values[employeeIdx] : undefined,
        rank: rankIdx !== -1 ? values[rankIdx] : undefined,
      });
    }

    setEvaluationData(data);
  }, []);

  const startTest = async () => {
    if (!selectedPromptA || !selectedPromptB || evaluationData.length === 0) {
      alert('Please select two prompts and upload evaluation data');
      return;
    }

    setRunningTest(true);
    try {
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptAId: selectedPromptA.id,
          promptBId: selectedPromptB.id,
          evaluationData,
          name: testName || `${selectedPromptA.name} vs ${selectedPromptB.name}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActiveTab('history');
        fetchTests();
        // Poll for completion
        pollTestStatus(data.data.testId);
      } else {
        alert(data.error || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Failed to start test');
    } finally {
      setRunningTest(false);
    }
  };

  const pollTestStatus = async (testId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/ab-tests/${testId}`);
        const data = await response.json();
        if (data.success) {
          setTests(prev => prev.map(t => (t.id === testId ? data.data : t)));
          if (data.data.status === 'running') {
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling test status:', error);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup Test</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Library</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
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
                <div className="space-y-2">
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

              <Button
                className="w-full"
                size="lg"
                onClick={startTest}
                disabled={!selectedPromptA || !selectedPromptB || evaluationData.length === 0 || runningTest}
              >
                {runningTest ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Starting Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start A/B Test
                  </>
                )}
              </Button>

              {(!selectedPromptA || !selectedPromptB || evaluationData.length === 0) && (
                <p className="text-sm text-muted-foreground text-center">
                  {!selectedPromptA && 'Select Prompt A. '}
                  {!selectedPromptB && 'Select Prompt B. '}
                  {evaluationData.length === 0 && 'Upload evaluation data.'}
                </p>
              )}
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

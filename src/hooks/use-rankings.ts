'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface RankingRun {
  id: string;
  name: string | null;
  status: string;
  totalLeads: number;
  processedLeads: number;
  relevantLeads: number;
  totalCost: number;
  totalTokens: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface LeadRanking {
  id: string;
  leadId: string;
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
  aiCost: number;
  tokensUsed: number;
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

interface RankingProgress {
  status: string;
  totalLeads: number;
  processedLeads: number;
  relevantLeads: number;
  totalCost: number;
  totalTokens: number;
  progress: number;
}

interface UseRankingsReturn {
  runs: RankingRun[];
  currentRun: RankingRun | null;
  results: LeadRanking[];
  progress: RankingProgress | null;
  isLoading: boolean;
  isRanking: boolean;
  error: string | null;
  fetchRuns: () => Promise<void>;
  fetchRunResults: (runId: string, params?: {
    page?: number;
    pageSize?: number;
    onlyRelevant?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  startRanking: (params?: { batchId?: string; promptId?: string; name?: string }) => Promise<string | null>;
  subscribeToProgress: (runId: string) => void;
  unsubscribeFromProgress: () => void;
  deleteRun: (runId: string) => Promise<boolean>;
  exportResults: (runId: string, topN?: number) => void;
}

export function useRankings(): UseRankingsReturn {
  const [runs, setRuns] = useState<RankingRun[]>([]);
  const [currentRun, setCurrentRun] = useState<RankingRun | null>(null);
  const [results, setResults] = useState<LeadRanking[]>([]);
  const [progress, setProgress] = useState<RankingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchRuns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rankings');
      const data = await response.json();

      if (data.success) {
        setRuns(data.data.runs);
      } else {
        setError(data.error || 'Failed to fetch ranking runs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ranking runs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRunResults = useCallback(async (runId: string, params?: {
    page?: number;
    pageSize?: number;
    onlyRelevant?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.onlyRelevant) searchParams.set('onlyRelevant', 'true');
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const response = await fetch(`/api/rankings/${runId}?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCurrentRun(data.data.run);
        setResults(data.data.results || []);
      } else {
        setError(data.error || 'Failed to fetch ranking results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ranking results');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startRanking = useCallback(async (params?: {
    batchId?: string;
    promptId?: string;
    name?: string;
  }): Promise<string | null> => {
    setIsRanking(true);
    setError(null);

    try {
      const response = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });
      const data = await response.json();

      if (data.success) {
        return data.data.runId;
      } else {
        setError(data.error || 'Failed to start ranking');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start ranking');
      return null;
    }
  }, []);

  const subscribeToProgress = useCallback((runId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/rankings/${runId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'progress') {
          setProgress(message.data);
        } else if (message.type === 'completed') {
          setProgress(null);
          setIsRanking(false);
          fetchRuns(); // Refresh runs list
        } else if (message.type === 'failed' || message.type === 'error') {
          setError(message.message || 'Ranking failed');
          setProgress(null);
          setIsRanking(false);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [fetchRuns]);

  const unsubscribeFromProgress = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setProgress(null);
  }, []);

  const deleteRun = useCallback(async (runId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rankings/${runId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setRuns(prev => prev.filter(run => run.id !== runId));
        return true;
      } else {
        setError(data.error || 'Failed to delete ranking run');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ranking run');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportResults = useCallback((runId: string, topN?: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set('runId', runId);
    if (topN) searchParams.set('topN', topN.toString());

    // Trigger download
    window.location.href = `/api/export?${searchParams.toString()}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    runs,
    currentRun,
    results,
    progress,
    isLoading,
    isRanking,
    error,
    fetchRuns,
    fetchRunResults,
    startRanking,
    subscribeToProgress,
    unsubscribeFromProgress,
    deleteRun,
    exportResults,
  };
}

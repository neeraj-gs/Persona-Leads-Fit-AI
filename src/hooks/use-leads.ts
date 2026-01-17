'use client';

import { useState, useCallback } from 'react';

interface Lead {
  id: string;
  accountName: string;
  leadFirstName: string | null;
  leadLastName: string | null;
  leadJobTitle: string | null;
  accountDomain: string | null;
  accountEmployeeRange: string | null;
  accountIndustry: string | null;
  batchId: string | null;
  createdAt: string;
  rankings?: Array<{
    id: string;
    isRelevant: boolean;
    relevanceScore: number;
    companyRank: number | null;
    reasoning: string | null;
    buyerType: string | null;
    department: string | null;
    seniority: string | null;
  }>;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UseLeadsReturn {
  leads: Lead[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  fetchLeads: (params?: { page?: number; pageSize?: number; search?: string; batchId?: string }) => Promise<void>;
  uploadLeads: (file: File) => Promise<{ batchId: string; totalLeads: number } | null>;
  deleteLeads: (batchId?: string) => Promise<boolean>;
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    batchId?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.batchId) searchParams.set('batchId', params.batchId);

      const response = await fetch(`/api/leads?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLeads(data.data.leads);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || 'Failed to fetch leads');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadLeads = useCallback(async (file: File): Promise<{ batchId: string; totalLeads: number } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/leads', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        return {
          batchId: data.data.batchId,
          totalLeads: data.data.totalLeads,
        };
      } else {
        setError(data.error || 'Failed to upload leads');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload leads');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteLeads = useCallback(async (batchId?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (batchId) {
        searchParams.set('batchId', batchId);
      } else {
        searchParams.set('confirm', 'true');
      }

      const response = await fetch(`/api/leads?${searchParams.toString()}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setError(data.error || 'Failed to delete leads');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete leads');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    leads,
    pagination,
    isLoading,
    error,
    fetchLeads,
    uploadLeads,
    deleteLeads,
  };
}

import type { Lead, LeadRanking, RankingRun, Prompt, PromptTest, UploadBatch } from '@prisma/client';

// Re-export Prisma types
export type { Lead, LeadRanking, RankingRun, Prompt, PromptTest, UploadBatch };

// CSV Import types
export interface CSVLeadRow {
  account_name: string;
  lead_first_name?: string;
  lead_last_name?: string;
  lead_job_title?: string;
  account_domain?: string;
  account_employee_range?: string;
  account_industry?: string;
  // Alternative column names from evaluation set
  'Full Name'?: string;
  Title?: string;
  Company?: string;
  LI?: string;
  'Employee Range'?: string;
}

// AI Analysis types
export interface AIAnalysisResult {
  isRelevant: boolean;
  relevanceScore: number; // 0-100
  reasoning: string;
  department: string | null;
  seniority: string | null;
  buyerType: 'decision_maker' | 'champion' | 'influencer' | 'not_relevant';
  companySizeCategory: string;
  positiveSignals: string[];
  negativeSignals: string[];
}

export interface AIFilterResult {
  shouldProcess: boolean;
  reason: string;
  quickScore: number; // 0-100, rough estimate
}

export interface AIRankingResult {
  leadId: string;
  analysis: AIAnalysisResult;
  cost: number;
  tokensUsed: number;
}

// Ranking Run with relations
export interface RankingRunWithRelations extends RankingRun {
  rankings: (LeadRanking & { lead: Lead })[];
  prompt: Prompt | null;
}

// Lead with ranking
export interface LeadWithRanking extends Lead {
  rankings: LeadRanking[];
}

// Company grouped leads
export interface CompanyLeads {
  accountName: string;
  accountDomain: string | null;
  accountEmployeeRange: string | null;
  accountIndustry: string | null;
  leads: (Lead & { ranking?: LeadRanking })[];
  topLeads: (Lead & { ranking: LeadRanking })[];
}

// Ranking progress
export interface RankingProgress {
  runId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalLeads: number;
  processedLeads: number;
  relevantLeads: number;
  currentLead?: {
    id: string;
    name: string;
    company: string;
  };
  totalCost: number;
  estimatedTimeRemaining?: number;
}

// A/B Test types
export interface PromptTestResult {
  promptId: string;
  promptName: string;
  accuracy: number;
  totalCost: number;
  avgCostPerLead: number;
  totalLeads: number;
  relevantLeads: number;
  rankings: {
    leadId: string;
    expectedRank: number | null;
    actualRank: number | null;
    score: number;
    isCorrect: boolean;
  }[];
}

export interface ABTestComparison {
  testId: string;
  promptA: PromptTestResult;
  promptB: PromptTestResult;
  winner: 'prompt_a' | 'prompt_b' | 'tie';
  accuracyDifference: number;
  costDifference: number;
  statisticalSignificance?: number;
}

// Multi-threading visualization types
export interface LeadRelationship {
  sourceLeadId: string;
  targetLeadId: string;
  relationshipType: 'same_company' | 'reports_to' | 'peer' | 'champion_path';
  strength: number; // 0-1
}

export interface CompanyOrgChart {
  accountName: string;
  leads: {
    id: string;
    name: string;
    title: string;
    rank: number | null;
    isRelevant: boolean;
    seniority: string | null;
    department: string | null;
    buyerType: string | null;
  }[];
  relationships: LeadRelationship[];
  recommendedPath: string[]; // Lead IDs in recommended contact order
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Export options
export interface ExportOptions {
  rankingRunId: string;
  topN: number;
  format: 'csv' | 'json';
  includeNonRelevant: boolean;
}

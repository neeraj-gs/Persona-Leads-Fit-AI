/**
 * AI Lead Ranking System
 *
 * This module orchestrates the 3-step AI ranking process:
 * 1. Pre-filtering (AI-assisted quick relevance check)
 * 2. Deep analysis (AI scoring and classification)
 * 3. Company-level ranking (AI-assisted prioritization)
 */

import { openai, calculateCost, OpenAIModel } from '../openai';
import { parseEmployeeRange, CompanySizeCategory } from '../utils/employee-range';
import {
  PREFILTER_SYSTEM_PROMPT,
  generatePrefilterUserPrompt,
  generateAnalysisSystemPrompt,
  generateAnalysisUserPrompt,
  generateCompanyRankingSystemPrompt,
  generateCompanyRankingUserPrompt,
} from './prompts';
import type { AIAnalysisResult, AIFilterResult } from '@/types';

const DEFAULT_MODEL: OpenAIModel = 'gpt-4o-mini';

interface RankerConfig {
  model?: OpenAIModel;
  skipPrefilter?: boolean;
  batchSize?: number;
  onProgress?: (progress: {
    step: 'prefilter' | 'analyze' | 'rank';
    current: number;
    total: number;
    leadId?: string;
    leadName?: string;
  }) => void;
}

interface LeadInput {
  id: string;
  name: string;
  title: string | null;
  company: string;
  employeeRange: string | null;
  industry: string | null;
  domain: string | null;
}

interface RankingResult {
  leadId: string;
  isRelevant: boolean;
  relevanceScore: number;
  companyRank: number | null;
  analysis: AIAnalysisResult | null;
  cost: number;
  tokensUsed: number;
  skipped: boolean;
  skipReason?: string;
}

/**
 * Step 1: Pre-filter a lead using AI
 * Quick check to eliminate obviously irrelevant leads
 */
export async function prefilterLead(
  lead: LeadInput,
  model: OpenAIModel = DEFAULT_MODEL
): Promise<{ result: AIFilterResult; cost: number; tokens: number }> {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: PREFILTER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: generatePrefilterUserPrompt({
            name: lead.name,
            title: lead.title,
            company: lead.company,
            employeeRange: lead.employeeRange,
          }),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as AIFilterResult;

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = calculateCost(model, inputTokens, outputTokens);

    return {
      result: {
        shouldProcess: parsed.shouldProcess ?? false,
        reason: parsed.reason || 'Unknown',
        quickScore: parsed.quickScore || 0,
      },
      cost,
      tokens: inputTokens + outputTokens,
    };
  } catch (error) {
    console.error('Prefilter error:', error);
    // On error, pass through to detailed analysis
    return {
      result: {
        shouldProcess: true,
        reason: 'Error in prefilter, passing through',
        quickScore: 50,
      },
      cost: 0,
      tokens: 0,
    };
  }
}

/**
 * Step 2: Deep analysis of a lead using AI
 */
export async function analyzeLead(
  lead: LeadInput,
  model: OpenAIModel = DEFAULT_MODEL,
  customSystemPrompt?: string
): Promise<{ result: AIAnalysisResult; cost: number; tokens: number }> {
  const { category: sizeCategory } = parseEmployeeRange(lead.employeeRange);

  try {
    const systemPrompt = customSystemPrompt || generateAnalysisSystemPrompt(sizeCategory);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: generateAnalysisUserPrompt({
            name: lead.name,
            title: lead.title,
            company: lead.company,
            employeeRange: lead.employeeRange,
            industry: lead.industry,
            domain: lead.domain,
          }),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = calculateCost(model, inputTokens, outputTokens);

    const result: AIAnalysisResult = {
      isRelevant: parsed.isRelevant ?? false,
      relevanceScore: Math.min(100, Math.max(0, parsed.relevanceScore || 0)),
      reasoning: parsed.reasoning || 'No reasoning provided',
      department: parsed.department || null,
      seniority: parsed.seniority || null,
      buyerType: parsed.buyerType || 'not_relevant',
      companySizeCategory: sizeCategory,
      positiveSignals: Array.isArray(parsed.positiveSignals) ? parsed.positiveSignals : [],
      negativeSignals: Array.isArray(parsed.negativeSignals) ? parsed.negativeSignals : [],
    };

    return { result, cost, tokens: inputTokens + outputTokens };
  } catch (error) {
    console.error('Analysis error for lead:', lead.id, error);

    // Return a default not-relevant result on error
    return {
      result: {
        isRelevant: false,
        relevanceScore: 0,
        reasoning: 'Error during analysis',
        department: null,
        seniority: null,
        buyerType: 'not_relevant',
        companySizeCategory: sizeCategory,
        positiveSignals: [],
        negativeSignals: ['Analysis error'],
      },
      cost: 0,
      tokens: 0,
    };
  }
}

/**
 * Step 3: Rank leads within a company using AI
 */
export async function rankCompanyLeads(
  companyName: string,
  employeeRange: string | null,
  leads: Array<{
    id: string;
    name: string;
    title: string | null;
    score: number;
    isRelevant: boolean;
  }>,
  model: OpenAIModel = DEFAULT_MODEL
): Promise<{ ranking: string[]; cost: number; tokens: number }> {
  const relevantLeads = leads.filter(l => l.isRelevant);

  // If no relevant leads, return empty ranking
  if (relevantLeads.length === 0) {
    return { ranking: [], cost: 0, tokens: 0 };
  }

  // If only one relevant lead, no need for AI
  if (relevantLeads.length === 1) {
    return { ranking: [relevantLeads[0].id], cost: 0, tokens: 0 };
  }

  const { category: sizeCategory } = parseEmployeeRange(employeeRange);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: generateCompanyRankingSystemPrompt(sizeCategory) },
        { role: 'user', content: generateCompanyRankingUserPrompt(relevantLeads) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '[]';
    let parsed: string[];

    try {
      const jsonContent = JSON.parse(content);
      // Handle both array and object with array property
      parsed = Array.isArray(jsonContent) ? jsonContent : (jsonContent.ranking || jsonContent.order || []);
    } catch {
      parsed = [];
    }

    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = calculateCost(model, inputTokens, outputTokens);

    // Validate ranking - ensure all IDs are from our leads
    const validIds = new Set(relevantLeads.map(l => l.id));
    const validRanking = parsed.filter(id => validIds.has(id));

    // Add any missing relevant leads at the end (sorted by score)
    const rankedIds = new Set(validRanking);
    const missingLeads = relevantLeads
      .filter(l => !rankedIds.has(l.id))
      .sort((a, b) => b.score - a.score)
      .map(l => l.id);

    return {
      ranking: [...validRanking, ...missingLeads],
      cost,
      tokens: inputTokens + outputTokens,
    };
  } catch (error) {
    console.error('Ranking error for company:', companyName, error);

    // Fallback: sort by score
    const fallbackRanking = relevantLeads
      .sort((a, b) => b.score - a.score)
      .map(l => l.id);

    return { ranking: fallbackRanking, cost: 0, tokens: 0 };
  }
}

/**
 * Main ranking function: Process all leads through the 3-step pipeline
 */
export async function rankLeads(
  leads: LeadInput[],
  config: RankerConfig = {}
): Promise<{
  results: RankingResult[];
  totalCost: number;
  totalTokens: number;
  stats: {
    total: number;
    prefiltered: number;
    analyzed: number;
    relevant: number;
  };
}> {
  const {
    model = DEFAULT_MODEL,
    skipPrefilter = false,
    onProgress,
  } = config;

  const results: RankingResult[] = [];
  let totalCost = 0;
  let totalTokens = 0;
  let prefiltered = 0;
  let analyzed = 0;
  let relevant = 0;

  // Group leads by company for later ranking
  const leadsByCompany = new Map<string, LeadInput[]>();
  const resultsByLead = new Map<string, RankingResult>();

  // Step 1 & 2: Pre-filter and analyze each lead
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];

    // Group by company
    if (!leadsByCompany.has(lead.company)) {
      leadsByCompany.set(lead.company, []);
    }
    leadsByCompany.get(lead.company)!.push(lead);

    // Step 1: Pre-filter (optional)
    if (!skipPrefilter) {
      onProgress?.({
        step: 'prefilter',
        current: i + 1,
        total: leads.length,
        leadId: lead.id,
        leadName: lead.name,
      });

      const { result: filterResult, cost: filterCost, tokens: filterTokens } = await prefilterLead(lead, model);
      totalCost += filterCost;
      totalTokens += filterTokens;

      if (!filterResult.shouldProcess) {
        prefiltered++;
        const result: RankingResult = {
          leadId: lead.id,
          isRelevant: false,
          relevanceScore: filterResult.quickScore,
          companyRank: null,
          analysis: null,
          cost: filterCost,
          tokensUsed: filterTokens,
          skipped: true,
          skipReason: filterResult.reason,
        };
        results.push(result);
        resultsByLead.set(lead.id, result);
        continue;
      }
    }

    // Step 2: Deep analysis
    onProgress?.({
      step: 'analyze',
      current: i + 1,
      total: leads.length,
      leadId: lead.id,
      leadName: lead.name,
    });

    const { result: analysisResult, cost: analysisCost, tokens: analysisTokens } = await analyzeLead(lead, model);
    totalCost += analysisCost;
    totalTokens += analysisTokens;
    analyzed++;

    if (analysisResult.isRelevant) {
      relevant++;
    }

    const result: RankingResult = {
      leadId: lead.id,
      isRelevant: analysisResult.isRelevant,
      relevanceScore: analysisResult.relevanceScore,
      companyRank: null, // Will be set in step 3
      analysis: analysisResult,
      cost: analysisCost,
      tokensUsed: analysisTokens,
      skipped: false,
    };
    results.push(result);
    resultsByLead.set(lead.id, result);
  }

  // Step 3: Rank leads within each company
  let companyIndex = 0;
  const totalCompanies = leadsByCompany.size;

  for (const [companyName, companyLeads] of leadsByCompany) {
    companyIndex++;

    onProgress?.({
      step: 'rank',
      current: companyIndex,
      total: totalCompanies,
    });

    const leadsForRanking = companyLeads.map(lead => {
      const result = resultsByLead.get(lead.id);
      return {
        id: lead.id,
        name: lead.name,
        title: lead.title,
        score: result?.relevanceScore || 0,
        isRelevant: result?.isRelevant || false,
      };
    });

    const { ranking, cost: rankCost, tokens: rankTokens } = await rankCompanyLeads(
      companyName,
      companyLeads[0]?.employeeRange || null,
      leadsForRanking,
      model
    );
    totalCost += rankCost;
    totalTokens += rankTokens;

    // Assign ranks
    ranking.forEach((leadId, index) => {
      const result = resultsByLead.get(leadId);
      if (result) {
        result.companyRank = index + 1;
      }
    });
  }

  return {
    results,
    totalCost,
    totalTokens,
    stats: {
      total: leads.length,
      prefiltered,
      analyzed,
      relevant,
    },
  };
}

/**
 * Analyze a single lead (for testing or individual analysis)
 */
export async function analyzeSingleLead(
  lead: LeadInput,
  model: OpenAIModel = DEFAULT_MODEL
): Promise<RankingResult> {
  const { result, cost, tokens } = await analyzeLead(lead, model);

  return {
    leadId: lead.id,
    isRelevant: result.isRelevant,
    relevanceScore: result.relevanceScore,
    companyRank: result.isRelevant ? 1 : null, // Single lead, so rank 1 if relevant
    analysis: result,
    cost,
    tokensUsed: tokens,
    skipped: false,
  };
}

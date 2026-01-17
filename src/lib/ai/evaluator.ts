/**
 * Evaluation System for A/B Testing
 *
 * Compares AI-generated rankings against the ground truth evaluation set
 * to measure prompt accuracy and effectiveness.
 */

import { openai, calculateCost, OpenAIModel } from '../openai';
import { parseEmployeeRange } from '../utils/employee-range';
import {
  generateAnalysisSystemPrompt,
  generateAnalysisUserPrompt,
} from './prompts';
import type { AIAnalysisResult } from '@/types';

const DEFAULT_MODEL: OpenAIModel = 'gpt-4o-mini';

export interface EvaluationLead {
  id: string;
  name: string;
  title: string | null;
  company: string;
  employeeRange: string | null;
  expectedRank: number | null; // null means "not relevant" (-)
}

export interface EvaluationResult {
  leadId: string;
  name: string;
  company: string;
  expectedRank: number | null;
  predictedRelevant: boolean;
  predictedScore: number;
  predictedRank: number | null;
  isCorrectRelevance: boolean;
  rankError: number | null; // Absolute difference in rank
  analysis: AIAnalysisResult | null;
  cost: number;
  tokens: number;
}

export interface PromptEvaluationSummary {
  promptId: string;
  promptName: string;
  totalLeads: number;
  relevanceAccuracy: number; // % correct relevant/not-relevant
  relevancePrecision: number; // True positives / (True positives + False positives)
  relevanceRecall: number; // True positives / (True positives + False negatives)
  relevanceF1: number;
  avgRankError: number; // Average absolute rank error for relevant leads
  rankCorrelation: number; // Spearman correlation for rank ordering
  totalCost: number;
  avgCostPerLead: number;
  results: EvaluationResult[];
}

/**
 * Evaluate a single lead with a specific prompt
 */
export async function evaluateLead(
  lead: EvaluationLead,
  systemPrompt: string,
  model: OpenAIModel = DEFAULT_MODEL
): Promise<EvaluationResult> {
  const { category: sizeCategory } = parseEmployeeRange(lead.employeeRange);

  try {
    // Use the provided system prompt or generate default
    const prompt = systemPrompt || generateAnalysisSystemPrompt(sizeCategory);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: generateAnalysisUserPrompt({
            name: lead.name,
            title: lead.title,
            company: lead.company,
            employeeRange: lead.employeeRange,
            industry: null,
            domain: null,
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

    const analysis: AIAnalysisResult = {
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

    // Compare prediction vs expected
    const expectedRelevant = lead.expectedRank !== null;
    const predictedRelevant = analysis.isRelevant;
    const isCorrectRelevance = expectedRelevant === predictedRelevant;

    // Calculate rank error (only for leads that are relevant in both expected and predicted)
    let rankError: number | null = null;
    if (expectedRelevant && predictedRelevant && lead.expectedRank !== null) {
      // Rank error will be calculated after all leads in company are processed
      rankError = 0; // Placeholder
    }

    return {
      leadId: lead.id,
      name: lead.name,
      company: lead.company,
      expectedRank: lead.expectedRank,
      predictedRelevant,
      predictedScore: analysis.relevanceScore,
      predictedRank: null, // Will be calculated after company grouping
      isCorrectRelevance,
      rankError,
      analysis,
      cost,
      tokens: inputTokens + outputTokens,
    };
  } catch (error) {
    console.error('Evaluation error for lead:', lead.id, error);

    return {
      leadId: lead.id,
      name: lead.name,
      company: lead.company,
      expectedRank: lead.expectedRank,
      predictedRelevant: false,
      predictedScore: 0,
      predictedRank: null,
      isCorrectRelevance: lead.expectedRank === null, // Correct if expected not relevant
      rankError: null,
      analysis: null,
      cost: 0,
      tokens: 0,
    };
  }
}

/**
 * Evaluate a prompt against the evaluation set
 */
export async function evaluatePrompt(
  promptId: string,
  promptName: string,
  systemPrompt: string,
  evaluationLeads: EvaluationLead[],
  model: OpenAIModel = DEFAULT_MODEL,
  onProgress?: (current: number, total: number) => void
): Promise<PromptEvaluationSummary> {
  const results: EvaluationResult[] = [];
  let totalCost = 0;

  // Evaluate each lead
  for (let i = 0; i < evaluationLeads.length; i++) {
    const lead = evaluationLeads[i];
    onProgress?.(i + 1, evaluationLeads.length);

    const result = await evaluateLead(lead, systemPrompt, model);
    results.push(result);
    totalCost += result.cost;
  }

  // Group by company and assign predicted ranks
  const byCompany = new Map<string, EvaluationResult[]>();
  for (const result of results) {
    if (!byCompany.has(result.company)) {
      byCompany.set(result.company, []);
    }
    byCompany.get(result.company)!.push(result);
  }

  // Assign predicted ranks within each company
  for (const [, companyResults] of byCompany) {
    const relevantResults = companyResults
      .filter(r => r.predictedRelevant)
      .sort((a, b) => b.predictedScore - a.predictedScore);

    relevantResults.forEach((result, index) => {
      result.predictedRank = index + 1;

      // Calculate rank error if expected rank exists
      if (result.expectedRank !== null) {
        result.rankError = Math.abs(result.predictedRank - result.expectedRank);
      }
    });
  }

  // Calculate metrics
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  let totalRankError = 0;
  let rankErrorCount = 0;

  const expectedRanks: number[] = [];
  const predictedRanks: number[] = [];

  for (const result of results) {
    const expectedRelevant = result.expectedRank !== null;

    if (expectedRelevant && result.predictedRelevant) {
      truePositives++;
      if (result.rankError !== null) {
        totalRankError += result.rankError;
        rankErrorCount++;
        expectedRanks.push(result.expectedRank!);
        predictedRanks.push(result.predictedRank!);
      }
    } else if (!expectedRelevant && !result.predictedRelevant) {
      trueNegatives++;
    } else if (!expectedRelevant && result.predictedRelevant) {
      falsePositives++;
    } else {
      falseNegatives++;
    }
  }

  const relevanceAccuracy = results.length > 0
    ? ((truePositives + trueNegatives) / results.length) * 100
    : 0;

  const precision = (truePositives + falsePositives) > 0
    ? truePositives / (truePositives + falsePositives)
    : 0;

  const recall = (truePositives + falseNegatives) > 0
    ? truePositives / (truePositives + falseNegatives)
    : 0;

  const f1 = (precision + recall) > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  const avgRankError = rankErrorCount > 0
    ? totalRankError / rankErrorCount
    : 0;

  // Calculate Spearman rank correlation
  const rankCorrelation = calculateSpearmanCorrelation(expectedRanks, predictedRanks);

  return {
    promptId,
    promptName,
    totalLeads: results.length,
    relevanceAccuracy,
    relevancePrecision: precision * 100,
    relevanceRecall: recall * 100,
    relevanceF1: f1 * 100,
    avgRankError,
    rankCorrelation,
    totalCost,
    avgCostPerLead: results.length > 0 ? totalCost / results.length : 0,
    results,
  };
}

/**
 * Calculate Spearman rank correlation coefficient
 */
function calculateSpearmanCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) {
    return 0;
  }

  const n = x.length;

  // Calculate rank differences
  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = x[i] - y[i];
    sumD2 += d * d;
  }

  // Spearman formula: 1 - (6 * sum(d^2)) / (n * (n^2 - 1))
  const correlation = 1 - (6 * sumD2) / (n * (n * n - 1));

  return correlation;
}

/**
 * Run A/B test comparing two prompts
 */
export async function runABTest(
  promptA: { id: string; name: string; systemPrompt: string },
  promptB: { id: string; name: string; systemPrompt: string },
  evaluationLeads: EvaluationLead[],
  model: OpenAIModel = DEFAULT_MODEL,
  onProgress?: (promptIndex: number, current: number, total: number) => void
): Promise<{
  promptA: PromptEvaluationSummary;
  promptB: PromptEvaluationSummary;
  winner: 'A' | 'B' | 'tie';
  summary: string;
}> {
  // Evaluate Prompt A
  const resultA = await evaluatePrompt(
    promptA.id,
    promptA.name,
    promptA.systemPrompt,
    evaluationLeads,
    model,
    (current, total) => onProgress?.(0, current, total)
  );

  // Evaluate Prompt B
  const resultB = await evaluatePrompt(
    promptB.id,
    promptB.name,
    promptB.systemPrompt,
    evaluationLeads,
    model,
    (current, total) => onProgress?.(1, current, total)
  );

  // Determine winner based on F1 score (balances precision and recall)
  let winner: 'A' | 'B' | 'tie';
  const f1Diff = resultA.relevanceF1 - resultB.relevanceF1;

  if (Math.abs(f1Diff) < 2) {
    // Within 2% is considered a tie
    winner = 'tie';
  } else if (f1Diff > 0) {
    winner = 'A';
  } else {
    winner = 'B';
  }

  // Generate summary
  const summary = generateABTestSummary(resultA, resultB, winner);

  return {
    promptA: resultA,
    promptB: resultB,
    winner,
    summary,
  };
}

function generateABTestSummary(
  a: PromptEvaluationSummary,
  b: PromptEvaluationSummary,
  winner: 'A' | 'B' | 'tie'
): string {
  const lines = [
    `## A/B Test Results`,
    ``,
    `### Prompt A: ${a.promptName}`,
    `- Accuracy: ${a.relevanceAccuracy.toFixed(1)}%`,
    `- F1 Score: ${a.relevanceF1.toFixed(1)}%`,
    `- Avg Rank Error: ${a.avgRankError.toFixed(2)}`,
    `- Cost: $${a.totalCost.toFixed(4)}`,
    ``,
    `### Prompt B: ${b.promptName}`,
    `- Accuracy: ${b.relevanceAccuracy.toFixed(1)}%`,
    `- F1 Score: ${b.relevanceF1.toFixed(1)}%`,
    `- Avg Rank Error: ${b.avgRankError.toFixed(2)}`,
    `- Cost: $${b.totalCost.toFixed(4)}`,
    ``,
    `### Winner: ${winner === 'tie' ? 'Tie' : `Prompt ${winner}`}`,
  ];

  if (winner !== 'tie') {
    const winnerResult = winner === 'A' ? a : b;
    const loserResult = winner === 'A' ? b : a;
    lines.push(
      ``,
      `Prompt ${winner} outperformed with:`,
      `- ${(winnerResult.relevanceF1 - loserResult.relevanceF1).toFixed(1)}% higher F1 score`,
      `- ${Math.abs(winnerResult.avgRankError - loserResult.avgRankError).toFixed(2)} ${winnerResult.avgRankError < loserResult.avgRankError ? 'lower' : 'higher'} rank error`,
      `- ${((winnerResult.totalCost - loserResult.totalCost) / loserResult.totalCost * 100).toFixed(1)}% ${winnerResult.totalCost < loserResult.totalCost ? 'cheaper' : 'more expensive'}`
    );
  }

  return lines.join('\n');
}

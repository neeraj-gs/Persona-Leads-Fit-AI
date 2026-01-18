/**
 * Automatic Prompt Optimization
 *
 * Implements iterative prompt optimization using AI to analyze failures
 * and generate improved prompt variations.
 *
 * Reference: https://cameronrwolfe.substack.com/p/automatic-prompt-optimization
 */

import { openai, calculateCost, OpenAIModel } from '../openai';
import { evaluatePrompt, EvaluationLead, PromptEvaluationSummary } from './evaluator';
import { PERSONA_SPEC } from './prompts';

const OPTIMIZER_MODEL: OpenAIModel = 'gpt-4o-mini';
const EVALUATION_MODEL: OpenAIModel = 'gpt-4o-mini';

export interface OptimizationResult {
  iterations: OptimizationIteration[];
  bestPrompt: {
    systemPrompt: string;
    score: number;
    metrics: PromptEvaluationSummary;
  };
  totalCost: number;
  totalIterations: number;
  improvement: number; // % improvement from baseline
}

export interface OptimizationIteration {
  iteration: number;
  prompt: string;
  score: number;
  metrics: PromptEvaluationSummary;
  analysis: string;
  improvements: string[];
  cost: number;
}

export interface OptimizationConfig {
  maxIterations?: number;
  targetScore?: number;
  baselinePrompt?: string;
  onProgress?: (iteration: number, total: number, currentScore: number, phase?: string, details?: string) => void;
}

/**
 * Analyze evaluation failures and suggest improvements
 */
async function analyzeFailures(
  metrics: PromptEvaluationSummary,
  currentPrompt: string
): Promise<{ analysis: string; improvements: string[] }> {
  // Find failure patterns
  const falseNegatives = metrics.results.filter(
    r => r.expectedRank !== null && !r.predictedRelevant
  );
  const falsePositives = metrics.results.filter(
    r => r.expectedRank === null && r.predictedRelevant
  );
  const rankErrors = metrics.results.filter(
    r => r.rankError !== null && r.rankError > 1
  );

  const failureSummary = `
## Current Performance
- Accuracy: ${metrics.relevanceAccuracy.toFixed(1)}%
- F1 Score: ${metrics.relevanceF1.toFixed(1)}%
- Precision: ${metrics.relevancePrecision.toFixed(1)}%
- Recall: ${metrics.relevanceRecall.toFixed(1)}%
- Avg Rank Error: ${metrics.avgRankError.toFixed(2)}

## Failure Analysis
- False Negatives (missed relevant leads): ${falseNegatives.length}
${falseNegatives.slice(0, 5).map(r => `  - ${r.name} (${metrics.results.find(x => x.leadId === r.leadId)?.analysis?.department || 'Unknown'}) - Expected rank ${r.expectedRank}`).join('\n')}

- False Positives (incorrectly marked relevant): ${falsePositives.length}
${falsePositives.slice(0, 5).map(r => `  - ${r.name} (${metrics.results.find(x => x.leadId === r.leadId)?.analysis?.department || 'Unknown'})`).join('\n')}

- Significant Rank Errors (>1 position off): ${rankErrors.length}
${rankErrors.slice(0, 5).map(r => `  - ${r.name}: Expected ${r.expectedRank}, Got ${r.predictedRank} (error: ${r.rankError})`).join('\n')}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Use more powerful model for analysis
    messages: [
      {
        role: 'system',
        content: `You are an expert at optimizing AI prompts for lead qualification and ranking.
Your task is to analyze failures in a lead ranking system and suggest specific, actionable improvements.

The system ranks B2B sales leads based on their fit with an ideal customer persona (sales/revenue roles).

Focus on:
1. Patterns in false negatives (relevant leads marked as not relevant)
2. Patterns in false positives (irrelevant leads marked as relevant)
3. Ranking accuracy (position within company)
4. Specific wording changes that could help

Be specific and actionable. Don't be generic.`,
      },
      {
        role: 'user',
        content: `Analyze these evaluation results and suggest improvements to the prompt:

## Current Prompt
${currentPrompt.substring(0, 2000)}...

${failureSummary}

Provide:
1. A brief analysis of what's going wrong (2-3 sentences)
2. 3-5 specific improvements to make to the prompt

Format your response as JSON:
{
  "analysis": "Brief analysis of the main issues",
  "improvements": ["Specific improvement 1", "Specific improvement 2", ...]
}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  return {
    analysis: parsed.analysis || 'Unable to analyze failures',
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
  };
}

/**
 * Generate an improved prompt based on analysis
 */
async function generateImprovedPrompt(
  currentPrompt: string,
  analysis: string,
  improvements: string[],
  personaSpec: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Use more powerful model for generation
    messages: [
      {
        role: 'system',
        content: `You are an expert at writing AI prompts for lead qualification systems.
Your task is to rewrite and improve a prompt based on specific feedback.

Guidelines:
- Maintain the core structure and JSON output format
- Incorporate the suggested improvements naturally
- Keep the prompt focused and not too long
- Ensure scoring guidelines are clear and actionable
- The prompt should work with the persona spec to qualify B2B sales leads`,
      },
      {
        role: 'user',
        content: `Rewrite this prompt to address the issues identified:

## Current Prompt
${currentPrompt}

## Persona Spec (for reference)
${personaSpec.substring(0, 1500)}...

## Analysis
${analysis}

## Required Improvements
${improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

Generate an improved version of the prompt. Return ONLY the new prompt text, nothing else.
Keep the same JSON output format requirement.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || currentPrompt;
}

/**
 * Default baseline prompt for optimization
 */
const DEFAULT_BASELINE_PROMPT = `You are an expert B2B sales lead analyst. Your task is to determine if a lead is relevant for a sales automation platform targeting sales/revenue leaders.

## Scoring Guidelines
- 90-100: Perfect match - VP/Director of Sales, Sales Development, or Revenue at the right company size
- 70-89: Strong match - Senior sales role with decision-making authority
- 50-69: Moderate match - Related role, potential champion
- 30-49: Weak match - Tangentially related
- 0-29: Not relevant - Wrong department or role

## Key Rules
1. Sales, Revenue, Business Development roles = Relevant
2. HR, Engineering, Finance, Legal, Product = Not relevant
3. At startups (1-50): Founders/CEOs are highly relevant
4. At larger companies: VPs and Directors are ideal, CEOs are too removed
5. Individual contributors (BDRs, SDRs, AEs) are lower priority

## Response Format
Return ONLY valid JSON:
{
  "isRelevant": boolean,
  "relevanceScore": number (0-100),
  "reasoning": "2-3 sentence explanation",
  "department": "detected department",
  "seniority": "founder|c_level|vp|director|manager|ic|other",
  "buyerType": "decision_maker|champion|influencer|not_relevant",
  "positiveSignals": ["signal1", "signal2"],
  "negativeSignals": ["signal1", "signal2"]
}`;

/**
 * Run automatic prompt optimization
 */
export async function optimizePrompt(
  evaluationLeads: EvaluationLead[],
  config: OptimizationConfig = {}
): Promise<OptimizationResult> {
  const {
    maxIterations = 5,
    targetScore = 85,
    baselinePrompt = DEFAULT_BASELINE_PROMPT,
    onProgress,
  } = config;

  const iterations: OptimizationIteration[] = [];
  let currentPrompt = baselinePrompt;
  let bestPrompt = baselinePrompt;
  let bestScore = 0;
  let bestMetrics: PromptEvaluationSummary | null = null;
  let totalCost = 0;

  // Evaluate baseline
  onProgress?.(0, maxIterations, 0, 'Evaluating Baseline', `Testing ${evaluationLeads.length} leads...`);

  const baselineMetrics = await evaluatePrompt(
    'baseline',
    'Baseline Prompt',
    currentPrompt,
    evaluationLeads,
    EVALUATION_MODEL,
    (current, total) => {
      onProgress?.(0, maxIterations, 0, 'Evaluating Baseline', `Lead ${current}/${total}`);
    }
  );

  const baselineScore = baselineMetrics.relevanceF1;
  bestScore = baselineScore;
  bestMetrics = baselineMetrics;
  totalCost += baselineMetrics.totalCost;

  onProgress?.(0, maxIterations, baselineScore, 'Baseline Complete', `Score: ${baselineScore.toFixed(1)}%`);

  iterations.push({
    iteration: 0,
    prompt: currentPrompt,
    score: baselineScore,
    metrics: baselineMetrics,
    analysis: 'Baseline evaluation',
    improvements: [],
    cost: baselineMetrics.totalCost,
  });

  // Iterative optimization
  for (let i = 1; i <= maxIterations; i++) {
    onProgress?.(i, maxIterations, bestScore, `Iteration ${i}/${maxIterations}`, 'Analyzing failures...');

    // Check if we've reached target
    if (bestScore >= targetScore) {
      console.log(`Reached target score ${targetScore}% at iteration ${i - 1}`);
      onProgress?.(i, maxIterations, bestScore, 'Target Reached!', `Score: ${bestScore.toFixed(1)}%`);
      break;
    }

    // Analyze failures from best performing prompt so far
    onProgress?.(i, maxIterations, bestScore, `Iteration ${i}/${maxIterations}`, 'Analyzing failures with AI...');
    const { analysis, improvements } = await analyzeFailures(
      bestMetrics!,
      currentPrompt
    );

    if (improvements.length === 0) {
      console.log('No more improvements suggested');
      onProgress?.(i, maxIterations, bestScore, 'Optimization Complete', 'No more improvements found');
      break;
    }

    // Generate improved prompt
    onProgress?.(i, maxIterations, bestScore, `Iteration ${i}/${maxIterations}`, 'Generating improved prompt...');
    const improvedPrompt = await generateImprovedPrompt(
      currentPrompt,
      analysis,
      improvements,
      PERSONA_SPEC
    );

    // Evaluate improved prompt
    onProgress?.(i, maxIterations, bestScore, `Iteration ${i}/${maxIterations}`, 'Evaluating new prompt...');
    const metrics = await evaluatePrompt(
      `iteration-${i}`,
      `Iteration ${i}`,
      improvedPrompt,
      evaluationLeads,
      EVALUATION_MODEL,
      (current, total) => {
        onProgress?.(i, maxIterations, bestScore, `Iteration ${i}/${maxIterations}`, `Evaluating lead ${current}/${total}`);
      }
    );

    const score = metrics.relevanceF1;
    totalCost += metrics.totalCost;

    iterations.push({
      iteration: i,
      prompt: improvedPrompt,
      score,
      metrics,
      analysis,
      improvements,
      cost: metrics.totalCost,
    });

    // Update best if improved
    if (score > bestScore) {
      bestScore = score;
      bestPrompt = improvedPrompt;
      bestMetrics = metrics;
      currentPrompt = improvedPrompt; // Use improved prompt as base for next iteration
    }

    console.log(`Iteration ${i}: Score ${score.toFixed(1)}% (best: ${bestScore.toFixed(1)}%)`);
  }

  const improvement = baselineScore > 0
    ? ((bestScore - baselineScore) / baselineScore) * 100
    : 0;

  return {
    iterations,
    bestPrompt: {
      systemPrompt: bestPrompt,
      score: bestScore,
      metrics: bestMetrics!,
    },
    totalCost,
    totalIterations: iterations.length,
    improvement,
  };
}

/**
 * Quick optimization with fewer iterations for testing
 */
export async function quickOptimize(
  evaluationLeads: EvaluationLead[],
  onProgress?: (iteration: number, total: number, score: number) => void
): Promise<OptimizationResult> {
  return optimizePrompt(evaluationLeads, {
    maxIterations: 3,
    targetScore: 80,
    onProgress,
  });
}

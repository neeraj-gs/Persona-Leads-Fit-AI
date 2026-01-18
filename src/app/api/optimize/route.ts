import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { optimizePrompt, OptimizationResult } from '@/lib/ai/optimizer';
import type { EvaluationLead } from '@/lib/ai/evaluator';
import { createProgress, updateProgress, completeProgress, failProgress, getProgress, setProgress } from '@/lib/progress-store';

// Store running optimizations in memory (in production, use Redis or DB)
const runningOptimizations = new Map<string, {
  status: 'running' | 'completed' | 'failed';
  progress: { current: number; total: number; score: number; phase: string; details?: string };
  result?: OptimizationResult;
  error?: string;
  startedAt: Date;
}>();

/**
 * GET /api/optimize
 * Get optimization status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const optimizationId = searchParams.get('id');

  if (optimizationId) {
    const optimization = runningOptimizations.get(optimizationId);
    if (!optimization) {
      return NextResponse.json(
        { success: false, error: 'Optimization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: optimizationId,
        status: optimization.status,
        progress: optimization.progress,
        result: optimization.result,
        error: optimization.error,
      },
    });
  }

  // Return all optimizations
  const all = Array.from(runningOptimizations.entries()).map(([id, opt]) => ({
    id,
    status: opt.status,
    progress: opt.progress,
    startedAt: opt.startedAt,
  }));

  return NextResponse.json({
    success: true,
    data: all,
  });
}

/**
 * POST /api/optimize
 * Start automatic prompt optimization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluationData, maxIterations = 5, targetScore = 85 } = body;

    if (!evaluationData || !Array.isArray(evaluationData) || evaluationData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'evaluationData is required' },
        { status: 400 }
      );
    }

    // Parse evaluation data
    const evaluationLeads: EvaluationLead[] = evaluationData.map((lead: {
      id?: string;
      name: string;
      title?: string;
      company: string;
      employeeRange?: string;
      rank?: number | string;
    }, index: number) => ({
      id: lead.id || `eval-${index}`,
      name: lead.name,
      title: lead.title || null,
      company: lead.company,
      employeeRange: lead.employeeRange || null,
      expectedRank: lead.rank === '-' || lead.rank === null || lead.rank === undefined || lead.rank === ''
        ? null
        : typeof lead.rank === 'string' ? parseInt(lead.rank) || null : lead.rank,
    }));

    // Generate optimization ID
    const optimizationId = `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize optimization state
    runningOptimizations.set(optimizationId, {
      status: 'running',
      progress: { current: 0, total: maxIterations, score: 0, phase: 'Initializing...', details: 'Preparing baseline evaluation' },
      startedAt: new Date(),
    });

    // Run optimization in background
    runOptimizationAsync(optimizationId, evaluationLeads, maxIterations, targetScore);

    return NextResponse.json({
      success: true,
      data: {
        optimizationId,
        status: 'running',
        totalLeads: evaluationLeads.length,
        maxIterations,
        targetScore,
      },
    });
  } catch (error) {
    console.error('Error starting optimization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start optimization' },
      { status: 500 }
    );
  }
}

async function runOptimizationAsync(
  optimizationId: string,
  evaluationLeads: EvaluationLead[],
  maxIterations: number,
  targetScore: number
) {
  try {
    const result = await optimizePrompt(evaluationLeads, {
      maxIterations,
      targetScore,
      onProgress: (current, total, score, phase, details) => {
        const opt = runningOptimizations.get(optimizationId);
        if (opt) {
          opt.progress = {
            current,
            total,
            score,
            phase: phase || (current === 0 ? 'Evaluating Baseline' : `Iteration ${current}/${total}`),
            details: details || '',
          };
        }
      },
    });

    // Save the optimized prompt to database
    const savedPrompt = await db.prompt.create({
      data: {
        name: `Auto-Optimized (${new Date().toLocaleDateString()})`,
        description: `Automatically optimized prompt. Score: ${result.bestPrompt.score.toFixed(1)}%. Improvement: ${result.improvement.toFixed(1)}%`,
        systemPrompt: result.bestPrompt.systemPrompt,
        userPromptTemplate: `Analyze this sales lead:

**Name:** {{name}}
**Job Title:** {{title}}
**Company:** {{company}}
**Company Size:** {{employeeRange}}
**Industry:** {{industry}}

Provide your analysis as JSON only.`,
        isActive: true,
        isDefault: false,
        version: 1,
        avgAccuracy: result.bestPrompt.score,
        avgCost: result.bestPrompt.metrics.avgCostPerLead,
      },
    });

    // Update optimization state
    const opt = runningOptimizations.get(optimizationId);
    if (opt) {
      opt.status = 'completed';
      opt.result = {
        ...result,
        // Add saved prompt ID for reference
        bestPrompt: {
          ...result.bestPrompt,
          // @ts-ignore - adding extra field
          savedPromptId: savedPrompt.id,
        },
      };
    }
  } catch (error) {
    console.error('Optimization failed:', error);

    const opt = runningOptimizations.get(optimizationId);
    if (opt) {
      opt.status = 'failed';
      opt.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }
}

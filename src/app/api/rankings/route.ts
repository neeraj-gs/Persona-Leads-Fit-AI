import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rankLeads } from '@/lib/ai/ranker';
import { PERSONA_SPEC } from '@/lib/ai/prompts';

/**
 * GET /api/rankings
 * Fetch all ranking runs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const [runs, total] = await Promise.all([
      db.rankingRun.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          prompt: true,
          _count: {
            select: { rankings: true },
          },
        },
      }),
      db.rankingRun.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        runs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching ranking runs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ranking runs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rankings
 * Start a new ranking run
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchId, promptId, name } = body;

    // Get leads to rank
    const where = batchId ? { batchId } : {};
    const leads = await db.lead.findMany({ where });

    if (leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No leads found to rank' },
        { status: 400 }
      );
    }

    // Get prompt if specified
    let prompt = null;
    if (promptId) {
      prompt = await db.prompt.findUnique({ where: { id: promptId } });
    }

    // Create ranking run record
    const rankingRun = await db.rankingRun.create({
      data: {
        name: name || `Ranking Run - ${new Date().toISOString()}`,
        status: 'processing',
        totalLeads: leads.length,
        promptId: promptId || null,
        personaSpec: PERSONA_SPEC,
      },
    });

    // Start ranking in background (non-blocking)
    processRankingRun(rankingRun.id, leads, prompt).catch(console.error);

    return NextResponse.json({
      success: true,
      data: {
        runId: rankingRun.id,
        totalLeads: leads.length,
        status: 'processing',
      },
    });
  } catch (error) {
    console.error('Error starting ranking run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start ranking run' },
      { status: 500 }
    );
  }
}

/**
 * Process ranking run in background
 */
async function processRankingRun(
  runId: string,
  leads: Array<{
    id: string;
    accountName: string;
    leadFirstName: string | null;
    leadLastName: string | null;
    leadJobTitle: string | null;
    accountDomain: string | null;
    accountEmployeeRange: string | null;
    accountIndustry: string | null;
  }>,
  prompt: { systemPrompt: string; userPromptTemplate: string } | null
) {
  try {
    // Transform leads to ranker input format
    const leadsInput = leads.map(lead => ({
      id: lead.id,
      name: `${lead.leadFirstName || ''} ${lead.leadLastName || ''}`.trim() || 'Unknown',
      title: lead.leadJobTitle,
      company: lead.accountName,
      employeeRange: lead.accountEmployeeRange,
      industry: lead.accountIndustry,
      domain: lead.accountDomain,
    }));

    // Run ranking
    const { results, totalCost, totalTokens, stats } = await rankLeads(leadsInput, {
      onProgress: async (progress) => {
        // Update progress in database
        await db.rankingRun.update({
          where: { id: runId },
          data: {
            processedLeads: progress.current,
          },
        }).catch(console.error);
      },
    });

    // Save results to database
    const rankingData = results.map(result => ({
      leadId: result.leadId,
      rankingRunId: runId,
      isRelevant: result.isRelevant,
      relevanceScore: result.relevanceScore,
      companyRank: result.companyRank,
      reasoning: result.analysis?.reasoning || result.skipReason || null,
      department: result.analysis?.department || null,
      seniority: result.analysis?.seniority || null,
      buyerType: result.analysis?.buyerType || null,
      companySizeCategory: result.analysis?.companySizeCategory || null,
      positiveSignals: result.analysis?.positiveSignals ? JSON.stringify(result.analysis.positiveSignals) : null,
      negativeSignals: result.analysis?.negativeSignals ? JSON.stringify(result.analysis.negativeSignals) : null,
      aiCost: result.cost,
      tokensUsed: result.tokensUsed,
    }));

    // Insert rankings in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < rankingData.length; i += BATCH_SIZE) {
      const chunk = rankingData.slice(i, i + BATCH_SIZE);
      await db.leadRanking.createMany({ data: chunk });
    }

    // Update ranking run status
    await db.rankingRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        processedLeads: stats.total,
        relevantLeads: stats.relevant,
        totalCost,
        totalTokens,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error processing ranking run:', error);

    // Update status to failed
    await db.rankingRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

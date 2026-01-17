import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runABTest, EvaluationLead } from '@/lib/ai/evaluator';

/**
 * GET /api/ab-tests
 * Fetch all A/B tests
 */
export async function GET() {
  try {
    const tests = await db.promptTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        promptA: true,
        promptB: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch A/B tests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ab-tests
 * Start a new A/B test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptAId, promptBId, evaluationData, name } = body;

    if (!promptAId || !promptBId) {
      return NextResponse.json(
        { success: false, error: 'promptAId and promptBId are required' },
        { status: 400 }
      );
    }

    // Get prompts
    const [promptA, promptB] = await Promise.all([
      db.prompt.findUnique({ where: { id: promptAId } }),
      db.prompt.findUnique({ where: { id: promptBId } }),
    ]);

    if (!promptA || !promptB) {
      return NextResponse.json(
        { success: false, error: 'One or both prompts not found' },
        { status: 404 }
      );
    }

    // Parse evaluation data if provided, otherwise use sample
    let evaluationLeads: EvaluationLead[] = [];

    if (evaluationData && Array.isArray(evaluationData)) {
      evaluationLeads = evaluationData.map((lead: {
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
        expectedRank: lead.rank === '-' || lead.rank === null || lead.rank === undefined
          ? null
          : typeof lead.rank === 'string' ? parseInt(lead.rank) : lead.rank,
      }));
    } else {
      return NextResponse.json(
        { success: false, error: 'evaluationData is required' },
        { status: 400 }
      );
    }

    // Create A/B test record
    const abTest = await db.promptTest.create({
      data: {
        name: name || `A/B Test: ${promptA.name} vs ${promptB.name}`,
        promptAId,
        promptBId,
        status: 'running',
        sampleSize: evaluationLeads.length,
      },
    });

    // Run A/B test in background
    runABTestAsync(abTest.id, promptA, promptB, evaluationLeads).catch(console.error);

    return NextResponse.json({
      success: true,
      data: {
        testId: abTest.id,
        status: 'running',
        sampleSize: evaluationLeads.length,
      },
    });
  } catch (error) {
    console.error('Error starting A/B test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start A/B test' },
      { status: 500 }
    );
  }
}

async function runABTestAsync(
  testId: string,
  promptA: { id: string; name: string; systemPrompt: string },
  promptB: { id: string; name: string; systemPrompt: string },
  evaluationLeads: EvaluationLead[]
) {
  try {
    const result = await runABTest(promptA, promptB, evaluationLeads);

    // Update test record with results
    await db.promptTest.update({
      where: { id: testId },
      data: {
        status: 'completed',
        promptAAccuracy: result.promptA.relevanceAccuracy,
        promptBAccuracy: result.promptB.relevanceAccuracy,
        promptACost: result.promptA.totalCost,
        promptBCost: result.promptB.totalCost,
        winner: result.winner === 'A' ? 'prompt_a' : result.winner === 'B' ? 'prompt_b' : 'tie',
        completedAt: new Date(),
      },
    });

    // Update prompt metrics
    await Promise.all([
      db.prompt.update({
        where: { id: promptA.id },
        data: {
          totalRuns: { increment: 1 },
          avgAccuracy: result.promptA.relevanceF1,
          avgCost: result.promptA.avgCostPerLead,
        },
      }),
      db.prompt.update({
        where: { id: promptB.id },
        data: {
          totalRuns: { increment: 1 },
          avgAccuracy: result.promptB.relevanceF1,
          avgCost: result.promptB.avgCostPerLead,
        },
      }),
    ]);
  } catch (error) {
    console.error('A/B test failed:', error);

    await db.promptTest.update({
      where: { id: testId },
      data: {
        status: 'failed',
      },
    });
  }
}

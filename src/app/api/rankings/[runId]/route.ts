import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ runId: string }>;
}

/**
 * GET /api/rankings/[runId]
 * Get ranking run details and results
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { runId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const includeResults = searchParams.get('includeResults') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const onlyRelevant = searchParams.get('onlyRelevant') === 'true';
    const sortBy = searchParams.get('sortBy') || 'relevanceScore';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get ranking run
    const rankingRun = await db.rankingRun.findUnique({
      where: { id: runId },
      include: {
        prompt: true,
      },
    });

    if (!rankingRun) {
      return NextResponse.json(
        { success: false, error: 'Ranking run not found' },
        { status: 404 }
      );
    }

    // Get results if requested
    let results = null;
    let resultsPagination = null;

    if (includeResults) {
      const where = {
        rankingRunId: runId,
        ...(onlyRelevant && { isRelevant: true }),
      };

      const orderBy = {
        [sortBy]: sortOrder,
      };

      const [rankings, total] = await Promise.all([
        db.leadRanking.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy,
          include: {
            lead: true,
          },
        }),
        db.leadRanking.count({ where }),
      ]);

      results = rankings;
      resultsPagination = {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    // Get company statistics
    const companyStats = await db.leadRanking.groupBy({
      by: ['companySizeCategory'],
      where: { rankingRunId: runId },
      _count: { id: true },
      _avg: { relevanceScore: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        run: rankingRun,
        results,
        pagination: resultsPagination,
        companyStats,
      },
    });
  } catch (error) {
    console.error('Error fetching ranking run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ranking run' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rankings/[runId]
 * Delete a ranking run and its results
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { runId } = await context.params;

    // Delete ranking run (cascades to rankings)
    await db.rankingRun.delete({
      where: { id: runId },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting ranking run:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ranking run' },
      { status: 500 }
    );
  }
}

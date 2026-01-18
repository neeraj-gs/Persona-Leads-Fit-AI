import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getProgress } from '@/lib/progress-store';

/**
 * GET /api/ab-tests/[testId]
 * Fetch a specific A/B test with results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;

    const test = await db.promptTest.findUnique({
      where: { id: testId },
      include: {
        promptA: true,
        promptB: true,
      },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'A/B test not found' },
        { status: 404 }
      );
    }

    // Get progress data if test is running
    const progress = getProgress(`abtest-${testId}`);

    return NextResponse.json({
      success: true,
      data: {
        ...test,
        progress: progress ? {
          status: progress.status,
          current: progress.current,
          total: progress.total,
          phase: progress.phase,
          details: progress.details,
          result: progress.result,
          error: progress.error,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching A/B test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch A/B test' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ab-tests/[testId]
 * Delete an A/B test
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;

    await db.promptTest.delete({
      where: { id: testId },
    });

    return NextResponse.json({
      success: true,
      message: 'A/B test deleted',
    });
  } catch (error) {
    console.error('Error deleting A/B test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete A/B test' },
      { status: 500 }
    );
  }
}

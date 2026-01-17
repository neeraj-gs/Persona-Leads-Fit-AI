import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ runId: string }>;
}

/**
 * GET /api/rankings/[runId]/stream
 * Server-Sent Events stream for ranking progress
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { runId } = await context.params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Poll for updates
      let lastProcessed = 0;
      let isCompleted = false;

      while (!isCompleted) {
        try {
          const run = await db.rankingRun.findUnique({
            where: { id: runId },
            select: {
              status: true,
              totalLeads: true,
              processedLeads: true,
              relevantLeads: true,
              totalCost: true,
              totalTokens: true,
              errorMessage: true,
            },
          });

          if (!run) {
            sendEvent({ type: 'error', message: 'Ranking run not found' });
            break;
          }

          // Send update if progress changed
          if (run.processedLeads !== lastProcessed || run.status === 'completed' || run.status === 'failed') {
            lastProcessed = run.processedLeads;

            sendEvent({
              type: 'progress',
              data: {
                status: run.status,
                totalLeads: run.totalLeads,
                processedLeads: run.processedLeads,
                relevantLeads: run.relevantLeads,
                totalCost: run.totalCost,
                totalTokens: run.totalTokens,
                progress: run.totalLeads > 0 ? (run.processedLeads / run.totalLeads) * 100 : 0,
              },
            });
          }

          if (run.status === 'completed') {
            sendEvent({ type: 'completed', data: run });
            isCompleted = true;
          } else if (run.status === 'failed') {
            sendEvent({ type: 'failed', message: run.errorMessage });
            isCompleted = true;
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Stream error:', error);
          sendEvent({ type: 'error', message: 'Stream error occurred' });
          break;
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

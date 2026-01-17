import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateExportCSV } from '@/lib/utils/csv-parser';

/**
 * GET /api/export
 * Export ranked leads to CSV
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');
    const topN = parseInt(searchParams.get('topN') || '0');
    const includeNonRelevant = searchParams.get('includeNonRelevant') === 'true';

    if (!runId) {
      return NextResponse.json(
        { success: false, error: 'runId is required' },
        { status: 400 }
      );
    }

    // Build query
    const where = {
      rankingRunId: runId,
      ...(!includeNonRelevant && { isRelevant: true }),
    };

    // Get rankings with leads
    let rankings = await db.leadRanking.findMany({
      where,
      orderBy: [
        { relevanceScore: 'desc' },
        { companyRank: 'asc' },
      ],
      include: {
        lead: true,
      },
    });

    // If topN specified, filter to top N per company
    if (topN > 0) {
      const leadsByCompany = new Map<string, typeof rankings>();

      for (const ranking of rankings) {
        const company = ranking.lead.accountName;
        if (!leadsByCompany.has(company)) {
          leadsByCompany.set(company, []);
        }

        const companyLeads = leadsByCompany.get(company)!;
        if (companyLeads.length < topN) {
          companyLeads.push(ranking);
        }
      }

      rankings = Array.from(leadsByCompany.values()).flat();
    }

    // Transform to export format
    const exportData = rankings.map(ranking => ({
      accountName: ranking.lead.accountName,
      leadFirstName: ranking.lead.leadFirstName,
      leadLastName: ranking.lead.leadLastName,
      leadJobTitle: ranking.lead.leadJobTitle,
      accountDomain: ranking.lead.accountDomain,
      accountEmployeeRange: ranking.lead.accountEmployeeRange,
      accountIndustry: ranking.lead.accountIndustry,
      linkedinUrl: ranking.lead.linkedinUrl,
      relevanceScore: ranking.relevanceScore,
      companyRank: ranking.companyRank,
      isRelevant: ranking.isRelevant,
      reasoning: ranking.reasoning,
      buyerType: ranking.buyerType,
      department: ranking.department,
      seniority: ranking.seniority,
    }));

    // Generate CSV
    const csv = generateExportCSV(exportData);

    // Return as downloadable file
    const filename = topN > 0
      ? `ranked-leads-top${topN}-${runId.slice(0, 8)}.csv`
      : `ranked-leads-${runId.slice(0, 8)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export leads' },
      { status: 500 }
    );
  }
}

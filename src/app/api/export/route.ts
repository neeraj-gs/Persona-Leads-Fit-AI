import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateExportCSV } from '@/lib/utils/csv-parser';

/**
 * GET /api/export
 * Export ranked leads to CSV with comprehensive filtering options
 *
 * Query Parameters:
 * - runId: (required) The ranking run ID
 * - leadSelectionMode: 'all' | 'top_per_company' | 'best_per_company'
 * - topLeadsPerCompany: number (when leadSelectionMode is 'top_per_company')
 * - companySelectionMode: 'all' | 'top_by_score' | 'top_by_lead_count'
 * - topCompaniesCount: number (when companySelectionMode is not 'all')
 * - buyerType: 'decision_maker' | 'champion' | 'influencer'
 * - seniority: 'founder' | 'c_level' | 'vp' | 'director' | 'manager'
 * - companySize: 'startup' | 'smb' | 'mid_market' | 'enterprise'
 * - minScore: number (minimum relevance score)
 * - includeNonRelevant: 'true' | 'false'
 *
 * Legacy parameters (for backward compatibility):
 * - topN: number (same as topCompaniesCount with companySelectionMode='top_by_score')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { success: false, error: 'runId is required' },
        { status: 400 }
      );
    }

    // Parse filter parameters
    const leadSelectionMode = searchParams.get('leadSelectionMode') || 'all';
    const topLeadsPerCompany = parseInt(searchParams.get('topLeadsPerCompany') || '3');
    const companySelectionMode = searchParams.get('companySelectionMode') || 'all';
    const topCompaniesCount = parseInt(searchParams.get('topCompaniesCount') || searchParams.get('topN') || '5');
    const buyerTypeFilter = searchParams.get('buyerType') || null;
    const seniorityFilter = searchParams.get('seniority') || null;
    const companySizeFilter = searchParams.get('companySize') || null;
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const includeNonRelevant = searchParams.get('includeNonRelevant') === 'true';

    // Build base query
    const baseWhere: Record<string, unknown> = {
      rankingRunId: runId,
    };

    // Filter by relevance (unless including non-relevant)
    if (!includeNonRelevant) {
      baseWhere.isRelevant = true;
    }

    // Filter by minimum score
    if (minScore > 0) {
      baseWhere.relevanceScore = { gte: minScore };
    }

    // Filter by buyer type
    if (buyerTypeFilter) {
      baseWhere.buyerType = buyerTypeFilter;
    }

    // Filter by seniority
    if (seniorityFilter) {
      baseWhere.seniority = seniorityFilter;
    }

    // Filter by company size
    if (companySizeFilter) {
      baseWhere.companySizeCategory = companySizeFilter;
    }

    // Get rankings with leads
    let rankings = await db.leadRanking.findMany({
      where: baseWhere,
      orderBy: [
        { relevanceScore: 'desc' },
        { companyRank: 'asc' },
      ],
      include: {
        lead: true,
      },
    });

    // Apply company selection filters
    if (companySelectionMode !== 'all') {
      // Group leads by company
      const leadsByCompany = new Map<string, {
        leads: typeof rankings;
        bestScore: number;
        leadCount: number;
      }>();

      for (const ranking of rankings) {
        const company = ranking.lead.accountName;
        if (!leadsByCompany.has(company)) {
          leadsByCompany.set(company, { leads: [], bestScore: 0, leadCount: 0 });
        }

        const companyData = leadsByCompany.get(company)!;
        companyData.leads.push(ranking);
        companyData.leadCount++;
        if (ranking.relevanceScore > companyData.bestScore) {
          companyData.bestScore = ranking.relevanceScore;
        }
      }

      // Sort companies based on selection mode
      let sortedCompanies: [string, typeof leadsByCompany extends Map<string, infer V> ? V : never][];

      if (companySelectionMode === 'top_by_score') {
        // Sort by best lead score, then by lead count as tiebreaker (prefer companies with more contacts)
        sortedCompanies = Array.from(leadsByCompany.entries())
          .sort((a, b) => {
            const scoreDiff = b[1].bestScore - a[1].bestScore;
            if (scoreDiff !== 0) return scoreDiff;
            // Tiebreaker: prefer companies with more leads
            return b[1].leadCount - a[1].leadCount;
          })
          .slice(0, topCompaniesCount);
      } else if (companySelectionMode === 'top_by_lead_count') {
        // Sort by number of leads, then by score as tiebreaker
        sortedCompanies = Array.from(leadsByCompany.entries())
          .sort((a, b) => {
            const countDiff = b[1].leadCount - a[1].leadCount;
            if (countDiff !== 0) return countDiff;
            // Tiebreaker: prefer higher scores
            return b[1].bestScore - a[1].bestScore;
          })
          .slice(0, topCompaniesCount);
      } else {
        sortedCompanies = Array.from(leadsByCompany.entries());
      }

      // Get leads from selected companies
      rankings = sortedCompanies.flatMap(([_, data]) => data.leads);
    }

    // Apply lead selection filters
    if (leadSelectionMode !== 'all') {
      // Re-group by company for lead selection
      const leadsByCompany = new Map<string, typeof rankings>();

      for (const ranking of rankings) {
        const company = ranking.lead.accountName;
        if (!leadsByCompany.has(company)) {
          leadsByCompany.set(company, []);
        }
        leadsByCompany.get(company)!.push(ranking);
      }

      // Sort leads within each company by rank/score
      for (const [_, leads] of leadsByCompany) {
        leads.sort((a, b) => {
          // Sort by company rank first, then by score
          if (a.companyRank && b.companyRank) {
            return a.companyRank - b.companyRank;
          }
          return b.relevanceScore - a.relevanceScore;
        });
      }

      if (leadSelectionMode === 'best_per_company') {
        // Take only the best lead from each company
        rankings = Array.from(leadsByCompany.values()).map(leads => leads[0]).filter(Boolean);
      } else if (leadSelectionMode === 'top_per_company') {
        // Take top N leads from each company
        rankings = Array.from(leadsByCompany.values()).flatMap(leads =>
          leads.slice(0, topLeadsPerCompany)
        );
      }
    }

    // Re-sort final results by score
    rankings.sort((a, b) => {
      // Group by company, then sort by rank within company
      if (a.lead.accountName !== b.lead.accountName) {
        // Sort companies by their best lead score
        return b.relevanceScore - a.relevanceScore;
      }
      // Within company, sort by rank
      if (a.companyRank && b.companyRank) {
        return a.companyRank - b.companyRank;
      }
      return b.relevanceScore - a.relevanceScore;
    });

    // Transform to export format (LinkedIn URL removed for privacy)
    const exportData = rankings.map(ranking => ({
      accountName: ranking.lead.accountName,
      leadFirstName: ranking.lead.leadFirstName,
      leadLastName: ranking.lead.leadLastName,
      leadJobTitle: ranking.lead.leadJobTitle,
      accountDomain: ranking.lead.accountDomain,
      accountEmployeeRange: ranking.lead.accountEmployeeRange,
      accountIndustry: ranking.lead.accountIndustry,
      relevanceScore: ranking.relevanceScore,
      companyRank: ranking.companyRank,
      isRelevant: ranking.isRelevant,
      buyerType: ranking.buyerType,
      department: ranking.department,
      seniority: ranking.seniority,
      reasoning: ranking.reasoning,
    }));

    // Generate CSV
    const csv = generateExportCSV(exportData);

    // Generate descriptive filename
    const filenameParts = ['ranked-leads'];

    if (leadSelectionMode === 'best_per_company') {
      filenameParts.push('best-only');
    } else if (leadSelectionMode === 'top_per_company') {
      filenameParts.push(`top${topLeadsPerCompany}-per-company`);
    }

    if (companySelectionMode === 'top_by_score') {
      filenameParts.push(`top${topCompaniesCount}-companies`);
    } else if (companySelectionMode === 'top_by_lead_count') {
      filenameParts.push(`top${topCompaniesCount}-by-contacts`);
    }

    if (buyerTypeFilter) {
      filenameParts.push(buyerTypeFilter);
    }

    filenameParts.push(runId.slice(0, 8));

    const filename = `${filenameParts.join('-')}.csv`;

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

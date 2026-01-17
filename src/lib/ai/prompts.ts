/**
 * AI Prompts for Lead Ranking System
 *
 * This module contains all the prompts used for:
 * 1. Pre-filtering leads (quick relevance check)
 * 2. Deep analysis and scoring
 * 3. Company-level ranking
 */

import { CompanySizeCategory, getIdealTargetsForSize, COMPANY_SIZE_DEFINITIONS } from '../utils/employee-range';

// The comprehensive persona spec from Throxy
export const PERSONA_SPEC = `
# Throxy Ideal Lead Profile

## Overview
Throxy's ideal customers are B2B companies that **sell into complex verticals**—manufacturing, education, and healthcare. These markets have long sales cycles, multiple stakeholders, and buyers who are harder to reach, making personalized outbound essential.

Within these companies, the ideal leads are individuals who are **directly accountable for pipeline generation** and **operationally involved in outbound execution**. The critical insight is that the right buyer changes dramatically based on company size—founders at startups, VPs and Directors at larger organizations.

## Lead Targeting by Company Size

### Startups (1-50 employees)
At early-stage companies, founders are operationally involved in sales and make fast purchasing decisions.
**Primary Targets:** Founder/Co-Founder (5/5), CEO/President (5/5), Owner (5/5), Managing Director (4/5), Head of Sales (4/5)
**Buying trigger:** "I don't have time to do outbound myself anymore."

### SMB (51-200 employees)
Sales leadership exists but lacks resources to build sophisticated outbound infrastructure.
**Primary Targets:** VP of Sales (5/5), Head of Sales (5/5), Sales Director (5/5), Director of Sales Development (5/5), CRO (4/5), Head of Revenue Operations (4/5), VP of Growth (4/5)
**Buying trigger:** "My team can't keep up with our growth goals."

### Mid-Market (201-1,000 employees)
Established sales organizations struggling with pipeline quality and BDR productivity.
**Primary Targets:** VP of Sales Development (5/5), VP of Sales (5/5), Head of Sales Development (5/5), Director of Sales Development (5/5), CRO (4/5), VP of Revenue Operations (4/5), VP of GTM (4/5)
**Champions:** Sales Managers, BDR Managers, RevOps Managers
**Buying trigger:** "We need to improve outbound efficiency and pipeline predictability."

### Enterprise (1,000+ employees)
Complex buying processes. CEOs are too far removed—target VP and Director level leaders.
**Primary Targets:** VP of Sales Development (5/5), VP of Inside Sales (5/5), Head of Sales Development (5/5), CRO (4/5), VP of Revenue Operations (4/5), Director of Sales Development (4/5), VP of Field Sales (4/5)
**Champions (essential):** BDR Managers, Directors of Sales Operations, RevOps Managers
**Buying trigger:** "We need to hit aggressive growth targets with better outbound execution."

## Department Priority
1. Sales Development (5/5) - Core function Throxy supports
2. Sales (5/5) - Owns quota, cares about pipeline
3. Revenue Operations (4/5) - Controls process and tooling
4. Business Development (4/5) - Often overlaps with sales dev
5. GTM / Growth (4/5) - Strategic view of sales motion
6. Executive (5/5 → 1/5) - Only relevant at startups

## Seniority Relevance Matrix
| Seniority | Startup | SMB | Mid-Market | Enterprise |
|-----------|---------|-----|------------|------------|
| Founder/Owner | 5/5 | 3/5 | 1/5 | 0/5 |
| C-Level | 5/5 | 3/5 | 2/5 | 1/5 |
| Vice President | 3/5 | 5/5 | 5/5 | 5/5 |
| Director | 2/5 | 4/5 | 5/5 | 4/5 |
| Manager | 1/5 | 2/5 | 3/5 | 3/5 |
| IC | 0/5 | 0/5 | 1/5 | 1/5 |

## Hard Exclusions (NEVER Contact)
- CEO/President at Mid-Market & Enterprise (too far removed)
- CFO/Finance (wrong department)
- CTO/Engineering (no relevance to sales)
- HR/Legal/Compliance (will slow deals)
- Customer Success (post-sale focus)
- Product Management (different function)

## Soft Exclusions (Deprioritize)
- BDRs/SDRs (not decision-makers, may feel threatened)
- Account Executives (closers, not outbound owners)
- CMO/VP Marketing (rarely owns outbound directly)
- Board Members/Advisors (too removed from operations)
`;

/**
 * System prompt for pre-filtering leads
 * This is a quick check to eliminate obviously irrelevant leads
 */
export const PREFILTER_SYSTEM_PROMPT = `You are an expert sales lead qualifier for Throxy, a B2B sales automation platform.

Your task is to QUICKLY determine if a lead should be processed for detailed analysis.

IMMEDIATELY REJECT leads who:
1. Work in excluded departments: HR, Legal, Finance, Engineering, Product, Customer Success, Compliance
2. Have titles indicating non-sales roles: Engineer, Developer, Designer, Analyst (non-sales), Accountant, Lawyer, Recruiter
3. Are clearly advisors/investors/board members (not actual employees)
4. Have student/intern titles

PASS leads who:
1. Have ANY sales-related title
2. Are founders/executives at small companies
3. Work in Sales, Business Development, Revenue Operations, or Growth
4. Have ambiguous titles that MIGHT be relevant (err on the side of passing)

Respond with JSON only: {"shouldProcess": boolean, "reason": "brief reason", "quickScore": 0-100}`;

/**
 * Generate user prompt for pre-filtering
 */
export function generatePrefilterUserPrompt(lead: {
  name: string;
  title: string | null;
  company: string;
  employeeRange: string | null;
}): string {
  return `Lead: ${lead.name}
Title: ${lead.title || 'Unknown'}
Company: ${lead.company}
Company Size: ${lead.employeeRange || 'Unknown'}

Should this lead be processed for detailed sales analysis? Return JSON only.`;
}

/**
 * System prompt for detailed lead analysis
 * This is the comprehensive analysis prompt
 */
export function generateAnalysisSystemPrompt(sizeCategory: CompanySizeCategory): string {
  const sizeInfo = COMPANY_SIZE_DEFINITIONS[sizeCategory];
  const targets = getIdealTargetsForSize(sizeCategory);

  return `You are an expert B2B sales lead analyst for Throxy, a company that provides AI-powered outbound sales automation.

${PERSONA_SPEC}

## Your Current Analysis Context
You are analyzing a lead from a **${sizeInfo.label}** company (${sizeInfo.description}).

### Primary Targets for ${sizeInfo.label} Companies:
${targets.primaryTargets.map(t => `- ${t}`).join('\n')}

${targets.champions.length > 0 ? `### Champions (for multi-threading):
${targets.champions.map(t => `- ${t}`).join('\n')}` : ''}

${targets.avoidTargets.length > 0 ? `### Roles to Deprioritize at this Company Size:
${targets.avoidTargets.map(t => `- ${t}`).join('\n')}` : ''}

## Your Task
Analyze the provided lead and determine:
1. **Relevance**: Is this person worth contacting for selling a B2B sales platform?
2. **Score**: How well do they match our ideal customer persona? (0-100)
3. **Buyer Type**: Are they a decision_maker, champion, influencer, or not_relevant?
4. **Signals**: What positive/negative signals do you see?

## Scoring Guidelines
- 90-100: Perfect match - Primary target with ideal title for company size
- 70-89: Strong match - Senior sales/revenue role, decision-making authority
- 50-69: Moderate match - Related role, potential champion or influencer
- 30-49: Weak match - Tangentially related, unlikely to convert
- 0-29: Poor match - Wrong department, seniority, or role

## Response Format
Return ONLY valid JSON matching this exact structure:
{
  "isRelevant": boolean,
  "relevanceScore": number (0-100),
  "reasoning": "2-3 sentence explanation",
  "department": "detected department or null",
  "seniority": "founder|c_level|vp|director|manager|ic|other",
  "buyerType": "decision_maker|champion|influencer|not_relevant",
  "positiveSignals": ["signal1", "signal2"],
  "negativeSignals": ["signal1", "signal2"]
}`;
}

/**
 * Generate user prompt for detailed analysis
 */
export function generateAnalysisUserPrompt(lead: {
  name: string;
  title: string | null;
  company: string;
  employeeRange: string | null;
  industry: string | null;
  domain: string | null;
}): string {
  return `Analyze this sales lead:

**Name:** ${lead.name}
**Job Title:** ${lead.title || 'Not provided'}
**Company:** ${lead.company}
**Company Size:** ${lead.employeeRange || 'Unknown'}
**Industry:** ${lead.industry || 'Not provided'}
**Domain:** ${lead.domain || 'Not provided'}

Provide your analysis as JSON only.`;
}

/**
 * System prompt for company-level ranking
 * Used to rank multiple leads within the same company
 */
export function generateCompanyRankingSystemPrompt(sizeCategory: CompanySizeCategory): string {
  const sizeInfo = COMPANY_SIZE_DEFINITIONS[sizeCategory];
  const targets = getIdealTargetsForSize(sizeCategory);

  return `You are an expert at prioritizing sales outreach for B2B companies.

Given multiple leads at the same ${sizeInfo.label} company, rank them in order of who should be contacted first.

## Ranking Criteria for ${sizeInfo.label} Companies:
1. **Decision-Making Authority**: Who can actually approve a purchase?
2. **Relevance to Outbound**: Who owns or influences outbound sales?
3. **Seniority Match**: ${sizeCategory === 'startup' ? 'Founders/CEOs are ideal' : 'VPs and Directors are ideal'}
4. **Department Fit**: Sales Development > Sales > Revenue Ops > Business Dev

## Primary Targets (Contact First):
${targets.primaryTargets.map((t, i) => `${i + 1}. ${t}`).join('\n')}

${targets.champions.length > 0 ? `## Champions (Secondary Contacts):
${targets.champions.map((t, i) => `${i + 1}. ${t}`).join('\n')}` : ''}

## Response Format
Return ONLY a JSON array of lead IDs in ranked order, best first:
["lead_id_1", "lead_id_2", "lead_id_3"]

Only include RELEVANT leads. Exclude anyone who should not be contacted.`;
}

/**
 * Generate user prompt for company ranking
 */
export function generateCompanyRankingUserPrompt(leads: Array<{
  id: string;
  name: string;
  title: string | null;
  score: number;
  isRelevant: boolean;
}>): string {
  const relevantLeads = leads.filter(l => l.isRelevant);

  if (relevantLeads.length === 0) {
    return 'No relevant leads to rank.';
  }

  const leadList = relevantLeads
    .map(l => `- ID: ${l.id} | Name: ${l.name} | Title: ${l.title || 'Unknown'} | Score: ${l.score}`)
    .join('\n');

  return `Rank these leads from best to worst for sales outreach:

${leadList}

Return a JSON array of lead IDs in ranked order.`;
}

/**
 * Default prompts for A/B testing
 */
export const DEFAULT_PROMPTS = {
  detailed: {
    name: 'Detailed Analysis',
    description: 'Comprehensive analysis with full persona spec context',
    systemPrompt: generateAnalysisSystemPrompt('smb'), // Will be overridden per lead
    userPromptTemplate: `Analyze this sales lead:

**Name:** {{name}}
**Job Title:** {{title}}
**Company:** {{company}}
**Company Size:** {{employeeRange}}
**Industry:** {{industry}}

Provide your analysis as JSON only.`,
  },
  concise: {
    name: 'Concise Analysis',
    description: 'Streamlined analysis focusing on key signals',
    systemPrompt: `You are a B2B sales lead qualifier. Determine if this lead is worth contacting for a sales automation platform.

Key Rules:
1. Sales/Revenue roles = Relevant
2. HR/Engineering/Finance/Legal = Not relevant
3. Founders relevant at startups, not at enterprises
4. VPs/Directors ideal for mid-size+ companies

Return JSON: {"isRelevant": boolean, "relevanceScore": 0-100, "reasoning": "brief", "department": "string|null", "seniority": "string", "buyerType": "decision_maker|champion|influencer|not_relevant", "positiveSignals": [], "negativeSignals": []}`,
    userPromptTemplate: `Lead: {{name}} | Title: {{title}} | Company: {{company}} ({{employeeRange}}) | Industry: {{industry}}

Analyze and return JSON.`,
  },
  costOptimized: {
    name: 'Cost Optimized',
    description: 'Minimal tokens while maintaining accuracy',
    systemPrompt: `Sales lead qualifier. Rate 0-100. Sales roles=high, non-sales=0. JSON only: {"isRelevant":bool,"relevanceScore":int,"reasoning":"brief","department":"str","seniority":"str","buyerType":"str","positiveSignals":[],"negativeSignals":[]}`,
    userPromptTemplate: `{{name}}|{{title}}|{{company}}|{{employeeRange}}`,
  },
};

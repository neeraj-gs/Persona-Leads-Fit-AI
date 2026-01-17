/**
 * Company size categorization based on employee count
 * Used to determine which personas are relevant for each company
 */

export type CompanySizeCategory = 'startup' | 'smb' | 'mid_market' | 'enterprise';

export interface CompanySizeInfo {
  category: CompanySizeCategory;
  minEmployees: number;
  maxEmployees: number | null;
  label: string;
  description: string;
}

export const COMPANY_SIZE_DEFINITIONS: Record<CompanySizeCategory, CompanySizeInfo> = {
  startup: {
    category: 'startup',
    minEmployees: 1,
    maxEmployees: 50,
    label: 'Startup',
    description: 'Early-stage companies where founders are operationally involved in sales',
  },
  smb: {
    category: 'smb',
    minEmployees: 51,
    maxEmployees: 200,
    label: 'SMB',
    description: 'Sales leadership exists but lacks resources for sophisticated outbound',
  },
  mid_market: {
    category: 'mid_market',
    minEmployees: 201,
    maxEmployees: 1000,
    label: 'Mid-Market',
    description: 'Established sales organizations with multiple stakeholders',
  },
  enterprise: {
    category: 'enterprise',
    minEmployees: 1001,
    maxEmployees: null,
    label: 'Enterprise',
    description: 'Complex buying processes with VP and Director level decision makers',
  },
};

/**
 * Parse employee range string and determine company size category
 */
export function parseEmployeeRange(range: string | null | undefined): {
  category: CompanySizeCategory;
  minEmployees: number;
  maxEmployees: number | null;
  rawRange: string;
} {
  if (!range) {
    return {
      category: 'startup',
      minEmployees: 1,
      maxEmployees: 50,
      rawRange: 'unknown',
    };
  }

  const normalizedRange = range.trim().toLowerCase();

  // Handle common patterns
  const patterns: Array<{
    pattern: RegExp | string[];
    category: CompanySizeCategory;
    min: number;
    max: number | null;
  }> = [
    // Exact matches for common ranges
    { pattern: ['1-10', '2-10', '1-50'], category: 'startup', min: 1, max: 50 },
    { pattern: ['11-50'], category: 'startup', min: 11, max: 50 },
    { pattern: ['51-200'], category: 'smb', min: 51, max: 200 },
    { pattern: ['201-500', '201-1000'], category: 'mid_market', min: 201, max: 1000 },
    { pattern: ['501-1000'], category: 'mid_market', min: 501, max: 1000 },
    { pattern: ['1001-5000'], category: 'enterprise', min: 1001, max: 5000 },
    { pattern: ['5001-10000'], category: 'enterprise', min: 5001, max: 10000 },
    { pattern: ['10001+', '10000+'], category: 'enterprise', min: 10001, max: null },
  ];

  // Check exact matches
  for (const { pattern, category, min, max } of patterns) {
    if (Array.isArray(pattern)) {
      if (pattern.includes(normalizedRange)) {
        return { category, minEmployees: min, maxEmployees: max, rawRange: range };
      }
    }
  }

  // Try to parse numeric range like "X-Y" or "X+"
  const rangeMatch = normalizedRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);

    if (max <= 50) return { category: 'startup', minEmployees: min, maxEmployees: max, rawRange: range };
    if (max <= 200) return { category: 'smb', minEmployees: min, maxEmployees: max, rawRange: range };
    if (max <= 1000) return { category: 'mid_market', minEmployees: min, maxEmployees: max, rawRange: range };
    return { category: 'enterprise', minEmployees: min, maxEmployees: max, rawRange: range };
  }

  // Handle "X+" pattern
  const plusMatch = normalizedRange.match(/(\d+)\+/);
  if (plusMatch) {
    const min = parseInt(plusMatch[1], 10);
    if (min <= 50) return { category: 'startup', minEmployees: min, maxEmployees: null, rawRange: range };
    if (min <= 200) return { category: 'smb', minEmployees: min, maxEmployees: null, rawRange: range };
    if (min <= 1000) return { category: 'mid_market', minEmployees: min, maxEmployees: null, rawRange: range };
    return { category: 'enterprise', minEmployees: min, maxEmployees: null, rawRange: range };
  }

  // Default to startup for unknown
  return {
    category: 'startup',
    minEmployees: 1,
    maxEmployees: 50,
    rawRange: range,
  };
}

/**
 * Get the ideal targets for a given company size
 */
export function getIdealTargetsForSize(category: CompanySizeCategory): {
  primaryTargets: string[];
  champions: string[];
  avoidTargets: string[];
} {
  switch (category) {
    case 'startup':
      return {
        primaryTargets: [
          'Founder',
          'Co-Founder',
          'CEO',
          'President',
          'Owner',
          'Co-Owner',
          'Managing Director',
          'Head of Sales',
        ],
        champions: [],
        avoidTargets: [],
      };

    case 'smb':
      return {
        primaryTargets: [
          'VP of Sales',
          'Head of Sales',
          'Sales Director',
          'Director of Sales Development',
          'CRO',
          'Chief Revenue Officer',
          'Head of Revenue Operations',
          'VP of Growth',
        ],
        champions: ['Sales Manager', 'BDR Manager'],
        avoidTargets: ['CEO', 'President', 'Founder'], // Less relevant at this size
      };

    case 'mid_market':
      return {
        primaryTargets: [
          'VP of Sales Development',
          'VP of Sales',
          'Head of Sales Development',
          'Director of Sales Development',
          'CRO',
          'Chief Revenue Officer',
          'VP of Revenue Operations',
          'VP of GTM',
        ],
        champions: ['Sales Manager', 'BDR Manager', 'RevOps Manager'],
        avoidTargets: ['CEO', 'President', 'Founder'],
      };

    case 'enterprise':
      return {
        primaryTargets: [
          'VP of Sales Development',
          'VP of Inside Sales',
          'Head of Sales Development',
          'CRO',
          'Chief Revenue Officer',
          'VP of Revenue Operations',
          'Director of Sales Development',
          'VP of Field Sales',
        ],
        champions: ['BDR Manager', 'Director of Sales Operations', 'RevOps Manager'],
        avoidTargets: ['CEO', 'President', 'Founder', 'CFO', 'CTO'],
      };
  }
}

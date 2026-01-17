/**
 * CSV Parser for Lead Data
 *
 * Handles parsing of CSV files with various column formats
 */

import Papa from 'papaparse';
import type { CSVLeadRow } from '@/types';

export interface ParsedLead {
  accountName: string;
  leadFirstName: string | null;
  leadLastName: string | null;
  leadJobTitle: string | null;
  accountDomain: string | null;
  accountEmployeeRange: string | null;
  accountIndustry: string | null;
  linkedinUrl: string | null;
}

/**
 * Parse CSV content and extract lead data
 */
export function parseCSV(content: string): {
  leads: ParsedLead[];
  errors: string[];
} {
  const result = Papa.parse<CSVLeadRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const errors: string[] = [];
  const leads: ParsedLead[] = [];

  if (result.errors.length > 0) {
    result.errors.forEach((err) => {
      errors.push(`Row ${err.row}: ${err.message}`);
    });
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];

    try {
      const lead = parseRow(row, i + 2); // +2 for 1-indexed and header row
      if (lead) {
        leads.push(lead);
      }
    } catch (err) {
      errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { leads, errors };
}

/**
 * Parse a single CSV row
 * Handles both standard format and evaluation set format
 */
function parseRow(row: CSVLeadRow, rowNumber: number): ParsedLead | null {
  // Determine format and extract data
  let accountName: string;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let jobTitle: string | null = null;
  let domain: string | null = null;
  let employeeRange: string | null = null;
  let industry: string | null = null;
  let linkedinUrl: string | null = null;

  // Standard format (leads.csv)
  if (row.account_name) {
    accountName = row.account_name.trim();
    firstName = row.lead_first_name?.trim() || null;
    lastName = row.lead_last_name?.trim() || null;
    jobTitle = row.lead_job_title?.trim() || null;
    domain = row.account_domain?.trim() || null;
    employeeRange = row.account_employee_range?.trim() || null;
    industry = row.account_industry?.trim() || null;
  }
  // Evaluation set format
  else if (row.Company) {
    accountName = row.Company.trim();

    // Parse full name into first/last
    const fullName = row['Full Name']?.trim() || '';
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else if (nameParts.length === 1) {
      firstName = nameParts[0];
    }

    jobTitle = row.Title?.trim() || null;
    employeeRange = row['Employee Range']?.trim() || null;
    linkedinUrl = row.LI?.trim() || null;
  } else {
    // Unknown format - try to extract what we can
    const keys = Object.keys(row);
    const companyKey = keys.find(k =>
      k.toLowerCase().includes('company') ||
      k.toLowerCase().includes('account')
    );

    if (!companyKey) {
      throw new Error('Could not find company/account name column');
    }

    accountName = (row as unknown as Record<string, string>)[companyKey]?.trim() || '';

    // Try to find other fields
    const titleKey = keys.find(k =>
      k.toLowerCase().includes('title') ||
      k.toLowerCase().includes('job')
    );
    if (titleKey) {
      jobTitle = (row as unknown as Record<string, string>)[titleKey]?.trim() || null;
    }

    const nameKey = keys.find(k =>
      k.toLowerCase().includes('name') &&
      !k.toLowerCase().includes('account') &&
      !k.toLowerCase().includes('company')
    );
    if (nameKey) {
      const name = (row as unknown as Record<string, string>)[nameKey]?.trim() || '';
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        firstName = nameParts[0];
      }
    }

    const sizeKey = keys.find(k =>
      k.toLowerCase().includes('employee') ||
      k.toLowerCase().includes('size')
    );
    if (sizeKey) {
      employeeRange = (row as unknown as Record<string, string>)[sizeKey]?.trim() || null;
    }
  }

  // Validate required fields
  if (!accountName) {
    throw new Error('Missing company/account name');
  }

  return {
    accountName,
    leadFirstName: firstName,
    leadLastName: lastName,
    leadJobTitle: jobTitle,
    accountDomain: domain,
    accountEmployeeRange: employeeRange,
    accountIndustry: industry,
    linkedinUrl,
  };
}

/**
 * Validate CSV file before processing
 */
export function validateCSV(content: string): {
  isValid: boolean;
  rowCount: number;
  columns: string[];
  errors: string[];
} {
  const result = Papa.parse(content, {
    header: true,
    preview: 5, // Just preview first 5 rows
  });

  const columns = result.meta.fields || [];
  const errors: string[] = [];

  // Check for required columns
  const hasStandardFormat =
    columns.some(c => c.toLowerCase().includes('account_name')) ||
    columns.some(c => c.toLowerCase().includes('company'));

  if (!hasStandardFormat) {
    errors.push('CSV must have either "account_name" or "Company" column');
  }

  // Full parse for row count
  const fullResult = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });

  return {
    isValid: errors.length === 0,
    rowCount: fullResult.data.length,
    columns,
    errors,
  };
}

/**
 * Generate CSV from ranked leads
 */
export function generateExportCSV(
  leads: Array<{
    accountName: string;
    leadFirstName: string | null;
    leadLastName: string | null;
    leadJobTitle: string | null;
    accountDomain: string | null;
    accountEmployeeRange: string | null;
    accountIndustry: string | null;
    linkedinUrl: string | null;
    relevanceScore: number;
    companyRank: number | null;
    isRelevant: boolean;
    reasoning: string | null;
    buyerType: string | null;
    department: string | null;
    seniority: string | null;
  }>
): string {
  const headers = [
    'Company',
    'First Name',
    'Last Name',
    'Job Title',
    'Domain',
    'Employee Range',
    'Industry',
    'LinkedIn URL',
    'Relevance Score',
    'Company Rank',
    'Is Relevant',
    'Buyer Type',
    'Department',
    'Seniority',
    'Reasoning',
  ];

  const rows = leads.map(lead => [
    lead.accountName,
    lead.leadFirstName || '',
    lead.leadLastName || '',
    lead.leadJobTitle || '',
    lead.accountDomain || '',
    lead.accountEmployeeRange || '',
    lead.accountIndustry || '',
    lead.linkedinUrl || '',
    lead.relevanceScore.toString(),
    lead.companyRank?.toString() || '-',
    lead.isRelevant ? 'Yes' : 'No',
    lead.buyerType || '',
    lead.department || '',
    lead.seniority || '',
    lead.reasoning || '',
  ]);

  return Papa.unparse({
    fields: headers,
    data: rows,
  });
}

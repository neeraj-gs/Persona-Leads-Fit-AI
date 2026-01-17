import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseCSV, validateCSV } from '@/lib/utils/csv-parser';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/leads
 * Fetch all leads with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const search = searchParams.get('search') || '';
    const batchId = searchParams.get('batchId') || undefined;

    const where = {
      ...(batchId && { batchId }),
      ...(search && {
        OR: [
          { accountName: { contains: search } },
          { leadFirstName: { contains: search } },
          { leadLastName: { contains: search } },
          { leadJobTitle: { contains: search } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          rankings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      db.lead.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Upload new leads from CSV
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const content = await file.text();

    // Validate CSV
    const validation = validateCSV(content);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid CSV format',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Parse CSV
    const { leads: parsedLeads, errors: parseErrors } = parseCSV(content);

    if (parsedLeads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid leads found in CSV',
          details: parseErrors,
        },
        { status: 400 }
      );
    }

    // Create batch ID for this upload
    const batchId = uuidv4();

    // Create upload batch record
    const batch = await db.uploadBatch.create({
      data: {
        id: batchId,
        fileName: file.name,
        totalRows: parsedLeads.length,
        status: 'processing',
      },
    });

    // Insert leads in batches of 100
    const BATCH_SIZE = 100;
    let processedCount = 0;

    for (let i = 0; i < parsedLeads.length; i += BATCH_SIZE) {
      const chunk = parsedLeads.slice(i, i + BATCH_SIZE);

      await db.lead.createMany({
        data: chunk.map(lead => ({
          ...lead,
          batchId,
        })),
      });

      processedCount += chunk.length;
    }

    // Update batch status
    await db.uploadBatch.update({
      where: { id: batchId },
      data: {
        processedRows: processedCount,
        status: 'completed',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        fileName: file.name,
        totalLeads: parsedLeads.length,
        parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
      },
    });
  } catch (error) {
    console.error('Error uploading leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload leads' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads
 * Delete leads by batch ID or all leads
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const batchId = searchParams.get('batchId');

    if (batchId) {
      // Delete leads from specific batch
      const result = await db.lead.deleteMany({
        where: { batchId },
      });

      // Delete the batch record
      await db.uploadBatch.delete({
        where: { id: batchId },
      }).catch(() => {}); // Ignore if doesn't exist

      return NextResponse.json({
        success: true,
        data: { deletedCount: result.count },
      });
    } else {
      // Delete all leads (dangerous - requires confirmation)
      const confirm = searchParams.get('confirm');
      if (confirm !== 'true') {
        return NextResponse.json(
          { success: false, error: 'Confirmation required. Add ?confirm=true to delete all leads.' },
          { status: 400 }
        );
      }

      const result = await db.lead.deleteMany({});
      await db.uploadBatch.deleteMany({});

      return NextResponse.json({
        success: true,
        data: { deletedCount: result.count },
      });
    }
  } catch (error) {
    console.error('Error deleting leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete leads' },
      { status: 500 }
    );
  }
}

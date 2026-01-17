import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_PROMPTS } from '@/lib/ai/prompts';

/**
 * GET /api/prompts
 * Fetch all prompts
 */
export async function GET() {
  try {
    const prompts = await db.prompt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { rankingRuns: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: prompts,
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts
 * Create a new prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, systemPrompt, userPromptTemplate, isDefault } = body;

    if (!name || !systemPrompt || !userPromptTemplate) {
      return NextResponse.json(
        { success: false, error: 'name, systemPrompt, and userPromptTemplate are required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.prompt.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const prompt = await db.prompt.create({
      data: {
        name,
        description,
        systemPrompt,
        userPromptTemplate,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/prompts - Seed default prompts
 */
export async function PUT() {
  try {
    const existingPrompts = await db.prompt.count();

    if (existingPrompts > 0) {
      return NextResponse.json({
        success: true,
        data: { message: 'Prompts already exist', seeded: false },
      });
    }

    // Seed default prompts
    const prompts = await Promise.all([
      db.prompt.create({
        data: {
          name: DEFAULT_PROMPTS.detailed.name,
          description: DEFAULT_PROMPTS.detailed.description,
          systemPrompt: DEFAULT_PROMPTS.detailed.systemPrompt,
          userPromptTemplate: DEFAULT_PROMPTS.detailed.userPromptTemplate,
          isDefault: true,
        },
      }),
      db.prompt.create({
        data: {
          name: DEFAULT_PROMPTS.concise.name,
          description: DEFAULT_PROMPTS.concise.description,
          systemPrompt: DEFAULT_PROMPTS.concise.systemPrompt,
          userPromptTemplate: DEFAULT_PROMPTS.concise.userPromptTemplate,
        },
      }),
      db.prompt.create({
        data: {
          name: DEFAULT_PROMPTS.costOptimized.name,
          description: DEFAULT_PROMPTS.costOptimized.description,
          systemPrompt: DEFAULT_PROMPTS.costOptimized.systemPrompt,
          userPromptTemplate: DEFAULT_PROMPTS.costOptimized.userPromptTemplate,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { message: 'Default prompts seeded', seeded: true, prompts },
    });
  } catch (error) {
    console.error('Error seeding prompts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed prompts' },
      { status: 500 }
    );
  }
}

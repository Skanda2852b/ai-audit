import { NextResponse } from 'next/server';
import { runAudit } from '@/lib/auditEngine';
import { db } from '@/lib/db';
import { ToolInput } from '@/types';

export async function POST(req: Request) {
  try {
    const body: ToolInput = await req.json();

    // Validate input
    if (!body.tools || !Array.isArray(body.tools) || body.tools.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one tool.' },
        { status: 400 }
      );
    }

    for (const tool of body.tools) {
      if (!tool.name || !tool.plan || tool.seats < 1 || tool.monthlySpend < 0) {
        return NextResponse.json(
          { error: `Invalid tool entry: ${JSON.stringify(tool)}` },
          { status: 400 }
        );
      }
    }

    // Run the audit engine
    const audit = runAudit(body);

    // Store shareable version (no PII)
    const toolsSummary = body.tools.map((t) => ({
      name: t.name,
      plan: t.plan,
      seats: t.seats,
    }));

    const sharedAudit = await db.sharedAudit.create({
      data: {
        auditData: JSON.stringify(audit),
        toolsSummary: JSON.stringify(toolsSummary),
        useCase: body.primaryUseCase,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const shareableUrl = baseUrl
      ? `${baseUrl}/result/${sharedAudit.id}`
      : `/result/${sharedAudit.id}`;

    return NextResponse.json({
      ...audit,
      shareableId: sharedAudit.id,
      shareableUrl,
    });
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

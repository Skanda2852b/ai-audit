import { NextResponse } from 'next/server';
import { generateSummary, getFallbackSummary } from '@/lib/llm';

export async function POST(req: Request) {
  try {
    const { auditData } = await req.json();

    if (!auditData) {
      return NextResponse.json(
        { error: 'Audit data is required.' },
        { status: 400 }
      );
    }

    let summary: string;

    try {
      summary = await generateSummary(auditData);
    } catch {
      // Fallback to template summary if LLM fails
      summary = getFallbackSummary(auditData);
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('LLM Summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary.' },
      { status: 500 }
    );
  }
}

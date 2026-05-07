import { NextResponse } from 'next/server';
import { captureLeadAndNotify } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, company, role, teamSize, auditId, monthlySavings, shareableUrl, website } = body;

    // Honeypot check – "website" field should be empty
    if (website) {
      return NextResponse.json({ error: 'Bot detected' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const result = await captureLeadAndNotify({
      email,
      company,
      role,
      teamSize,
      auditId,
      monthlySavings,
      shareableUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Capture API error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

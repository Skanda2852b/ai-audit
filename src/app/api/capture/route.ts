import { NextResponse } from 'next/server';
import { captureLeadAndNotify } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      company,
      role,
      teamSize,
      auditId,
      monthlySavings,
      shareableUrl,
      website,
      notifyMode,
    } = body;

    // Honeypot check — "website" field should be empty (hidden from real users)
    if (website) {
      // Silently accept to not alert bots
      return NextResponse.json({ success: true, emailDelivered: false });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const isNotify = notifyMode === true;

    const result = await captureLeadAndNotify({
      email,
      company,
      role,
      teamSize,
      auditId,
      monthlySavings,
      shareableUrl,
      isNotify,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emailDelivered: result.emailDelivered ?? false,
      emailMethod: result.emailMethod ?? null,
    });
  } catch (error) {
    console.error('Capture API error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

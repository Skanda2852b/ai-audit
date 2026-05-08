import { NextResponse } from 'next/server';
import { captureLeadAndNotify } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // Rate limit: 5 lead captures per IP per hour (prevents email spam)
  const ip = getClientIp(req);
  const rl = rateLimit(`capture:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfterSeconds} seconds before trying again.` },
      { status: 429 }
    );
  }

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

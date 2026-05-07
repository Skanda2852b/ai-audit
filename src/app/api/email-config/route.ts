import { NextResponse } from 'next/server';

/**
 * Check if email delivery is configured on the server.
 * Returns which method is available so the UI can adapt.
 */
export async function GET() {
  const hasResend = !!(process.env.RESEND_API_KEY);
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const configured = hasResend || hasSmtp;
  const method = hasResend ? 'resend' : hasSmtp ? 'smtp' : null;

  return NextResponse.json({
    configured,
    method,
  });
}

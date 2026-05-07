import { db } from '@/lib/db';

/**
 * Send an email with the audit report.
 *
 * In development/without an email API key, this logs to console.
 * In production, integrate with Resend, SendGrid, or any email provider
 * by setting the RESEND_API_KEY environment variable.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AI Spend Audit <audit@yourdomain.com>',
          to,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Resend API error:', err);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  // Fallback: log to console in development
  console.log('📧 Email would be sent:', { to, subject, htmlPreview: html.substring(0, 100) + '...' });
  return true;
}

/**
 * Store a lead in the database and optionally send email.
 */
export async function captureLeadAndNotify({
  email,
  company,
  role,
  teamSize,
  auditId,
  monthlySavings,
  shareableUrl,
}: {
  email: string;
  company?: string;
  role?: string;
  teamSize?: number;
  auditId?: string;
  monthlySavings?: number;
  shareableUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.lead.create({
      data: {
        email,
        company: company ?? null,
        role: role ?? null,
        teamSize: teamSize ?? null,
        auditId: auditId ?? null,
        monthlySavings: monthlySavings ?? null,
      },
    });

    if (shareableUrl) {
      await sendEmail({
        to: email,
        subject: 'Your AI Spend Audit Report',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Your AI Spend Audit Report</h1>
            <p>Thanks for using AI Spend Audit! Here's your personalized report:</p>
            <a href="${shareableUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Your Report
            </a>
            ${monthlySavings && monthlySavings > 500 ? '<p style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px;">💡 With over $500/month in potential savings, a specialist could help you access enterprise discount programs. Reply to this email to schedule a free consultation.</p>' : ''}
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">No contract changes needed — most optimizations take 5 minutes in your billing dashboard.</p>
          </div>
        `,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Lead capture failed:', error);
    return { success: false, error: 'Failed to save lead information' };
  }
}

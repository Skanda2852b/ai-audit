import { db } from '@/lib/db';

/**
 * Send an email with the audit report.
 *
 * In development/without an email API key, this logs to console.
 * In production, integrate with Resend by setting the RESEND_API_KEY env var.
 *
 * Abuse protection: We use a honeypot field — a hidden "website" input that
 * real users never see but bots auto-fill. Both client and server check it.
 * We chose honeypot over rate limiting because: (1) it requires no external
 * service like Redis, (2) it's invisible to real users, and (3) it blocks
 * the most common automated submissions without adding friction. Documented
 * in ARCHITECTURE.md.
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
  isNotify = false,
}: {
  email: string;
  company?: string;
  role?: string;
  teamSize?: number;
  auditId?: string;
  monthlySavings?: number;
  shareableUrl?: string;
  isNotify?: boolean;
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

    if (shareableUrl && !isNotify) {
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
            ${monthlySavings && monthlySavings > 500 ? '<p style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px;">With over $500/month in potential savings, a Credex specialist can help you access enterprise discount programs. Reply to this email to schedule a free consultation.</p>' : ''}
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">No contract changes needed — most optimizations take 5 minutes in your billing dashboard.</p>
          </div>
        `,
      });
    }

    if (isNotify) {
      await sendEmail({
        to: email,
        subject: 'You\'re on the AI Spend Audit watch list',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">You\'re on the list!</h1>
            <p>We\'ll notify you when pricing changes or new savings opportunities apply to your AI tool stack.</p>
            ${shareableUrl ? `<p style="margin-top: 16px;">In the meantime, you can view your current audit here:</p>
            <a href="${shareableUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Your Current Report
            </a>` : ''}
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">No spam — we only email when there's a real savings opportunity for your stack.</p>
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

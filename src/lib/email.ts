import { db } from '@/lib/db';

/**
 * Send an email with the audit report.
 *
 * Priority:
 * 1. RESEND_API_KEY set → sends via Resend API
 * 2. SMTP_HOST set → sends via Nodemailer (works with Gmail, Outlook, etc.)
 * 3. Neither set → returns delivered:false so the UI can be honest
 *
 * To enable real email delivery, add ONE of these to your .env:
 *
 * Option A — Resend (easiest, free 100 emails/day):
 *   RESEND_API_KEY=re_xxxx
 *   Sign up at https://resend.com
 *
 * Option B — SMTP (use your Gmail/Outlook account):
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=you@gmail.com
 *   SMTP_PASS=your-app-password
 *   SMTP_FROM=AI Spend Audit <you@gmail.com>
 *   For Gmail: create an App Password at https://myaccount.google.com/apppasswords
 *   For Outlook: SMTP_HOST=smtp.office365.com, SMTP_PORT=587
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; delivered: boolean; method?: string }> {
  // Try Resend first
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
          from: process.env.RESEND_FROM || 'AI Spend Audit <onboarding@resend.dev>',
          to,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Resend API error:', err);
        return { success: false, delivered: false, method: 'resend' };
      }
      console.log(`Email sent to ${to} via Resend`);
      return { success: true, delivered: true, method: 'resend' };
    } catch (error) {
      console.error('Resend send failed:', error);
      return { success: false, delivered: false, method: 'resend' };
    }
  }

  // Try SMTP (Nodemailer)
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"AI Spend Audit" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      console.log(`Email sent to ${to} via SMTP: ${info.messageId}`);
      return { success: true, delivered: true, method: 'smtp' };
    } catch (error) {
      console.error('SMTP send failed:', error);
      return { success: false, delivered: false, method: 'smtp' };
    }
  }

  // No email service configured
  console.log('📧 [NO EMAIL SERVICE] Email not sent. Configure RESEND_API_KEY or SMTP_* in .env');
  console.log(`   Would send to: ${to}, subject: ${subject}`);
  return { success: false, delivered: false };
}

/**
 * Store a lead in the database and optionally send email.
 * Returns whether the email was actually delivered so the UI can be honest.
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
}): Promise<{ success: boolean; error?: string; emailDelivered?: boolean; emailMethod?: string }> {
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

    let emailDelivered = false;
    let emailMethod: string | undefined;

    if (shareableUrl && !isNotify) {
      const result = await sendEmail({
        to: email,
        subject: 'Your AI Spend Audit Report',
        html: buildReportEmail(shareableUrl, monthlySavings),
      });
      emailDelivered = result.delivered;
      emailMethod = result.method;
    }

    if (isNotify) {
      const result = await sendEmail({
        to: email,
        subject: 'You\'re on the AI Spend Audit watch list',
        html: buildNotifyEmail(shareableUrl),
      });
      emailDelivered = result.delivered;
      emailMethod = result.method;
    }

    return { success: true, emailDelivered, emailMethod };
  } catch (error) {
    console.error('Lead capture failed:', error);
    return { success: false, error: 'Failed to save lead information' };
  }
}

function buildReportEmail(shareableUrl: string, monthlySavings?: number): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your AI Spend Audit Report</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Your personalized savings analysis is ready</p>
      </div>
      <div style="padding: 32px 24px; background: #f9fafb; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1a1a1a; margin-bottom: 24px;">
          Thanks for using AI Spend Audit! Your personalized report is ready.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${shareableUrl}" style="display: inline-block; padding: 14px 32px; background: #10b981; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View Your Report
          </a>
        </div>
        ${monthlySavings && monthlySavings > 500 ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>High savings detected!</strong> With over $${monthlySavings.toFixed(0)}/month in potential savings, a Credex specialist can help you access enterprise discount programs and bulk API credits at 10–20% below retail. Reply to this email to schedule a free consultation.
          </p>
        </div>
        ` : ''}
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          No contract changes needed — most optimizations take 5 minutes in your billing dashboard.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          AI Spend Audit — Find unnecessary AI spending. No affiliation with any AI vendor. Pricing sourced from official vendor pages.
        </p>
      </div>
    </div>
  `;
}

function buildNotifyEmail(shareableUrl?: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">You're on the list!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">We'll notify you about new savings</p>
      </div>
      <div style="padding: 32px 24px; background: #f9fafb; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #1a1a1a; margin-bottom: 24px;">
          We'll email you when pricing changes or new savings opportunities apply to your AI tool stack. No spam, ever.
        </p>
        ${shareableUrl ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <p style="color: #6b7280; margin-bottom: 16px;">In the meantime, view your current audit:</p>
          <a href="${shareableUrl}" style="display: inline-block; padding: 14px 32px; background: #10b981; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View Your Current Report
          </a>
        </div>
        ` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          AI Spend Audit — We only email when there's a real savings opportunity for your stack.
        </p>
      </div>
    </div>
  `;
}

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import AuditResults from '@/components/AuditResults';
import type { Metadata } from 'next';
import { DollarSign } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const audit = await db.sharedAudit.findUnique({ where: { id } });

  if (!audit) return { title: 'Audit not found' };

  let auditData;
  try {
    auditData = JSON.parse(audit.auditData);
  } catch {
    return { title: 'Audit not found' };
  }

  const savings = auditData.totalMonthlySavings ?? 0;

  return {
    title: `Save $${savings}/month on AI tools`,
    description: `See how this AI stack could save $${savings} monthly. Get your own free AI spend audit.`,
    openGraph: {
      title: `AI Spend Audit: $${savings}/month savings found`,
      description: `Detailed breakdown of AI tool overspend with actionable recommendations.`,
      images: ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Save $${savings}/month on AI tools`,
      description: `Get a free AI spend audit and find hidden savings.`,
    },
  };
}

export default async function SharedResultPage({ params }: PageProps) {
  const { id } = await params;
  const audit = await db.sharedAudit.findUnique({ where: { id } });

  if (!audit) notFound();

  let auditData;
  try {
    auditData = JSON.parse(audit.auditData);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-emerald-600" />
          <span className="text-xl font-bold tracking-tight">AI Spend Audit</span>
          <span className="text-sm text-muted-foreground ml-2">Shared Result</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Shared Audit Result</h2>
          <p className="text-muted-foreground">
            Here&apos;s the AI spend analysis.{' '}
            <a href="/" className="text-emerald-600 hover:underline font-medium">
              Run your own free audit →
            </a>
          </p>
        </div>
        <AuditResults result={auditData} isShareable />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          <p>
            AI Spend Audit — Find unnecessary AI spending.{' '}
            <a href="/" className="text-emerald-600 hover:underline">
              Get your free audit
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

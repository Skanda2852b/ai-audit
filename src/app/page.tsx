'use client';

import { useState } from 'react';
import SpendForm from '@/components/SpendForm';
import AuditResults from '@/components/AuditResults';
import { ToolInput, AuditResult } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Zap, Shield, ArrowRight } from 'lucide-react';

type ResultWithMeta = AuditResult & { shareableId?: string; shareableUrl?: string };

export default function Home() {
  const [auditResult, setAuditResult] = useState<ResultWithMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAudit = async (formData: ToolInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error('Audit failed:', data.error);
        return;
      }

      setAuditResult(data);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('audit-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Audit request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAuditResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold tracking-tight">AI Spend Audit</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Free &middot; No Login Required
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {!auditResult ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Find hidden savings on your{' '}
                <span className="text-emerald-600">AI tools</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Are you overpaying for Cursor, ChatGPT, Claude, or Copilot? Get a free,
                instant audit with actionable recommendations — no login required.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="h-4 w-4 text-amber-500" /> Instant results
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="h-4 w-4 text-emerald-500" /> No data shared with vendors
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-blue-500" /> 100% free
                </div>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Social Proof */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-emerald-600">$2,400</p>
                <p className="text-xs text-muted-foreground">Avg. annual savings found</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">3 min</p>
                <p className="text-xs text-muted-foreground">Time to complete</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">500+</p>
                <p className="text-xs text-muted-foreground">Audits completed</p>
              </div>
            </div>

            {/* Form */}
            <SpendForm onSubmit={handleAudit} loading={loading} />

            {/* Bottom CTA */}
            <div className="text-center mt-8 text-sm text-muted-foreground">
              <p>
                Your data stays private. We never share your tool usage with vendors.
                <br />
                No contract changes needed — most optimizations take 5 minutes.
              </p>
            </div>
          </>
        ) : (
          <div id="audit-results">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Your AI Spend Audit</h2>
              <p className="text-muted-foreground">
                Here&apos;s what we found. Every recommendation traces back to official vendor pricing.
              </p>
            </div>
            <AuditResults result={auditResult} onReset={handleReset} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          <p>
            AI Spend Audit — Find unnecessary AI spending.{' '}
            Pricing sourced from official vendor pages.{' '}
            No affiliation with any AI vendor.
          </p>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowDown,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Mail,
  Loader2,
  Zap,
  Bell,
} from 'lucide-react';
import { AuditResult } from '@/types';
import { TOOL_DISPLAY_NAMES } from '@/lib/auditEngine';
import EmailCaptureModal from './EmailCaptureModal';
import ShareButtons from './ShareButtons';

interface AuditResultsProps {
  result: AuditResult & { shareableId?: string; shareableUrl?: string };
  isShareable?: boolean;
  onReset?: () => void;
}

export default function AuditResults({ result, isShareable, onReset }: AuditResultsProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalMode, setEmailModalMode] = useState<'report' | 'notify'>('report');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!isShareable) {
      loadSummary();
    }
  }, [isShareable]);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/llm-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditData: result }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch {
      // Fallback summary is already shown by the API
    } finally {
      setSummaryLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const openReportEmail = () => {
    setEmailModalMode('report');
    setShowEmailModal(true);
  };

  const openNotifyEmail = () => {
    setEmailModalMode('notify');
    setShowEmailModal(true);
  };

  const hasCredexEligible = result.recommendations.some((r) => r.credexEligible);

  return (
    <div className="space-y-6">
      {/* Savings Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={`border-2 ${result.isHighSavings ? 'border-emerald-500' : result.isOptimal ? 'border-blue-400' : 'border-amber-400'}`}>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-5 w-5 text-emerald-600 mr-2" />
              <span className="text-sm font-medium text-muted-foreground">Monthly Savings</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(result.totalMonthlySavings)}</p>
            {result.isHighSavings && (
              <Badge className="mt-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                High Impact
              </Badge>
            )}
            {result.isOptimal && (
              <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                Well Optimized
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-foreground mr-2" />
              <span className="text-sm font-medium text-muted-foreground">Annual Savings</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(result.totalAnnualSavings)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <ArrowDown className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-sm font-medium text-muted-foreground">Optimized Spend</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(result.totalMonthlyOptimized)}
              <span className="text-sm text-muted-foreground font-normal">/mo</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credex Prominent Callout for >$500/mo savings */}
      {result.isHighSavings && (
        <Card className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg mb-1">Unlock enterprise-level savings</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  With over {formatCurrency(result.totalMonthlySavings)}/month in potential savings, you could save even more
                  through discounted enterprise credits and volume pricing. Credex helps companies like yours access
                  bulk API credits at 10–20% below retail — no contract changes needed.
                </p>
                <Button
                  onClick={openReportEmail}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Get a free savings consultation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* "You're spending well" message for optimal stacks */}
      {result.isOptimal && result.totalMonthlySavings < 20 && (
        <Card className="border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg mb-1">You&apos;re spending well</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your AI tool stack is already well-optimized. We couldn&apos;t find significant savings opportunities
                  with your current setup. But pricing changes frequently — we can notify you when new
                  optimizations apply to your stack.
                </p>
                <Button
                  variant="outline"
                  onClick={openNotifyEmail}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-100"
                >
                  <Bell className="mr-2 h-4 w-4" /> Notify me when new savings appear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current vs Optimized Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current monthly spend</span>
              <span className="font-semibold">{formatCurrency(result.totalMonthlyCurrent)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Optimized monthly spend</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(result.totalMonthlyOptimized)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: result.totalMonthlyCurrent > 0
                    ? `${(result.totalMonthlyOptimized / result.totalMonthlyCurrent) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      {!isShareable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-emerald-600" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating insights...
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{aiSummary || 'Summary unavailable.'}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.recommendations.map((rec, i) => (
            <div key={i}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold">
                      {TOOL_DISPLAY_NAMES[rec.toolName] || rec.toolName.charAt(0).toUpperCase() + rec.toolName.slice(1)}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {rec.currentPlan}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {formatCurrency(rec.currentSpend)}/mo
                    </Badge>
                    {rec.credexEligible && (
                      <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Credex eligible
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">{rec.recommendedAction}</p>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  {rec.monthlySavings > 0 ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-semibold">{formatCurrency(rec.monthlySavings)}/mo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Optimal</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Credex note for API credits */}
      {hasCredexEligible && !result.isHighSavings && (
        <Card className="border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">
                  <span className="font-semibold">Want to save on API costs?</span>{' '}
                  Some of your tools are eligible for discounted credits through Credex — typically 10–20%
                  below retail rates with no contract changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isShareable && (
        <div className="flex flex-col sm:flex-row gap-3">
          {result.shareableUrl && (
            <ShareButtons shareableUrl={result.shareableUrl} savings={result.totalMonthlySavings} />
          )}
          <Button
            variant="outline"
            onClick={openReportEmail}
            className="flex-1"
          >
            <Mail className="mr-2 h-4 w-4" /> Email My Report
          </Button>
          {onReset && (
            <Button variant="secondary" onClick={onReset} className="flex-1">
              Run Another Audit
            </Button>
          )}
        </div>
      )}

      {/* Email Capture Modal */}
      {showEmailModal && (
        <EmailCaptureModal
          auditId={result.shareableId}
          monthlySavings={result.totalMonthlySavings}
          shareableUrl={result.shareableUrl}
          mode={emailModalMode}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" /><path d="M22 5h-4" />
      <path d="M4 17v2" /><path d="M5 18H3" />
    </svg>
  );
}

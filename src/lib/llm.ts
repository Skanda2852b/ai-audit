import ZAI from 'z-ai-web-dev-sdk';
import { AuditResult } from '@/types';

let zaiInstance: ZAI | null = null;

async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function generateSummary(auditData: AuditResult): Promise<string> {
  const zai = await getZAI();

  const prompt = `You are a concise AI spending advisor for startups. Based on the audit data below, write a 3-4 sentence summary with specific dollar amounts. Be direct and actionable. Do not use markdown formatting.

Current monthly spend: $${auditData.totalMonthlyCurrent}
Optimized monthly spend: $${auditData.totalMonthlyOptimized}
Monthly savings: $${auditData.totalMonthlySavings}
Annual savings: $${auditData.totalAnnualSavings}
${auditData.isHighSavings ? 'This is a HIGH savings opportunity.' : ''}
${auditData.isOptimal ? 'The stack is already well-optimized.' : ''}

Recommendations:
${auditData.recommendations.map((r) => `- ${r.toolName} (${r.currentPlan}): ${r.recommendedAction} — Save $${r.monthlySavings}/mo. ${r.reason}`).join('\n')}`;

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are a concise financial advisor for AI tool spending. Give specific, actionable advice with dollar amounts. No fluff, no markdown, just clear recommendations.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content ?? getFallbackSummary(auditData);
}

export function getFallbackSummary(auditData: AuditResult): string {
  const savings = auditData.totalMonthlySavings;
  const annual = auditData.totalAnnualSavings;

  if (auditData.isOptimal) {
    return `Your AI stack at $${auditData.totalMonthlyCurrent}/month is already well-optimized. You're spending efficiently across your tools. We'll notify you when new savings opportunities appear as pricing changes.`;
  }

  const highSavingsNote = auditData.isHighSavings
    ? ` With $${annual}/year in potential savings, this is a high-impact optimization — consider booking a free consultation to explore enterprise discount programs.`
    : ` That's $${annual}/year back in your budget.`;

  const topRec = auditData.recommendations.find((r) => r.monthlySavings > 0);
  const topAction = topRec
    ? ` The biggest opportunity: ${topRec.recommendedAction} for ${topRec.toolName}, saving $${topRec.monthlySavings}/month.`
    : '';

  return `Your AI stack currently costs $${auditData.totalMonthlyCurrent}/month. By optimizing plans and tool choices, you could save $${savings}/month.${topAction}${highSavingsNote}`;
}

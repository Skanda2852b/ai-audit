import { AuditResult } from '@/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function generateSummary(auditData: AuditResult): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return getFallbackSummary(auditData);
  }

  const prompt = `You are a concise AI spending advisor for startups. Based on the audit data below, write a 3-4 sentence friendly paragraph with specific dollar amounts. Be direct and actionable. Do not use markdown formatting or bullet points — plain prose only.

Current monthly spend: $${auditData.totalMonthlyCurrent}
Optimized monthly spend: $${auditData.totalMonthlyOptimized}
Monthly savings: $${auditData.totalMonthlySavings}
Annual savings: $${auditData.totalAnnualSavings}
${auditData.isHighSavings ? 'This is a HIGH savings opportunity.' : ''}
${auditData.isOptimal ? 'The stack is already well-optimized.' : ''}

Recommendations:
${auditData.recommendations
  .map(
    (r) =>
      `- ${r.toolName} (${r.currentPlan}): ${r.recommendedAction} — Save $${r.monthlySavings}/mo. ${r.reason}`
  )
  .join('\n')}`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise financial advisor for AI tool spending. Give specific, actionable advice with dollar amounts. No fluff, no markdown, just clear friendly prose.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Groq API error:', err);
    return getFallbackSummary(auditData);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? getFallbackSummary(auditData);
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

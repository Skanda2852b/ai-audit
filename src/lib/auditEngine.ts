import { ToolInput, AuditResult, ToolRecommendation } from '@/types';

// Pricing tables (USD per user/month)
// Sources: official pricing pages as of 2025-04
// - Cursor: https://cursor.sh/pricing
// - GitHub Copilot: https://github.com/features/copilot#pricing
// - Claude: https://claude.ai/pricing
// - ChatGPT: https://openai.com/chatgpt/pricing
// - Gemini: https://ai.google.dev/pricing
// - Windsurf: https://codeium.com/windsurf
const PRICING: Record<string, Record<string, number>> = {
  cursor: { hobby: 0, pro: 20, business: 40 },
  copilot: { individual: 10, business: 19, enterprise: 39 },
  claude: { free: 0, pro: 20, max: 30, team: 25, enterprise: 50 },
  chatgpt: { plus: 20, team: 25, enterprise: 30 },
  gemini: { pro: 10, ultra: 20 },
  windsurf: { pro: 15, team: 30 },
};

// Alternative mapping for use-case based switches
const ALTERNATIVES: Record<string, { cheaperTool: string; reason: string }> = {
  coding: {
    cheaperTool: 'GitHub Copilot',
    reason:
      'For pure coding, Copilot is $10–19/user vs Cursor Pro $20/user. If your team mainly writes code, Copilot Individual at $10/mo delivers comparable inline suggestions at half the price.',
  },
  writing: {
    cheaperTool: 'ChatGPT Plus',
    reason:
      'Claude Max is $30/user – ChatGPT Plus gives similar writing quality at $20/user. Unless you rely heavily on Claude-specific features, the savings are meaningful.',
  },
  mixed: {
    cheaperTool: 'ChatGPT Team',
    reason:
      'For mixed coding/writing use, ChatGPT Team ($25/user) offers better versatility than maintaining separate Claude and Cursor subscriptions.',
  },
};

export function runAudit(input: ToolInput): AuditResult {
  const recommendations: ToolRecommendation[] = [];
  let totalMonthlyCurrent = 0;
  let totalMonthlyOptimized = 0;

  for (const tool of input.tools) {
    const { name, plan, monthlySpend, seats, useCase } = tool;
    totalMonthlyCurrent += monthlySpend;

    // 1. Plan suitability check
    const recommendedPlan = getRecommendedPlan(name, plan, seats, useCase);
    let optimizedSpend = monthlySpend;
    let action = 'Keep current plan';
    let savings = 0;
    let reason = '';

    if (recommendedPlan && recommendedPlan !== plan) {
      const newPrice = PRICING[name]?.[recommendedPlan] ?? 0;
      optimizedSpend = newPrice * seats;
      savings = monthlySpend - optimizedSpend;
      action = `Switch to ${recommendedPlan} plan`;
      reason = `Your team size (${seats} seat${seats !== 1 ? 's' : ''}) fits better with the ${recommendedPlan} plan. You're overpaying for features you don't need.`;
    }

    // 2. Alternative tool check (only if savings from plan change < $50)
    if (savings < 50 && monthlySpend > 30) {
      const alt = ALTERNATIVES[useCase];
      if (alt && alt.cheaperTool.toLowerCase() !== name.toLowerCase()) {
        const altPrice = getAlternativePrice(alt.cheaperTool);
        const altSpend = altPrice * seats;
        if (altSpend < optimizedSpend) {
          savings = optimizedSpend - altSpend;
          optimizedSpend = altSpend;
          action = `Switch to ${alt.cheaperTool}`;
          reason = alt.reason;
        }
      }
    }

    // 3. Seat over-provisioning check
    if (savings === 0 && seats > 5 && plan !== 'hobby' && plan !== 'free') {
      const pricePerSeat = PRICING[name]?.[plan] ?? 0;
      const suggestedSeats = Math.ceil(seats * 0.8);
      if (suggestedSeats < seats) {
        const potentialSavings = (seats - suggestedSeats) * pricePerSeat;
        if (potentialSavings > 20) {
          savings = potentialSavings;
          optimizedSpend -= savings;
          action = `Reduce seats from ${seats} to ~${suggestedSeats}`;
          reason = `You may be over-provisioned. Typical utilization for teams your size suggests ${suggestedSeats} active seats could suffice, saving $${potentialSavings.toFixed(0)}/month.`;
        }
      }
    }

    recommendations.push({
      toolName: name,
      currentPlan: plan,
      recommendedAction: action,
      monthlySavings: savings > 0 ? Math.round(savings * 100) / 100 : 0,
      reason: reason || 'Your current setup is already well-optimized. No changes needed.',
    });

    totalMonthlyOptimized += optimizedSpend;
  }

  const totalMonthlySavings = totalMonthlyCurrent - totalMonthlyOptimized;
  const totalAnnualSavings = totalMonthlySavings * 12;

  return {
    totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
    totalAnnualSavings: Math.round(totalAnnualSavings * 100) / 100,
    totalMonthlyCurrent,
    totalMonthlyOptimized: Math.round(totalMonthlyOptimized * 100) / 100,
    recommendations,
    isHighSavings: totalMonthlySavings > 500,
    isOptimal: totalMonthlySavings < 100,
  };
}

function getRecommendedPlan(
  tool: string,
  currentPlan: string,
  seats: number,
  _useCase: string
): string | null {
  // Cursor: Business for 1-2 users → Pro is better value
  if (tool === 'cursor' && seats <= 2 && currentPlan === 'business') return 'pro';
  // Claude: Team for 1 user → Pro is cheaper
  if (tool === 'claude' && seats === 1 && currentPlan === 'team') return 'pro';
  // ChatGPT: Team for 1 user → Plus is cheaper
  if (tool === 'chatgpt' && seats === 1 && currentPlan === 'team') return 'plus';
  // Cursor: Hobby for teams > 2 could benefit from Pro
  if (tool === 'cursor' && seats > 2 && currentPlan === 'hobby') return 'pro';
  // Copilot: Enterprise for small teams → Business is sufficient
  if (tool === 'copilot' && seats <= 10 && currentPlan === 'enterprise') return 'business';
  return null;
}

function getAlternativePrice(tool: string): number {
  if (tool === 'GitHub Copilot') return 10;
  if (tool === 'ChatGPT Plus') return 20;
  if (tool === 'ChatGPT Team') return 25;
  return 0;
}

// Export pricing for display purposes
export function getToolPricing(toolName: string): Record<string, number> | null {
  return PRICING[toolName] ?? null;
}

export function getAllToolNames(): string[] {
  return Object.keys(PRICING);
}

export function getPlansForTool(toolName: string): string[] {
  return Object.keys(PRICING[toolName] ?? {});
}

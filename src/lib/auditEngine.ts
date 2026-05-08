import { ToolInput, AuditResult, ToolRecommendation } from '@/types';

// Pricing tables (USD per user/month)
// Sources: official pricing pages as of 2025-04
// - Cursor: https://cursor.sh/pricing
// - GitHub Copilot: https://github.com/features/copilot#pricing
// - Claude: https://claude.ai/pricing
// - ChatGPT: https://openai.com/chatgpt/pricing
// - Anthropic API: https://docs.anthropic.com/en/docs/about-claude/pricing
// - OpenAI API: https://openai.com/api/pricing/
// - Gemini: https://ai.google.dev/pricing
// - Windsurf: https://codeium.com/windsurf
const PRICING: Record<string, Record<string, number>> = {
  cursor: { hobby: 0, pro: 20, business: 40, enterprise: 60 },
  copilot: { individual: 10, business: 19, enterprise: 39 },
  claude: { free: 0, pro: 20, max: 30, team: 25, enterprise: 50, api: 0 },
  chatgpt: { free: 0, plus: 20, team: 25, enterprise: 30, api: 0 },
  'anthropic-api': { pay_as_you_go: 0 },
  'openai-api': { pay_as_you_go: 0 },
  gemini: { free: 0, pro: 10, ultra: 20, api: 0 },
  windsurf: { free: 0, pro: 15, team: 30 },
};

// Tool display names for the UI
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  'anthropic-api': 'Anthropic API',
  'openai-api': 'OpenAI API',
  gemini: 'Gemini',
  windsurf: 'Windsurf',
};

// Alternative mapping for use-case based switches
const ALTERNATIVES: Record<string, { cheaperTool: string; reason: string }> = {
  coding: {
    cheaperTool: 'GitHub Copilot',
    reason:
      'For pure coding, Copilot Individual at $10/mo delivers comparable inline suggestions at half the price of Cursor Pro ($20/mo). If your team mainly writes code, this switch saves significantly per seat.',
  },
  writing: {
    cheaperTool: 'ChatGPT Plus',
    reason:
      'Claude Max is $30/user — ChatGPT Plus gives similar writing quality at $20/user. Unless you rely heavily on Claude-specific features like extended thinking, the $10/user savings is meaningful.',
  },
  data: {
    cheaperTool: 'ChatGPT Plus',
    reason:
      'For data analysis tasks, ChatGPT Plus ($20/mo) with Advanced Data Analysis (Code Interpreter) offers comparable capability to Claude Pro ($20/mo) but with built-in code execution — often more practical for data workflows.',
  },
  research: {
    cheaperTool: 'ChatGPT Plus',
    reason:
      'For research use cases, ChatGPT Plus ($20/mo) includes web browsing and file analysis. Claude Max ($30/mo) adds extended thinking but the marginal value for research rarely justifies the $10/mo premium.',
  },
  mixed: {
    cheaperTool: 'ChatGPT Team',
    reason:
      'For mixed coding/writing use, ChatGPT Team ($25/user) offers better versatility than maintaining separate Claude and Cursor subscriptions. One tool, one bill, similar coverage.',
  },
};

// API direct usage estimates (typical monthly spend per developer)
const API_SPEND_ESTIMATES: Record<string, { low: number; high: number; typical: number }> = {
  'anthropic-api': { low: 5, high: 200, typical: 40 },
  'openai-api': { low: 5, high: 200, typical: 35 },
};

export function runAudit(input: ToolInput): AuditResult {
  const recommendations: ToolRecommendation[] = [];
  let totalMonthlyCurrent = 0;
  let totalMonthlyOptimized = 0;
  let anyCredexEligible = false;

  for (const tool of input.tools) {
    const { name, plan, monthlySpend, seats, useCase } = tool;
    totalMonthlyCurrent += monthlySpend;

    // 1. Plan suitability check
    const recommendedPlan = getRecommendedPlan(name, plan, seats, useCase, input.teamSize);
    let optimizedSpend = monthlySpend;
    let action = 'Keep current plan';
    let savings = 0;
    let reason = '';
    let credexEligible = false;

    if (recommendedPlan && recommendedPlan !== plan) {
      const newPrice = PRICING[name]?.[recommendedPlan] ?? 0;
      optimizedSpend = newPrice * seats;
      savings = monthlySpend - optimizedSpend;
      action = `Switch to ${recommendedPlan} plan`;
      reason = `Your team size (${seats} seat${seats !== 1 ? 's' : ''}) fits better with the ${recommendedPlan} plan. You're overpaying for features you don't need.`;
    }

    // 2. Alternative tool check (only if no plan-level savings found yet)
    // Skip for API/pay-as-you-go plans — these are usage-based, not subscription-based
    const isApiPlan = plan === 'api' || plan === 'pay_as_you_go';
    const isApiTool = name === 'anthropic-api' || name === 'openai-api';
    if (savings === 0 && monthlySpend >= 30 && !isApiPlan && !isApiTool) {
      const alt = ALTERNATIVES[useCase];
      if (alt && !isSameToolFamily(alt.cheaperTool, name)) {
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

    // 3. Seat over-provisioning check (skip for API usage-based plans)
    if (savings === 0 && seats > 5 && !isApiPlan && !isApiTool && plan !== 'hobby' && plan !== 'free') {
      const pricePerSeat = PRICING[name]?.[plan] ?? 0;
      const suggestedSeats = Math.ceil(seats * 0.8);
      if (suggestedSeats < seats) {
        const potentialSavings = (seats - suggestedSeats) * pricePerSeat;
        if (potentialSavings > 20) {
          savings = potentialSavings;
          optimizedSpend -= savings;
          action = `Reduce seats from ${seats} to ~${suggestedSeats}`;
          reason = `You may be over-provisioned. Typical utilization for teams your size suggests ${suggestedSeats} active seats could suffice, saving $${potentialSavings.toFixed(0)}/month. Review actual usage in your billing dashboard.`;
        }
      }
    }

    // 4. Credex credits check — if paying retail for API usage, could benefit from discounted credits
    if ((name === 'anthropic-api' || name === 'openai-api' || plan === 'api') && monthlySpend >= 50) {
      credexEligible = true;
      anyCredexEligible = true;
      if (savings === 0) {
        action = `Access ${name === 'anthropic-api' ? 'Anthropic' : name === 'openai-api' ? 'OpenAI' : 'API'} credits via Credex`;
        reason = `You're paying retail API rates. Credex offers discounted credits for ${name === 'anthropic-api' ? 'Anthropic' : name === 'openai-api' ? 'OpenAI' : 'this provider'} — typically 10-20% below list price for committed usage. No contract changes required.`;
        savings = Math.round(monthlySpend * 0.15); // Estimate 15% savings
        optimizedSpend = monthlySpend - savings;
      } else {
        credexEligible = true; // Also eligible even if other savings found
      }
    }

    // 5. General Credex mention for high retail spend on non-API tools
    if ((name === 'cursor' || name === 'copilot' || name === 'claude' || name === 'chatgpt') &&
        plan !== 'free' && plan !== 'hobby' && monthlySpend >= 150) {
      credexEligible = true;
      anyCredexEligible = true;
    }

    recommendations.push({
      toolName: name,
      currentPlan: plan,
      currentSpend: monthlySpend,
      recommendedAction: action,
      monthlySavings: savings > 0 ? Math.round(savings * 100) / 100 : 0,
      reason: reason || 'Your current setup is already well-optimized. No changes needed.',
      credexEligible,
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

function isSameToolFamily(altTool: string, currentTool: string): boolean {
  const families: Record<string, string[]> = {
    anthropic: ['claude', 'anthropic-api'],
    openai: ['chatgpt', 'openai-api'],
  };
  for (const family of Object.values(families)) {
    if (family.includes(altTool.toLowerCase()) && family.includes(currentTool.toLowerCase())) return true;
  }
  // Exact match
  return altTool.toLowerCase() === currentTool.toLowerCase();
}

function getRecommendedPlan(
  tool: string,
  currentPlan: string,
  seats: number,
  _useCase: string,
  teamSize: number
): string | null {
  // Cursor: Business for 1-2 users → Pro is better value
  if (tool === 'cursor' && seats <= 2 && currentPlan === 'business') return 'pro';
  // Cursor: Enterprise for small teams → Business is sufficient
  if (tool === 'cursor' && seats <= 5 && currentPlan === 'enterprise') return 'business';
  // Claude: Team for 1 user → Pro is cheaper
  if (tool === 'claude' && seats === 1 && currentPlan === 'team') return 'pro';
  // Claude: Enterprise for small teams → Team is sufficient
  if (tool === 'claude' && seats <= 5 && currentPlan === 'enterprise') return 'team';
  // ChatGPT: Team for 1 user → Plus is cheaper
  if (tool === 'chatgpt' && seats === 1 && currentPlan === 'team') return 'plus';
  // ChatGPT: Enterprise for small teams → Team is sufficient
  if (tool === 'chatgpt' && seats <= 5 && currentPlan === 'enterprise') return 'team';
  // Cursor: Hobby for teams > 2 could benefit from Pro
  if (tool === 'cursor' && seats > 2 && currentPlan === 'hobby') return 'pro';
  // Copilot: Enterprise for small teams → Business is sufficient
  if (tool === 'copilot' && seats <= 10 && currentPlan === 'enterprise') return 'business';
  // Gemini: Ultra for single user → Pro may suffice
  if (tool === 'gemini' && seats === 1 && currentPlan === 'ultra') return 'pro';
  // Windsurf: Team for 1-2 users → Pro is cheaper
  if (tool === 'windsurf' && seats <= 2 && currentPlan === 'team') return 'pro';
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

export function getApiSpendEstimate(toolName: string): { low: number; high: number; typical: number } | null {
  return API_SPEND_ESTIMATES[toolName] ?? null;
}

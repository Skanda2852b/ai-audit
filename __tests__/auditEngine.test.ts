import { runAudit } from '@/lib/auditEngine';
import { ToolInput } from '@/types';

describe('Audit Engine', () => {
  test('detects overkill plan: Cursor Business for 1 user', () => {
    const input: ToolInput = {
      tools: [
        { name: 'cursor', plan: 'business', monthlySpend: 40, seats: 1, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].recommendedAction).toContain('Switch');
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  test('suggests alternative: Claude Max -> ChatGPT Plus for writing', () => {
    const input: ToolInput = {
      tools: [
        { name: 'claude', plan: 'max', monthlySpend: 30, seats: 1, useCase: 'writing' },
      ],
      primaryUseCase: 'writing',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].recommendedAction).toContain('ChatGPT Plus');
  });

  test('optimal case: under $100 savings triggers isOptimal', () => {
    const input: ToolInput = {
      tools: [
        { name: 'chatgpt', plan: 'plus', monthlySpend: 20, seats: 1, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.isOptimal).toBe(true);
  });

  test('high savings flag when >$500', () => {
    const input: ToolInput = {
      tools: [
        { name: 'cursor', plan: 'business', monthlySpend: 800, seats: 20, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 20,
    };
    const result = runAudit(input);
    expect(result.isHighSavings).toBe(true);
  });

  test('multiple tools aggregated correctly', () => {
    const input: ToolInput = {
      tools: [
        { name: 'cursor', plan: 'business', monthlySpend: 80, seats: 2, useCase: 'coding' },
        { name: 'claude', plan: 'team', monthlySpend: 50, seats: 2, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 10,
    };
    const result = runAudit(input);
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
    expect(result.recommendations).toHaveLength(2);
  });

  test('Copilot Enterprise for small team suggests Business plan', () => {
    const input: ToolInput = {
      tools: [
        { name: 'copilot', plan: 'enterprise', monthlySpend: 39, seats: 5, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].recommendedAction).toContain('business');
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  test('already optimal stack returns zero savings', () => {
    const input: ToolInput = {
      tools: [
        { name: 'copilot', plan: 'individual', monthlySpend: 10, seats: 1, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 1,
    };
    const result = runAudit(input);
    expect(result.totalMonthlySavings).toBe(0);
    expect(result.isOptimal).toBe(true);
  });

  test('annual savings equals monthly savings times 12', () => {
    const input: ToolInput = {
      tools: [
        { name: 'cursor', plan: 'business', monthlySpend: 40, seats: 1, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });

  test('Cursor Enterprise for small team suggests Business', () => {
    const input: ToolInput = {
      tools: [
        { name: 'cursor', plan: 'enterprise', monthlySpend: 60, seats: 3, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].recommendedAction).toContain('business');
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  test('ChatGPT Enterprise for small team suggests Team', () => {
    const input: ToolInput = {
      tools: [
        { name: 'chatgpt', plan: 'enterprise', monthlySpend: 30, seats: 3, useCase: 'mixed' },
      ],
      primaryUseCase: 'mixed',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].recommendedAction).toContain('team');
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  test('Anthropic API with high spend is Credex eligible', () => {
    const input: ToolInput = {
      tools: [
        { name: 'anthropic-api', plan: 'pay_as_you_go', monthlySpend: 150, seats: 3, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].credexEligible).toBe(true);
    expect(result.recommendations[0].monthlySavings).toBeGreaterThan(0);
  });

  test('Gemini Ultra for single user suggests Pro', () => {
    const input: ToolInput = {
      tools: [
        { name: 'gemini', plan: 'ultra', monthlySpend: 20, seats: 1, useCase: 'research' },
      ],
      primaryUseCase: 'research',
      teamSize: 3,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].recommendedAction).toContain('pro');
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  test('Windsurf Team for 1-2 users suggests Pro', () => {
    const input: ToolInput = {
      tools: [
        { name: 'windsurf', plan: 'team', monthlySpend: 30, seats: 2, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 5,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].recommendedAction).toContain('pro');
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
  });

  test('per-tool current spend is preserved in recommendations', () => {
    const input: ToolInput = {
      tools: [
        { name: 'cursor', plan: 'business', monthlySpend: 120, seats: 3, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
      teamSize: 10,
    };
    const result = runAudit(input);
    expect(result.recommendations[0].currentSpend).toBe(120);
  });

  test('does not suggest alternative from same vendor family', () => {
    // Claude API should not suggest ChatGPT as alt when user is on ChatGPT already
    const input: ToolInput = {
      tools: [
        { name: 'chatgpt', plan: 'plus', monthlySpend: 20, seats: 1, useCase: 'writing' },
      ],
      primaryUseCase: 'writing',
      teamSize: 5,
    };
    const result = runAudit(input);
    // ChatGPT Plus at $20 is already the cheapest for writing - should be optimal
    expect(result.isOptimal).toBe(true);
  });
});

import { runAudit } from '@/lib/auditEngine';
import { ToolInput } from '@/types';

describe('Audit Engine', () => {
  test('detects overkill plan: Cursor Business for 1 user', () => {
    const input: ToolInput = {
      tools: [
        { name: 'cursor', plan: 'business', monthlySpend: 40, seats: 1, useCase: 'coding' },
      ],
      primaryUseCase: 'coding',
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
    };
    const result = runAudit(input);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });
});

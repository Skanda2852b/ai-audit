export type UseCase = 'coding' | 'writing' | 'data' | 'research' | 'mixed';

export interface ToolEntry {
  name: string;
  plan: string;
  monthlySpend: number;
  seats: number;
  useCase: UseCase;
}

export interface ToolInput {
  tools: ToolEntry[];
  primaryUseCase: UseCase;
  teamSize: number;
}

export interface ToolRecommendation {
  toolName: string;
  currentPlan: string;
  currentSpend: number;
  recommendedAction: string;
  monthlySavings: number;
  reason: string;
  credexEligible: boolean;
}

export interface AuditResult {
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  totalMonthlyCurrent: number;
  totalMonthlyOptimized: number;
  recommendations: ToolRecommendation[];
  isHighSavings: boolean;
  isOptimal: boolean;
}

export interface LeadCaptureInput {
  email: string;
  company?: string;
  role?: string;
  teamSize?: number;
  auditId?: string;
  monthlySavings?: number;
  shareableUrl?: string;
}

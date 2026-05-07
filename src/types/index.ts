export interface ToolEntry {
  name: string;
  plan: string;
  monthlySpend: number;
  seats: number;
  useCase: 'coding' | 'writing' | 'mixed';
}

export interface ToolInput {
  tools: ToolEntry[];
  primaryUseCase: 'coding' | 'writing' | 'mixed';
}

export interface ToolRecommendation {
  toolName: string;
  currentPlan: string;
  recommendedAction: string;
  monthlySavings: number;
  reason: string;
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

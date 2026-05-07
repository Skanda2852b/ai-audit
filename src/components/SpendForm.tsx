'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { ToolEntry, ToolInput } from '@/types';
import { getAllToolNames, getPlansForTool, getToolPricing } from '@/lib/auditEngine';

const TOOL_NAMES = getAllToolNames();

const USE_CASES = [
  { value: 'coding', label: 'Coding / Development' },
  { value: 'writing', label: 'Writing / Content' },
  { value: 'mixed', label: 'Mixed / General' },
] as const;

interface SpendFormProps {
  onSubmit: (data: ToolInput) => void;
  loading: boolean;
}

function createEmptyTool(): ToolEntry {
  return {
    name: 'cursor',
    plan: 'pro',
    monthlySpend: 20,
    seats: 1,
    useCase: 'coding',
  };
}

function loadSavedFormData(): { tools: ToolEntry[]; primaryUseCase: ToolInput['primaryUseCase'] } {
  if (typeof window === 'undefined') {
    return { tools: [createEmptyTool()], primaryUseCase: 'coding' };
  }
  try {
    const saved = localStorage.getItem('spendFormData');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.tools && parsed.tools.length > 0) {
        return {
          tools: parsed.tools,
          primaryUseCase: parsed.primaryUseCase || 'coding',
        };
      }
    }
  } catch {
    // ignore parse errors
  }
  return { tools: [createEmptyTool()], primaryUseCase: 'coding' };
}

export default function SpendForm({ onSubmit, loading }: SpendFormProps) {
  const saved = loadSavedFormData();
  const [tools, setTools] = useState<ToolEntry[]>(saved.tools);
  const [primaryUseCase, setPrimaryUseCase] = useState<ToolInput['primaryUseCase']>(saved.primaryUseCase);

  const addTool = () => {
    setTools([...tools, createEmptyTool()]);
  };

  const removeTool = (index: number) => {
    if (tools.length <= 1) return;
    setTools(tools.filter((_, i) => i !== index));
  };

  const recalcSpend = (toolName: string, plan: string, seats: number): number => {
    const pricing = getToolPricing(toolName);
    return (pricing?.[plan] ?? 0) * seats;
  };

  const updateTool = (index: number, field: keyof ToolEntry, value: string | number) => {
    const updated = [...tools];
    const tool = { ...updated[index] };

    if (field === 'name') {
      tool.name = value as string;
      const plans = getPlansForTool(value as string);
      tool.plan = plans[0] || 'free';
      tool.monthlySpend = recalcSpend(tool.name, tool.plan, tool.seats);
    } else if (field === 'plan') {
      tool.plan = value as string;
      tool.monthlySpend = recalcSpend(tool.name, tool.plan, tool.seats);
    } else if (field === 'seats') {
      tool.seats = Math.max(1, Number(value) || 1);
      tool.monthlySpend = recalcSpend(tool.name, tool.plan, tool.seats);
    } else if (field === 'monthlySpend') {
      tool.monthlySpend = Math.max(0, Number(value) || 0);
    } else if (field === 'useCase') {
      tool.useCase = value as ToolEntry['useCase'];
    }

    updated[index] = tool;
    setTools(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ToolInput = { tools, primaryUseCase };
    localStorage.setItem('spendFormData', JSON.stringify(data));
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {tools.map((tool, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tool {index + 1}</CardTitle>
              {tools.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTool(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tool Name */}
            <div className="space-y-2">
              <Label htmlFor={`tool-name-${index}`}>AI Tool</Label>
              <Select
                value={tool.name}
                onValueChange={(v) => updateTool(index, 'name', v)}
              >
                <SelectTrigger id={`tool-name-${index}`}>
                  <SelectValue placeholder="Select tool" />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_NAMES.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan */}
            <div className="space-y-2">
              <Label htmlFor={`tool-plan-${index}`}>Plan</Label>
              <Select
                value={tool.plan}
                onValueChange={(v) => updateTool(index, 'plan', v)}
              >
                <SelectTrigger id={`tool-plan-${index}`}>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {getPlansForTool(tool.name).map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Use Case */}
            <div className="space-y-2">
              <Label htmlFor={`tool-usecase-${index}`}>Primary Use</Label>
              <Select
                value={tool.useCase}
                onValueChange={(v) => updateTool(index, 'useCase', v)}
              >
                <SelectTrigger id={`tool-usecase-${index}`}>
                  <SelectValue placeholder="Select use case" />
                </SelectTrigger>
                <SelectContent>
                  {USE_CASES.map((uc) => (
                    <SelectItem key={uc.value} value={uc.value}>
                      {uc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seats */}
            <div className="space-y-2">
              <Label htmlFor={`tool-seats-${index}`}>Seats / Users</Label>
              <Input
                id={`tool-seats-${index}`}
                type="number"
                min={1}
                value={tool.seats}
                onChange={(e) => updateTool(index, 'seats', e.target.value)}
              />
            </div>

            {/* Monthly Spend */}
            <div className="space-y-2">
              <Label htmlFor={`tool-spend-${index}`}>Monthly Spend ($)</Label>
              <Input
                id={`tool-spend-${index}`}
                type="number"
                min={0}
                step={0.01}
                value={tool.monthlySpend}
                onChange={(e) => updateTool(index, 'monthlySpend', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Primary Use Case */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="primary-use-case">Overall Primary Use Case</Label>
            <Select
              value={primaryUseCase}
              onValueChange={(v) => setPrimaryUseCase(v as ToolInput['primaryUseCase'])}
            >
              <SelectTrigger id="primary-use-case">
                <SelectValue placeholder="Select primary use case" />
              </SelectTrigger>
              <SelectContent>
                {USE_CASES.map((uc) => (
                  <SelectItem key={uc.value} value={uc.value}>
                    {uc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="outline" onClick={addTool} className="flex-1">
          <Plus className="mr-2 h-4 w-4" /> Add Another Tool
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> Run Audit
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

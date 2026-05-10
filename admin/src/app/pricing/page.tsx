'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Calculator, Variable,
  Play, Save, Trash2, Edit3, AlertCircle, CheckCircle2,
  History, FunctionSquare
} from 'lucide-react';
import { evaluate } from 'mathjs';
import { api, queryKeys } from '@/services';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/utils';
import type { PricingRule, PricingLog } from '@/types';

// ─── Available Variables (whitelist) ───
const AVAILABLE_VARIABLES = [
  { name: 'base_price', label: 'Base Price', description: 'Default hourly rate', example: '10.00' },
  { name: 'hours', label: 'Hours', description: 'Number of hours booked', example: '3' },
  { name: 'multiplier', label: 'Multiplier', description: 'General pricing multiplier', example: '1.5' },
  { name: 'demand_factor', label: 'Demand Factor', description: 'Current demand level (0-2)', example: '1.2' },
  { name: 'weekend_multiplier', label: 'Weekend Multiplier', description: 'Weekend rate multiplier', example: '1.3' },
];

const ALLOWED_VAR_NAMES = AVAILABLE_VARIABLES.map((v) => v.name);

// ─── Safe Formula Validator (no Function(), no eval) ───
function validateFormula(formula: string): { valid: boolean; error?: string } {
  if (!formula || formula.trim().length === 0) {
    return { valid: false, error: 'Formula is empty' };
  }

  // Check bracket balance
  let open = 0;
  for (const ch of formula) {
    if (ch === '(') open++;
    if (ch === ')') open--;
    if (open < 0) return { valid: false, error: 'Mismatched brackets: too many closing parentheses' };
  }
  if (open !== 0) return { valid: false, error: 'Mismatched brackets: unclosed parentheses' };

  // Extract variables and check against whitelist
  const varMatches = formula.match(/\{(\w+)\}/g);
  if (varMatches) {
    for (const v of varMatches) {
      const name = v.replace(/[{}]/g, '');
      if (!ALLOWED_VAR_NAMES.includes(name)) {
        return { valid: false, error: `Unknown variable "${name}". Allowed: ${ALLOWED_VAR_NAMES.join(', ')}` };
      }
    }
  }

  // Check for dangerous patterns
  const dangerous = [
    { pattern: /function/i, msg: 'Function declarations are not allowed' },
    { pattern: /eval/i, msg: 'Eval is not allowed' },
    { pattern: /import/i, msg: 'Import is not allowed' },
    { pattern: /require/i, msg: 'Require is not allowed' },
    { pattern: /fetch/i, msg: 'Fetch is not allowed' },
    { pattern: /XMLHttpRequest/i, msg: 'XHR is not allowed' },
    { pattern: /constructor/i, msg: 'Constructor access is not allowed' },
    { pattern: /__proto__/i, msg: 'Prototype access is not allowed' },
    { pattern: /prototype/i, msg: 'Prototype access is not allowed' },
    { pattern: /\\x[0-9a-fA-F]{2}/, msg: 'Hex escapes are not allowed' },
    { pattern: /\\u[0-9a-fA-F]{4}/, msg: 'Unicode escapes are not allowed' },
    { pattern: /`/, msg: 'Template literals are not allowed' },
    { pattern: /[;]/, msg: 'Multiple statements are not allowed' },
  ];

  for (const { pattern, msg } of dangerous) {
    if (pattern.test(formula)) {
      return { valid: false, error: msg };
    }
  }

  return { valid: true };
}

// ─── Safe formula evaluation using mathjs ───
function safeEvaluate(formula: string, variables: Record<string, number>): number {
  // Replace {var_name} with actual values
  let expr = formula;
  for (const [key, val] of Object.entries(variables)) {
    // Only replace whitelisted variables
    if (ALLOWED_VAR_NAMES.includes(key)) {
      // Use regex with word boundaries to avoid partial matches
      expr = expr.replace(new RegExp(`\\{${key}\\}`, 'g'), `(${val})`);
    }
  }

  // After substitution, validate again — no remaining { } should exist
  const remaining = expr.match(/\{(\w+)\}/);
  if (remaining) {
    throw new Error(`Unknown variable: ${remaining[1]}`);
  }

  // Use mathjs evaluate — safe, no Function() constructor
  const result = evaluate(expr);
  
  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error(`Invalid calculation result: ${result}`);
  }
  
  return result;
}

// ─── Formula Editor Component ───
function FormulaEditor({
  formula,
  onChange,
  error,
}: {
  formula: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [testValues, setTestValues] = React.useState<Record<string, number>>({
    base_price: 10,
    hours: 3,
    multiplier: 1.5,
    demand_factor: 1.2,
    weekend_multiplier: 1.3,
  });
  const [calcResult, setCalcResult] = React.useState<number | null>(null);
  const [calcError, setCalcError] = React.useState<string | null>(null);

  const insertVariable = (name: string) => {
    const varStr = `{${name}}`;
    // Insert at cursor position or append
    onChange(formula + varStr);
  };

  const runTestCalculation = () => {
    setCalcResult(null);
    setCalcError(null);

    const validation = validateFormula(formula);
    if (!validation.valid) {
      setCalcError(validation.error || 'Invalid formula');
      return;
    }

    try {
      const result = safeEvaluate(formula, testValues);
      setCalcResult(result);
    } catch (e) {
      setCalcError((e as Error).message);
    }
  };

  // Live preview — recalculated on formula or test value change
  const testPreview = React.useMemo(() => {
    const validation = validateFormula(formula);
    if (!validation.valid || !formula) return undefined;

    try {
      return safeEvaluate(formula, testValues);
    } catch {
      return undefined;
    }
  }, [formula, testValues]);

  const validationError = React.useMemo(() => {
    if (!formula) return null;
    const validation = validateFormula(formula);
    return validation.valid ? null : validation.error;
  }, [formula]);

  return (
    <div className="space-y-4">
      {/* Formula Input */}
      <div>
        <label htmlFor="formula" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Formula Expression
        </label>
        <div className={cn(
          'relative rounded-xl border-2 transition-colors',
          (error || validationError) ? 'border-red-400 dark:border-red-500' :
          formula ? 'border-blue-400 dark:border-blue-500' :
          'border-gray-200 dark:border-gray-700'
        )}>
          <Textarea
            id="formula"
            value={formula}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`e.g. {base_price} * {hours} * {multiplier}`}
            className="min-h-[100px] font-mono text-sm border-0 focus-visible:ring-0 resize-y"
            aria-invalid={!!(error || validationError)}
            aria-describedby={error || validationError ? 'formula-error' : undefined}
          />
          {formula && (
            <div className="absolute bottom-2 right-2">
              {validationError ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}
        </div>
        {(error || validationError) && (
          <p id="formula-error" className="mt-1 text-xs text-red-500 flex items-center gap-1" role="alert">
            <AlertCircle className="h-3 w-3" /> {error || validationError}
          </p>
        )}
      </div>

      {/* Variable Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Variable className="h-4 w-4 text-blue-500" />
          Available Variables
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VARIABLES.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => insertVariable(v.name)}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
              aria-label={`Insert variable {${v.name}}`}
            >
              <code className="text-[10px] font-bold">{`{${v.name}}`}</code>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">+</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Templates */}
      <div>
        <label className="mb-2 block text-xs text-gray-500 dark:text-gray-400">Quick Templates</label>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Standard', formula: '{base_price} * {hours}' },
            { name: 'Weekend Rate', formula: '({base_price} * {hours}) * {weekend_multiplier}' },
            { name: 'Dynamic', formula: '{base_price} * {hours} * {multiplier} * {demand_factor}' },
            { name: 'Premium', formula: '{base_price} * {hours} * ({multiplier} + {demand_factor}) / 2' },
          ].map((ex) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => onChange(ex.formula)}
              className="rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-1 text-[10px] text-gray-600 hover:bg-gray-100 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/30 dark:text-gray-400 dark:hover:bg-gray-800 transition-all"
              aria-label={`Apply template: ${ex.name}`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      {formula && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 px-4 py-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5" />
              Live Preview
            </span>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPreview ? 'Hide test values' : 'Configure test values'}
            >
              {showPreview ? 'Hide' : 'Configure test values'}
            </button>
          </div>
          <div className="p-4">
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 overflow-hidden"
                >
                  {AVAILABLE_VARIABLES.map((v) => (
                    <div key={v.name}>
                      <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-0.5">{v.label}</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testValues[v.name] || ''}
                        onChange={(e) => setTestValues({ ...testValues, [v.name]: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-xs"
                        aria-label={`Test value for ${v.name}`}
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <div>
                {testPreview !== undefined ? (
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    = {formatCurrency(testPreview)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Enter formula to see preview</p>
                )}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={runTestCalculation} aria-label="Test calculation">
                <Play className="mr-1 h-3.5 w-3.5" /> Test
              </Button>
            </div>

            {calcResult !== null && (
              <div className="mt-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2" role="status">
                <p className="text-xs text-green-700 dark:text-green-300">
                  Result: <strong>{formatCurrency(calcResult)}</strong>
                </p>
              </div>
            )}
            {calcError && (
              <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2" role="alert">
                <p className="text-xs text-red-600 dark:text-red-400">
                  Error: {calcError}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Pricing Page ───
export default function PricingPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = React.useState('rules');
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<PricingRule | null>(null);
  const [showLogs, setShowLogs] = React.useState(false);
  const [newRule, setNewRule] = React.useState({
    name: '',
    description: '',
    formula: '',
    multiplier: 1,
    is_active: true,
    parking_id: undefined as number | undefined,
  });

  // ─── Fetch Pricing Rules ───
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: queryKeys.pricing.rules.list(),
    queryFn: async () => {
      const res = await api.pricing.rules.list();
      return res.data?.data || res.data || [];
    },
  });

  const pricingRules: PricingRule[] = Array.isArray(rulesData) ? rulesData : rulesData?.data || [];

  // ─── Fetch Pricing Logs ───
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: queryKeys.pricing.logs(0),
    queryFn: async () => {
      const res = await api.pricing.logs(0);
      return res.data?.data || res.data || [];
    },
    enabled: showLogs,
  });

  const pricingLogs: PricingLog[] = Array.isArray(logsData) ? logsData : logsData?.data || [];

  // ─── Create Rule ───
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.pricing.rules.create(data),
    onSuccess: () => {
      success('Rule created', 'Pricing rule has been created');
      // Invalidate ALL pricing rule queries
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      setShowCreateDialog(false);
      setNewRule({ name: '', description: '', formula: '', multiplier: 1, is_active: true, parking_id: undefined });
      setEditingRule(null);
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } } };
      showError('Failed', axiosError?.response?.data?.message || 'Could not create rule');
    },
  });

  // ─── Delete Rule ───
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.pricing.rules.delete(id),
    onSuccess: () => {
      success('Rule deleted', '');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
    onError: () => showError('Error', 'Failed to delete rule'),
  });

  // ─── Toggle Rule Status ───
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.pricing.rules.update(id, { is_active: !is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
  });

  // ─── Formula validation on change ───
  const formulaError = React.useMemo(() => {
    if (!newRule.formula) return null;
    const result = validateFormula(newRule.formula);
    return result.valid ? null : (result.error || null);
  }, [newRule.formula]);

  // ─── Handle Create ───
  const handleCreate = () => {
    if (!newRule.name.trim()) {
      showError('Validation', 'Rule name is required');
      return;
    }
    if (!newRule.formula.trim()) {
      showError('Validation', 'Formula is required');
      return;
    }
    // Client-side formula validation before sending to API
    const validation = validateFormula(newRule.formula);
    if (!validation.valid) {
      showError('Validation Error', validation.error || 'Invalid formula syntax');
      return;
    }
    createMutation.mutate(newRule as unknown as Record<string, unknown>);
  };

  const tabs = [
    { id: 'rules', label: 'Pricing Rules', icon: <FunctionSquare className="h-4 w-4" />, count: pricingRules.length },
    { id: 'logs', label: 'Pricing Logs', icon: <History className="h-4 w-4" />, count: pricingLogs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pricing Engine</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage dynamic pricing formulas
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Pricing Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Rules</p>
              <p className="text-lg font-bold">{pricingRules.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active Rules</p>
              <p className="text-lg font-bold">{pricingRules.filter((r: PricingRule) => r.is_active).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Variable className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Variables</p>
              <p className="text-lg font-bold">{AVAILABLE_VARIABLES.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rulesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent>
                  <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </CardContent>
              </Card>
            ))
          ) : pricingRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calculator className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No pricing rules</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first pricing rule to get started</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            pricingRules.map((rule, idx) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card hover>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{rule.name}</h3>
                          <Badge variant={rule.is_active ? 'success' : 'default'} size="sm">
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" size="sm">Multiplier: {rule.multiplier}x</Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{rule.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <code className="rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-sm font-mono text-blue-600 dark:text-blue-400">
                            {rule.formula}
                          </code>
                          {rule.parking && (
                            <Badge variant="outline" size="sm">
                              {rule.parking.title}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>Updated {formatDate(rule.updated_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4 shrink-0">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleMutation.mutate({ id: rule.id, is_active: rule.is_active })}
                          size="sm"
                          aria-label={`Toggle ${rule.name}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingRule(rule);
                            setNewRule({
                              name: rule.name,
                              description: rule.description || '',
                              formula: rule.formula,
                              multiplier: rule.multiplier,
                              is_active: rule.is_active,
                              parking_id: rule.parking_id,
                            });
                            setShowCreateDialog(true);
                          }}
                          aria-label={`Edit ${rule.name}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => deleteMutation.mutate(rule.id)}
                          aria-label={`Delete ${rule.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Calculation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="h-40 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ) : pricingLogs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500">No pricing logs yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pricingLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3"
                    >
                      <div>
                        <p className="text-xs font-mono text-gray-500">{log.formula}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Base: {formatCurrency(log.base_price)} → Calculated: {formatCurrency(log.calculated_price)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{formatDateTime(log.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}</DialogTitle>
            <DialogDescription>
              Build a dynamic pricing formula using available variables and mathematical expressions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Rule Name */}
            <div>
              <label htmlFor="rule-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rule Name
              </label>
              <Input
                id="rule-name"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="e.g. Weekend Premium Rate"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="rule-desc" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (optional)
              </label>
              <Textarea
                id="rule-desc"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Describe when this rule applies"
                rows={2}
              />
            </div>

            {/* Formula */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Formula
              </label>
              <FormulaEditor
                formula={newRule.formula}
                onChange={(v) => setNewRule({ ...newRule, formula: v })}
                error={formulaError}
              />
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rule-multiplier" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Multiplier
                </label>
                <Input
                  id="rule-multiplier"
                  type="number"
                  step="0.01"
                  value={newRule.multiplier}
                  onChange={(e) => setNewRule({ ...newRule, multiplier: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={newRule.is_active}
                    onCheckedChange={(v) => setNewRule({ ...newRule, is_active: v })}
                    aria-label="Rule active status"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {newRule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingRule(null); }}>Cancel</Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!newRule.name.trim() || !newRule.formula.trim() || !!formulaError}
            >
              <Save className="mr-2 h-4 w-4" />
              {editingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

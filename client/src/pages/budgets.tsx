import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { getOrgUnits, generateKPIs } from '@/lib/finops-data';
import { useMemo, useState } from 'react';
import {
  IconTarget,
  IconPlus,
  IconAlertTriangle,
  IconCircleCheck,
  IconTrendingUp,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function Budgets() {
  const { currency, selectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customBudgets, setCustomBudgets] = useState<{ id: string; name: string; budget: number; spent: number; percentage: number }[]>([]);
  const [form, setForm] = useState({ name: '', budget: '', alertThreshold: '80' });

  const baseBudgetData = useMemo(() => {
    const orgUnits = getOrgUnits(selectedProvider);
    if (selectedOrgUnitId === 'all') {
      return orgUnits.map(unit => {
        const kpis = generateKPIs(unit.id, selectedProvider, dateRange);
        return {
          id: unit.id,
          name: unit.name,
          budget: unit.budget,
          spent: kpis.totalSpend,
          percentage: kpis.budgetUsed,
        };
      });
    }
    const unit = orgUnits.find(u => u.id === selectedOrgUnitId);
    if (!unit) return [];
    const kpis = generateKPIs(selectedOrgUnitId, selectedProvider, dateRange);
    return [{
      id: unit.id,
      name: unit.name,
      budget: unit.budget,
      spent: kpis.totalSpend,
      percentage: kpis.budgetUsed,
    }];
  }, [selectedOrgUnitId, selectedProvider, dateRange]);

  const budgetData = useMemo(() => [...baseBudgetData, ...customBudgets], [baseBudgetData, customBudgets]);

  const totalBudget = budgetData.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const overBudget = budgetData.filter(b => b.percentage > 100).length;
  const atRisk = budgetData.filter(b => b.percentage > 80 && b.percentage <= 100).length;

  const handleCreateBudget = () => {
    if (!form.name.trim() || !form.budget) return;
    const newBudget = {
      id: `custom-${Date.now()}`,
      name: form.name.trim(),
      budget: Number(form.budget),
      spent: 0,
      percentage: 0,
    };
    const threshold = form.alertThreshold;
    setCustomBudgets(prev => [...prev, newBudget]);
    setForm({ name: '', budget: '', alertThreshold: '80' });
    setDialogOpen(false);
    toast({ title: "Budget Created", description: `"${newBudget.name}" budget of ${formatCurrency(newBudget.budget, currency)} has been created with ${threshold}% alert threshold.` });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="budgets-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Budget Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage cloud spending budgets
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setDialogOpen(true)}>
            <IconPlus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: 'Total Budget', value: formatCurrency(totalBudget, currency), icon: IconTarget, color: 'text-primary', isValue: true, tooltip: 'Sum of all allocated budgets across every team, project, or environment.' },
            { label: 'Total Spent', value: formatCurrency(totalSpent, currency), icon: IconTrendingUp, color: 'text-blue-500', isValue: true, tooltip: 'Actual cloud spend to date across all budgets in the current billing period.' },
            { label: 'At Risk', value: atRisk, icon: IconAlertTriangle, color: 'text-amber-500', tooltip: 'Budgets that have consumed 70-100% of their allocation and may overshoot by month end.' },
            { label: 'Over Budget', value: overBudget, icon: IconAlertTriangle, color: 'text-destructive', tooltip: 'Budgets that have already exceeded their allocated spending limit.' },
          ].map((stat, i) => (
            <Tooltip key={stat.label} delayDuration={300}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                          <p className={cn(
                            "font-bold font-mono",
                            stat.isValue ? "text-xl" : "text-2xl"
                          )}>{stat.value}</p>
                        </div>
                        <div className={cn(
                          "p-2.5 rounded-xl",
                          stat.color === 'text-destructive' ? 'bg-destructive/10' :
                          stat.color === 'text-amber-500' ? 'bg-amber-500/10' :
                          stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10'
                        )}>
                          <stat.icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-center">
                <p className="text-xs">{stat.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconTarget className="h-5 w-5 text-primary" />
                Budget Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetData.map((budget, index) => (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="p-4 rounded-lg border border-border bg-background/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{budget.name}</h3>
                        <p className="text-xs text-muted-foreground">Monthly Budget</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {budget.percentage >= 100 ? (
                          <Badge variant="destructive" className="text-xs">
                            <IconAlertTriangle className="h-3 w-3 mr-1" />
                            Over Budget
                          </Badge>
                        ) : budget.percentage >= 80 ? (
                          <Badge className="text-xs bg-amber-500/10 text-amber-500">
                            <IconAlertTriangle className="h-3 w-3 mr-1" />
                            At Risk
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
                            <IconCircleCheck className="h-3 w-3 mr-1" />
                            On Track
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(budget.spent, currency)} of {formatCurrency(budget.budget, currency)}
                        </span>
                        <span className={cn(
                          "font-mono font-medium",
                          budget.percentage >= 100 ? "text-destructive" :
                          budget.percentage >= 80 ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {budget.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(budget.percentage, 100)} 
                        className={cn(
                          "h-2",
                          budget.percentage >= 100 && "[&>div]:bg-destructive",
                          budget.percentage >= 80 && budget.percentage < 100 && "[&>div]:bg-amber-500"
                        )}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="budget-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="budget-name"
                placeholder="Enter budget name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Budget Amount <span className="text-destructive">*</span></Label>
              <Input
                id="budget-amount"
                type="number"
                placeholder="Enter budget amount"
                value={form.budget}
                onChange={(e) => setForm(prev => ({ ...prev, budget: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-threshold">Alert Threshold</Label>
              <Select value={form.alertThreshold} onValueChange={(value) => setForm(prev => ({ ...prev, alertThreshold: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select threshold" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBudget} disabled={!form.name.trim() || !form.budget}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

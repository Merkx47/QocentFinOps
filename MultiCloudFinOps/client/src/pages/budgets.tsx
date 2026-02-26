import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { mockTenants, generateKPIs } from '@/lib/mock-data';
import { useMemo } from 'react';
import { 
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Budgets() {
  const { currency, selectedTenantId } = useFinOpsStore();
  
  const budgetData = useMemo(() => {
    if (selectedTenantId === 'all') {
      return mockTenants.map(tenant => {
        const kpis = generateKPIs(tenant.id);
        return {
          id: tenant.id,
          name: tenant.name,
          budget: tenant.budget,
          spent: kpis.totalSpend,
          percentage: kpis.budgetUsed,
        };
      });
    }
    const tenant = mockTenants.find(t => t.id === selectedTenantId);
    if (!tenant) return [];
    const kpis = generateKPIs(selectedTenantId);
    return [{
      id: tenant.id,
      name: tenant.name,
      budget: tenant.budget,
      spent: kpis.totalSpend,
      percentage: kpis.budgetUsed,
    }];
  }, [selectedTenantId]);

  const totalBudget = budgetData.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const overBudget = budgetData.filter(b => b.percentage > 100).length;
  const atRisk = budgetData.filter(b => b.percentage > 80 && b.percentage <= 100).length;

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
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Budget
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Budget', value: formatCurrency(totalBudget, currency), icon: Target, color: 'text-primary', isValue: true },
            { label: 'Total Spent', value: formatCurrency(totalSpent, currency), icon: TrendingUp, color: 'text-blue-500', isValue: true },
            { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'text-amber-500' },
            { label: 'Over Budget', value: overBudget, icon: AlertTriangle, color: 'text-destructive' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
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
                <Target className="h-5 w-5 text-primary" />
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
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Over Budget
                          </Badge>
                        ) : budget.percentage >= 80 ? (
                          <Badge className="text-xs bg-amber-500/10 text-amber-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            At Risk
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
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
    </ScrollArea>
  );
}

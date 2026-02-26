import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateKPIs } from '@/lib/mock-data';
import { getProviderConfig } from '@/lib/provider-config';
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconWallet, 
  IconServer2, 
  IconBulb,
  IconTarget,
  IconBolt,
  IconPigMoney,
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: typeof IconTrendingUp;
  iconGradient: string;
  delay?: number;
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendLabel,
  icon: Icon,
  iconGradient,
  delay = 0,
}: KPICardProps) {
  const isPositiveTrend = trend !== undefined && trend > 0;
  const isNegativeTrend = trend !== undefined && trend < 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative group">
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-80"
          style={{ background: iconGradient }}
        />
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                {title}
              </p>
              <p className="text-3xl font-bold font-mono tracking-tight text-slate-900 truncate" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {value}
              </p>
              {subtitle && (
                <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
              )}
              {trend !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={isPositiveTrend ? "destructive" : isNegativeTrend ? "secondary" : "secondary"}
                    className={cn(
                      "text-xs font-medium",
                      isNegativeTrend && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    )}
                  >
                    {isPositiveTrend ? (
                      <IconTrendingUp className="h-3 w-3 mr-1" />
                    ) : isNegativeTrend ? (
                      <IconTrendingDown className="h-3 w-3 mr-1" />
                    ) : null}
                    {trend > 0 ? '+' : ''}{trend}%
                  </Badge>
                  {trendLabel && (
                    <span className="text-xs text-slate-400">{trendLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div
              className="p-3 rounded-xl shadow-sm"
              style={{ background: iconGradient }}
            >
              <Icon className={cn("h-5 w-5 text-white")} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function KPICards() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);
  
  const kpis = useMemo(() => generateKPIs(selectedOrgUnitId, selectedProvider), [selectedOrgUnitId, selectedProvider]);

  const providerGradient = config.colors.gradient;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="kpi-cards-grid">
      <KPICard
        title="Total Spend (MTD)"
        value={formatCurrency(kpis.totalSpend, currency)}
        trend={kpis.spendGrowthRate}
        trendLabel="vs last month"
        icon={IconWallet}
        iconGradient={providerGradient}
        delay={0}
      />
      <KPICard
        title="Budget Utilization"
        value={`${kpis.budgetUsed}%`}
        subtitle={`${formatCompactCurrency(kpis.totalSpend, currency)} of ${formatCompactCurrency(kpis.totalBudget, currency)}`}
        icon={IconTarget}
        iconGradient={kpis.budgetUsed > 90 ? "linear-gradient(135deg, #ef4444, #dc2626)" : kpis.budgetUsed > 70 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #10b981, #059669)"}
        delay={0.1}
      />
      <KPICard
        title="Active Resources"
        value={kpis.activeResources.toLocaleString()}
        subtitle={`${formatCurrency(kpis.costPerResource, currency)} avg/resource`}
        icon={IconServer2}
        iconGradient="linear-gradient(135deg, #3b82f6, #2563eb)"
        delay={0.2}
      />
      <KPICard
        title="Potential Savings"
        value={formatCurrency(kpis.potentialSavings, currency)}
        subtitle={`${kpis.optimizationOpportunities} opportunities`}
        icon={IconPigMoney}
        iconGradient="linear-gradient(135deg, #10b981, #059669)"
        delay={0.3}
      />
    </div>
  );
}

export function SecondaryKPIs() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  
  const kpis = useMemo(() => generateKPIs(selectedOrgUnitId, selectedProvider), [selectedOrgUnitId, selectedProvider]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white border-slate-200/80 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Efficiency Score</p>
              <p className="text-2xl font-bold font-mono text-slate-900">{kpis.averageEfficiency}%</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <IconBolt className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white border-slate-200/80 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Optimization Opportunities</p>
              <p className="text-2xl font-bold font-mono text-slate-900">{kpis.optimizationOpportunities}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
              <IconBulb className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white border-slate-200/80 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Cost per Resource</p>
              <p className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(kpis.costPerResource, currency)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <IconServer2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

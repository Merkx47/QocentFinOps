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
  iconBg: string;
  iconColor: string;
  delay?: number;
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendLabel,
  icon: Icon,
  iconBg,
  iconColor,
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
            <div className={cn("p-3 rounded-xl", iconBg)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="kpi-cards-grid">
      <KPICard
        title="Total Spend (MTD)"
        value={formatCurrency(kpis.totalSpend, currency)}
        trend={kpis.spendGrowthRate}
        trendLabel="vs last month"
        icon={IconWallet}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        delay={0}
      />
      <KPICard
        title="Budget Utilization"
        value={`${kpis.budgetUsed}%`}
        subtitle={`${formatCompactCurrency(kpis.totalSpend, currency)} of ${formatCompactCurrency(kpis.totalBudget, currency)}`}
        icon={IconTarget}
        iconBg={kpis.budgetUsed > 90 ? "bg-red-500/10" : kpis.budgetUsed > 70 ? "bg-amber-500/10" : "bg-emerald-500/10"}
        iconColor={kpis.budgetUsed > 90 ? "text-red-500" : kpis.budgetUsed > 70 ? "text-amber-500" : "text-emerald-500"}
        delay={0.1}
      />
      <KPICard
        title="Active Resources"
        value={kpis.activeResources.toLocaleString()}
        subtitle={`${formatCurrency(kpis.costPerResource, currency)} avg/resource`}
        icon={IconServer2}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-500"
        delay={0.2}
      />
      <KPICard
        title="Potential Savings"
        value={formatCurrency(kpis.potentialSavings, currency)}
        subtitle={`${kpis.optimizationOpportunities} opportunities`}
        icon={IconPigMoney}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-500"
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
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <IconBolt className="h-5 w-5 text-emerald-500" />
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
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <IconBulb className="h-5 w-5 text-amber-500" />
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
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <IconServer2 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

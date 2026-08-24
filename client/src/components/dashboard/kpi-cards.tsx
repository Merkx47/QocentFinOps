import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateKPIs } from '@/lib/finops-data';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  tooltip?: string;
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
  tooltip,
}: KPICardProps) {
  const isPositiveTrend = trend !== undefined && trend > 0;
  const isNegativeTrend = trend !== undefined && trend < 0;

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative group">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {title}
              </p>
              <p className="text-3xl font-bold font-mono tracking-tight text-foreground truncate" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {value}
              </p>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
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
                    <span className="text-xs text-muted-foreground">{trendLabel}</span>
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

  if (!tooltip) return card;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px] text-center">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function KPICards() {
  const { currency, selectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);

  const kpis = useMemo(() => generateKPIs(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 [&>*]:min-w-0" data-testid="kpi-cards-grid">
      <KPICard
        title="Total Spend (MTD)"
        value={formatCurrency(kpis.totalSpend, currency)}
        trend={kpis.spendGrowthRate}
        trendLabel="vs last month"
        icon={IconWallet}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        delay={0}
        tooltip="Total cloud expenditure accumulated from the 1st of the current month to today."
      />
      <KPICard
        title="Budget Utilization"
        value={`${kpis.budgetUsed}%`}
        subtitle={`${formatCompactCurrency(kpis.totalSpend, currency)} of ${formatCompactCurrency(kpis.totalBudget, currency)}`}
        icon={IconTarget}
        iconBg={kpis.budgetUsed > 90 ? "bg-red-500/10" : kpis.budgetUsed > 70 ? "bg-amber-500/10" : "bg-emerald-500/10"}
        iconColor={kpis.budgetUsed > 90 ? "text-red-500" : kpis.budgetUsed > 70 ? "text-amber-500" : "text-emerald-500"}
        delay={0.1}
        tooltip="Percentage of the allocated monthly budget that has been consumed so far in this billing cycle."
      />
      <KPICard
        title="Active Resources"
        value={kpis.activeResources.toLocaleString()}
        subtitle={`${formatCurrency(kpis.costPerResource, currency)} avg/resource`}
        icon={IconServer2}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-500"
        delay={0.2}
        tooltip="Count of all provisioned cloud resources (VMs, databases, storage, etc.) currently running and incurring cost."
      />
      <KPICard
        title="Potential Savings"
        value={formatCurrency(kpis.potentialSavings, currency)}
        subtitle={`${kpis.optimizationOpportunities} opportunities`}
        icon={IconPigMoney}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-500"
        delay={0.3}
        tooltip="Estimated monthly cost reduction achievable by acting on rightsizing, idle resource, and reserved instance recommendations."
      />
    </div>
  );
}

export function SecondaryKPIs() {
  const { currency, selectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();

  const kpis = useMemo(() => generateKPIs(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);

  const secondaryCards = [
    {
      label: 'Efficiency Score',
      value: `${kpis.averageEfficiency}%`,
      iconBg: 'bg-emerald-500/10',
      icon: <IconBolt className="h-5 w-5 text-emerald-500" />,
      tooltip: 'Average resource utilization across all services. Higher is better — indicates less idle capacity.',
    },
    {
      label: 'Optimization Opportunities',
      value: kpis.optimizationOpportunities.toString(),
      iconBg: 'bg-amber-500/10',
      icon: <IconBulb className="h-5 w-5 text-amber-500" />,
      tooltip: 'Number of actionable recommendations available to reduce costs, such as rightsizing or deleting unused resources.',
    },
    {
      label: 'Cost per Resource',
      value: formatCurrency(kpis.costPerResource, currency),
      iconBg: 'bg-blue-500/10',
      icon: <IconServer2 className="h-5 w-5 text-blue-500" />,
      tooltip: 'Average monthly cost per active cloud resource. A lower value indicates better cost efficiency.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&>*]:min-w-0">
      {secondaryCards.map((card) => (
        <Tooltip key={card.label} delayDuration={300}>
          <TooltipTrigger asChild>
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                    <p className="text-2xl font-bold font-mono text-foreground">{card.value}</p>
                  </div>
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", card.iconBg)}>
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-center">
            <p className="text-xs">{card.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

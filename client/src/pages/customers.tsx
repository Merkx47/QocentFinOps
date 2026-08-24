import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFinOpsStore, formatCompactCurrency } from '@/lib/finops-store';
import { getCustomers } from '@/lib/customers';
import { generateKPIs, generateServiceBreakdown, withCustomerScope } from '@/lib/finops-data';
import {
  IconBriefcase,
  IconSearch,
  IconChartBar,
  IconBolt,
  IconBuildingSkyscraper,
  IconArrowRight,
  IconMail,
  IconWorld,
  IconCheck,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';

export default function Customers() {
  const {
    currency,
    selectedProvider,
    dateRange,
    selectedCustomerId,
    setSelectedCustomerId,
    setSelectedOrgUnitId,
  } = useFinOpsStore();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const customers = useMemo(() => getCustomers(selectedProvider), [selectedProvider]);

  const summaries = useMemo(
    () =>
      customers.map(customer =>
        withCustomerScope(customer.id, () => {
          const kpis = generateKPIs('all', selectedProvider, dateRange);
          const services = generateServiceBreakdown('all', selectedProvider, dateRange);
          return { customer, kpis, topService: services[0]?.service ?? 'EC2' };
        })
      ),
    [customers, selectedProvider, dateRange]
  );

  const filtered = useMemo(
    () =>
      summaries.filter(
        s =>
          s.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customer.industry.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [summaries, searchQuery]
  );

  const stats = useMemo(() => {
    const totalSpend = summaries.reduce((sum, s) => sum + s.kpis.totalSpend, 0);
    const totalAccounts = summaries.reduce((sum, s) => sum + s.customer.accountCount, 0);
    const avgEfficiency = summaries.length
      ? summaries.reduce((sum, s) => sum + s.customer.efficiencyScore, 0) / summaries.length
      : 0;
    return { totalSpend, totalAccounts, avgEfficiency };
  }, [summaries]);

  const maxSpend = Math.max(1, ...summaries.map(s => s.kpis.totalSpend));

  const applyFilter = (customerId: string | 'all') => {
    setSelectedCustomerId(customerId);
    setSelectedOrgUnitId('all');
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="customers-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cloud spend and optimization posture for every customer in the portfolio
            </p>
          </div>
          {selectedCustomerId !== 'all' && (
            <Button variant="outline" onClick={() => applyFilter('all')} data-testid="button-clear-customer">
              Clear filter
            </Button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: 'Customers', value: customers.length, icon: IconBriefcase, color: 'text-primary', tooltip: 'Customers currently onboarded onto the platform.' },
            { label: 'Portfolio Spend', value: formatCompactCurrency(stats.totalSpend, currency), icon: IconChartBar, color: 'text-emerald-500', tooltip: 'Combined spend across every customer for the selected period.' },
            { label: 'Linked Accounts', value: stats.totalAccounts, icon: IconBuildingSkyscraper, color: 'text-blue-500', tooltip: 'Total AWS member accounts across all customers.' },
            { label: 'Avg Efficiency', value: `${stats.avgEfficiency.toFixed(0)}%`, icon: IconBolt, color: 'text-amber-500', tooltip: 'Mean resource utilization score across customers. Higher is better.' },
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
                          <p className="text-2xl font-bold font-mono">{stat.value}</p>
                        </div>
                        <div className={cn(
                          "p-2.5 rounded-xl",
                          stat.color === 'text-emerald-500' ? 'bg-emerald-500/10' :
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconBriefcase className="h-5 w-5 text-primary" />
                  All Customers
                  <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
                </CardTitle>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[250px]"
                    data-testid="input-search-customers"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="customers-grid">
                {filtered.map((summary, index) => {
                  const { customer, kpis, topService } = summary;
                  const isSelected = selectedCustomerId === customer.id;
                  const budgetUsage = Math.min(100, kpis.budgetUsed);

                  return (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                    >
                      <div
                        className={cn(
                          "p-4 rounded-xl border bg-background/50 hover-elevate cursor-pointer h-full",
                          isSelected ? "border-primary ring-1 ring-primary/40" : "border-border"
                        )}
                        onClick={() => applyFilter(customer.id)}
                        data-testid={`customer-card-${customer.id}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                              {isSelected && (
                                <Badge className="h-5 px-1.5 text-[10px] gap-1">
                                  <IconCheck className="h-3 w-3" />
                                  Filtering
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{customer.industry}</p>
                          </div>
                          <Badge variant="secondary" className="text-[11px] flex-shrink-0">
                            {customer.accountCount} accounts
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-0.5">Spend</p>
                            <p className="text-lg font-bold font-mono">{formatCompactCurrency(kpis.totalSpend, currency)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-0.5">Potential Savings</p>
                            <p className="text-lg font-bold font-mono text-emerald-500">
                              {formatCompactCurrency(kpis.potentialSavings, currency)}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-muted-foreground">Budget used</span>
                            <span className="font-mono font-medium">{kpis.budgetUsed.toFixed(1)}%</span>
                          </div>
                          <Progress value={budgetUsage} className="h-1.5" />
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-muted-foreground">Share of portfolio</span>
                            <span className="font-mono font-medium">
                              {((kpis.totalSpend / maxSpend) * 100).toFixed(0)}% of largest
                            </span>
                          </div>
                          <Progress value={(kpis.totalSpend / maxSpend) * 100} className="h-1.5" />
                        </div>

                        <div className="space-y-1.5 text-[11px] text-muted-foreground border-t border-border pt-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <IconWorld className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{customer.primaryRegion}</span>
                            <span className="ml-auto flex-shrink-0">Top service: <span className="text-foreground font-medium">{topService}</span></span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <IconMail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{customer.contactEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconBolt className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>Efficiency <span className="text-foreground font-medium">{customer.efficiencyScore}%</span></span>
                            <span className="ml-auto">{kpis.activeResources} resources</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-3 justify-between text-primary hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFilter(customer.id);
                            navigate('/dashboard');
                          }}
                          data-testid={`button-view-${customer.id}`}
                        >
                          View dashboard
                          <IconArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}

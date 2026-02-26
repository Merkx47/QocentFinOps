import { KPICards, SecondaryKPIs } from '@/components/dashboard/kpi-cards';
import { CostTrendChart } from '@/components/dashboard/cost-trend-chart';
import { ServiceBreakdownChart, ServiceBreakdownTable } from '@/components/dashboard/service-breakdown';
import { RegionBreakdownChart } from '@/components/dashboard/region-breakdown';
import { RecommendationsPanel } from '@/components/dashboard/recommendations-panel';
import { BudgetGauge } from '@/components/dashboard/budget-gauge';
import { TenantComparison, TenantStatsCard } from '@/components/dashboard/tenant-comparison';
import { ResourceHeatmap } from '@/components/dashboard/resource-heatmap';
import { useFinOpsStore } from '@/lib/finops-store';
import { mockTenants } from '@/lib/mock-data';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Dashboard() {
  const { selectedTenantId } = useFinOpsStore();
  
  const tenantName = useMemo(() => {
    if (selectedTenantId === 'all') return 'All Tenants';
    return mockTenants.find(t => t.id === selectedTenantId)?.name || 'Unknown';
  }, [selectedTenantId]);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="dashboard-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
            FinOps Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cloud cost analytics and optimization for{' '}
            <span className="text-foreground font-medium">{tenantName}</span>
          </p>
        </motion.div>

        <div className="space-y-6">
          <KPICards />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <CostTrendChart />
            </div>
            <div>
              <BudgetGauge />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ServiceBreakdownChart />
            <RegionBreakdownChart />
          </div>

          <RecommendationsPanel />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ResourceHeatmap />
            </div>
            <div className="space-y-6">
              {selectedTenantId === 'all' && <TenantStatsCard />}
              <TenantComparison />
            </div>
          </div>

          <ServiceBreakdownTable />
        </div>
      </div>
    </ScrollArea>
  );
}

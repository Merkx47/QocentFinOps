import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateTenantSummaries, mockTenants } from '@/lib/mock-data';
import { serviceInfo } from '@shared/schema';
import { useMemo } from 'react';
import { 
  Users,
  ArrowRight,
  Building2,
  TrendingUp,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

export function TenantComparison() {
  const { currency, setSelectedTenantId } = useFinOpsStore();
  
  const summaries = useMemo(() => generateTenantSummaries(), []);
  const topTenants = summaries.sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);
  const maxSpend = Math.max(...topTenants.map(t => t.totalSpend));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Tenant Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Top 5 tenants by spend
            </p>
          </div>
          <Link href="/tenants">
            <Button variant="outline" size="sm" data-testid="button-view-all-tenants">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="tenant-comparison-list">
            {topTenants.map((summary, index) => (
              <motion.div
                key={summary.tenant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                className="group"
              >
                <div 
                  className="p-3 rounded-lg border border-border bg-background/50 hover-elevate cursor-pointer"
                  onClick={() => setSelectedTenantId(summary.tenant.id)}
                  data-testid={`tenant-card-${summary.tenant.id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium truncate">{summary.tenant.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{summary.tenant.industry}</span>
                          <span>-</span>
                          <span>{summary.tenant.country}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-mono font-bold">{formatCompactCurrency(summary.totalSpend, currency)}</p>
                      <p className="text-xs text-muted-foreground">this month</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Spend vs max</span>
                      <span className="font-mono">{((summary.totalSpend / maxSpend) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={(summary.totalSpend / maxSpend) * 100} 
                      className="h-1.5"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Zap className={cn(
                          "h-3.5 w-3.5",
                          summary.efficiencyScore >= 80 ? "text-emerald-500" :
                          summary.efficiencyScore >= 60 ? "text-amber-500" : "text-destructive"
                        )} />
                        <span className="text-xs font-mono">{summary.efficiencyScore}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-mono">{summary.recommendationCount}</span>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${serviceInfo[summary.topService]?.color}20`,
                        color: serviceInfo[summary.topService]?.color,
                      }}
                    >
                      Top: {summary.topService}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TenantStatsCard() {
  const summaries = useMemo(() => generateTenantSummaries(), []);
  
  const avgEfficiency = summaries.reduce((sum, s) => sum + s.efficiencyScore, 0) / summaries.length;
  const totalRecommendations = summaries.reduce((sum, s) => sum + s.recommendationCount, 0);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-card-border">
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold font-mono">{mockTenants.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Tenants</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{avgEfficiency.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Efficiency</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono">{totalRecommendations}</p>
            <p className="text-xs text-muted-foreground mt-1">Recommendations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

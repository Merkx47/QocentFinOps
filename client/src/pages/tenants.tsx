import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateTenantSummaries, mockTenants } from '@/lib/mock-data';
import { serviceInfo } from '@shared/schema';
import { useMemo, useState } from 'react';
import { 
  Users,
  Search,
  Building2,
  Zap,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Mail,
  Globe,
  BarChart3,
  Target,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Tenants() {
  const { currency, setSelectedTenantId } = useFinOpsStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const summaries = useMemo(() => generateTenantSummaries(), []);
  
  const filteredTenants = useMemo(() => {
    return summaries.filter(s => 
      s.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tenant.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tenant.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [summaries, searchQuery]);

  const stats = useMemo(() => {
    const totalSpend = summaries.reduce((sum, s) => sum + s.totalSpend, 0);
    const avgEfficiency = summaries.reduce((sum, s) => sum + s.efficiencyScore, 0) / summaries.length;
    const totalRecommendations = summaries.reduce((sum, s) => sum + s.recommendationCount, 0);
    return { totalSpend, avgEfficiency, totalRecommendations };
  }, [summaries]);

  const maxSpend = Math.max(...summaries.map(s => s.totalSpend));

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="tenants-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tenant Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-tenant cost analytics and comparison
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Building2 className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Tenants', value: mockTenants.length, icon: Users, color: 'text-primary' },
            { label: 'Combined Spend', value: formatCurrency(stats.totalSpend, currency), icon: BarChart3, color: 'text-emerald-500', isValue: true },
            { label: 'Avg Efficiency', value: `${stats.avgEfficiency.toFixed(0)}%`, icon: Zap, color: 'text-amber-500' },
            { label: 'Pending Actions', value: stats.totalRecommendations, icon: Lightbulb, color: 'text-blue-500' },
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
                  <Building2 className="h-5 w-5 text-primary" />
                  All Tenants
                  <Badge variant="secondary" className="ml-2">{filteredTenants.length}</Badge>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[250px]"
                    data-testid="input-search-tenants"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="tenants-grid">
                {filteredTenants.map((summary, index) => (
                  <motion.div
                    key={summary.tenant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <div 
                      className="p-4 rounded-xl border border-border bg-background/50 hover-elevate cursor-pointer"
                      onClick={() => setSelectedTenantId(summary.tenant.id)}
                      data-testid={`tenant-card-${summary.tenant.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{summary.tenant.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{summary.tenant.industry}</span>
                              <span>-</span>
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {summary.tenant.country}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={summary.tenant.status === 'active' ? 'secondary' : 'outline'}
                          className={cn(
                            "text-xs capitalize",
                            summary.tenant.status === 'active' && "bg-emerald-500/10 text-emerald-500"
                          )}
                        >
                          {summary.tenant.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Monthly Spend</span>
                            <span className="font-mono font-medium">{formatCompactCurrency(summary.totalSpend, currency)}</span>
                          </div>
                          <Progress 
                            value={(summary.totalSpend / maxSpend) * 100} 
                            className="h-1.5"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Budget Utilization</span>
                            <span className={cn(
                              "font-mono font-medium",
                              summary.budgetUsage > 90 ? "text-destructive" :
                              summary.budgetUsage > 70 ? "text-amber-500" : "text-emerald-500"
                            )}>{summary.budgetUsage.toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(summary.budgetUsage, 100)} 
                            className={cn(
                              "h-1.5",
                              summary.budgetUsage > 90 && "[&>div]:bg-destructive",
                              summary.budgetUsage > 70 && summary.budgetUsage <= 90 && "[&>div]:bg-amber-500"
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Zap className={cn(
                              "h-4 w-4",
                              summary.efficiencyScore >= 80 ? "text-emerald-500" :
                              summary.efficiencyScore >= 60 ? "text-amber-500" : "text-destructive"
                            )} />
                            <span className="text-sm font-mono">{summary.efficiencyScore}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-mono">{summary.recommendationCount}</span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${serviceInfo[summary.topService]?.color}20`,
                              color: serviceInfo[summary.topService]?.color,
                            }}
                          >
                            {summary.topService}
                          </Badge>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{summary.tenant.contactEmail}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredTenants.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tenants Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}

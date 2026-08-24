import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateRecommendations } from '@/lib/finops-data';
import { getServiceInfo } from '@/lib/provider-config';
import type { Recommendation, RecommendationType, RecommendationImpact } from '@shared/schema';
import { useMemo, useState } from 'react';
import { 
  IconBulb,
  IconTrendingDown,
  IconServer2,
  IconDatabase,
  IconDeviceSdCard,
  IconNetwork,
  IconGauge,
  IconCircleCheck,
  IconClock,
  IconAlertTriangle,
  IconFilter,
  IconArrowUpRight,
  IconBolt,
  IconTarget,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const typeIcons: Record<string, typeof IconServer2> = {
  rightsizing: IconGauge,
  idle_resource: IconServer2,
  reserved_instance: IconDatabase,
  storage_optimization: IconDeviceSdCard,
  network_optimization: IconNetwork,
  database_tuning: IconDatabase,
  savings_plans: IconDatabase,
  ebs_optimization: IconDeviceSdCard,
  hybrid_benefit: IconServer2,
  spot_vms: IconServer2,
  committed_use_discount: IconDatabase,
  committed_use: IconDatabase,
  sustained_use: IconGauge,
  preemptible_vms: IconServer2,
  gcp_cud: IconDatabase,
  ri_conversion: IconDatabase,
};

const typeLabels: Record<string, string> = {
  rightsizing: 'Rightsizing',
  idle_resource: 'Idle Resource',
  reserved_instance: 'Reserved Instance',
  storage_optimization: 'Storage Optimization',
  network_optimization: 'Network Optimization',
  database_tuning: 'Database Tuning',
  savings_plans: 'Savings Plan',
  ebs_optimization: 'EBS',
  hybrid_benefit: 'Hybrid Benefit',
  spot_vms: 'Spot VMs',
  committed_use_discount: 'CUD',
  committed_use: 'CUD',
  sustained_use: 'Sustained Use',
  preemptible_vms: 'Preemptible',
  gcp_cud: 'CUD',
  ri_conversion: 'RI Conversion',
};

const impactColors: Record<RecommendationImpact, { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
};

const statusInfo = {
  new: { icon: IconAlertTriangle, label: 'New', color: 'text-amber-500' },
  in_progress: { icon: IconClock, label: 'In Progress', color: 'text-blue-500' },
  implemented: { icon: IconCircleCheck, label: 'Implemented', color: 'text-emerald-500' },
  dismissed: { icon: null, label: 'Dismissed', color: 'text-muted-foreground' },
};

export default function Recommendations() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [implementedIds, setImplementedIds] = useState<Set<string>>(new Set());
  const [detailRec, setDetailRec] = useState<Recommendation | null>(null);

  const serviceInfo = useMemo(() => getServiceInfo(selectedProvider), [selectedProvider]);

  const recommendations = useMemo(() => generateRecommendations(selectedOrgUnitId, selectedProvider), [selectedOrgUnitId, selectedProvider]);

  const enhancedRecommendations = useMemo(() => {
    return recommendations.map(r =>
      implementedIds.has(r.id) ? { ...r, status: 'implemented' as const } : r
    );
  }, [recommendations, implementedIds]);
  
  const filteredRecommendations = useMemo(() => {
    return enhancedRecommendations.filter(r => {
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      const matchesImpact = impactFilter === 'all' || r.impact === impactFilter;
      return matchesType && matchesImpact;
    });
  }, [enhancedRecommendations, typeFilter, impactFilter]);

  const stats = useMemo(() => {
    const newCount = enhancedRecommendations.filter(r => r.status === 'new').length;
    const totalSavings = enhancedRecommendations.filter(r => r.status === 'new').reduce((sum, r) => sum + r.projectedSavings, 0);
    const highImpact = enhancedRecommendations.filter(r => r.impact === 'high' && r.status === 'new').length;
    const easyWins = enhancedRecommendations.filter(r => r.effort === 'easy' && r.status === 'new').length;
    return { newCount, totalSavings, highImpact, easyWins };
  }, [enhancedRecommendations]);

  const byType = enhancedRecommendations.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = { count: 0, savings: 0 };
    acc[r.type].count++;
    acc[r.type].savings += r.projectedSavings;
    return acc;
  }, {} as Record<RecommendationType, { count: number; savings: number }>);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="recommendations-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cost Optimization</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered recommendations to reduce your cloud spend
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" data-testid="button-implement-all" onClick={() => {
            const easyWinRecs = enhancedRecommendations.filter(r => r.effort === 'easy' && r.status === 'new');
            if (easyWinRecs.length === 0) {
              toast({ title: "No Easy Wins Available", description: "There are no new easy-effort recommendations to implement." });
              return;
            }
            const newIds = new Set(implementedIds);
            easyWinRecs.forEach(r => newIds.add(r.id));
            setImplementedIds(newIds);
            toast({ title: "Easy Wins Implemented", description: `Successfully implemented ${easyWinRecs.length} easy-win optimizations.` });
          }}>
            <IconBolt className="h-4 w-4 mr-2" />
            Implement Easy Wins
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: 'New Recommendations', value: stats.newCount, icon: IconBulb, color: 'text-amber-500', tooltip: 'Newly identified optimization opportunities that have not yet been reviewed or acted on.' },
            { label: 'Potential Savings', value: formatCurrency(stats.totalSavings, currency), icon: IconTrendingDown, color: 'text-emerald-500', isValue: true, tooltip: 'Total estimated monthly savings if all current recommendations are implemented.' },
            { label: 'High Impact', value: stats.highImpact, icon: IconTarget, color: 'text-primary', tooltip: 'Recommendations with significant cost savings potential, typically over $500/month per item.' },
            { label: 'Easy Wins', value: stats.easyWins, icon: IconBolt, color: 'text-blue-500', tooltip: 'Low-effort optimizations that can be implemented quickly with minimal risk to workloads.' },
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
                        <div className={cn("p-2.5 rounded-xl", stat.color === 'text-emerald-500' ? 'bg-emerald-500/10' : stat.color === 'text-amber-500' ? 'bg-amber-500/10' : stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10')}>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">By Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(Object.entries(byType) as [RecommendationType, { count: number; savings: number }][]).map(([type, data]) => {
                  const Icon = typeIcons[type] || IconServer2;
                  return (
                    <div 
                      key={type}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer hover-elevate",
                        typeFilter === type ? "bg-primary/10 border-primary" : "border-border"
                      )}
                      onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{typeLabels[type] || type}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{data.count}</Badge>
                      </div>
                      <p className="text-sm font-mono text-emerald-500">
                        {formatCompactCurrency(data.savings, currency)} potential
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-3"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconBulb className="h-5 w-5 text-amber-500" />
                    Recommendations
                    <Badge variant="secondary" className="ml-2">{filteredRecommendations.length}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Select value={impactFilter} onValueChange={setImpactFilter}>
                      <SelectTrigger className="w-[130px]" data-testid="select-impact-filter">
                        <SelectValue placeholder="Impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Impact</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => { setTypeFilter('all'); setImpactFilter('all'); }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredRecommendations.map((rec, index) => {
                  const Icon = typeIcons[rec.type] || IconServer2;
                  const StatusIcon = statusInfo[rec.status].icon;
                  const impact = impactColors[rec.impact];
                  
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                    >
                      <div 
                        className="p-4 rounded-lg border border-border bg-background/50 hover-elevate cursor-pointer"
                        data-testid={`recommendation-${rec.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div 
                            className="p-3 rounded-xl flex-shrink-0"
                            style={{ backgroundColor: `${serviceInfo[rec.service]?.color}15` }}
                          >
                            <Icon 
                              className="h-5 w-5" 
                              style={{ color: serviceInfo[rec.service]?.color }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="text-base font-semibold">{rec.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ 
                                      backgroundColor: `${serviceInfo[rec.service]?.color}20`,
                                      color: serviceInfo[rec.service]?.color,
                                    }}
                                  >
                                    {rec.service}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{rec.resourceName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {StatusIcon && (
                                  <StatusIcon className={cn("h-4 w-4", statusInfo[rec.status].color)} />
                                )}
                                <Badge 
                                  variant="outline"
                                  className={cn("text-xs border", impact.bg, impact.text, impact.border)}
                                >
                                  {rec.impact.toUpperCase()} IMPACT
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                              {rec.description}
                            </p>
                            
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Current Cost</p>
                                  <p className="text-sm font-mono">{formatCurrency(rec.currentCost, currency)}/mo</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Effort</p>
                                  <Badge variant="secondary" className="text-xs capitalize">{rec.effort}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Potential Savings</p>
                                  <div className="flex items-center gap-1 text-emerald-500">
                                    <IconTrendingDown className="h-4 w-4" />
                                    <span className="text-lg font-mono font-bold">
                                      {formatCurrency(rec.projectedSavings, currency)}
                                    </span>
                                    <span className="text-xs">/mo</span>
                                  </div>
                                </div>
                                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setDetailRec(rec)}>
                                  View Details
                                  <IconArrowUpRight className="h-4 w-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {filteredRecommendations.length === 0 && (
                  <div className="text-center py-12">
                    <IconCircleCheck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recommendations Found</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeFilter !== 'all' || impactFilter !== 'all' 
                        ? 'Try adjusting your filters to see more recommendations.'
                        : 'Great job! Your cloud resources are well optimized.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Sheet open={!!detailRec} onOpenChange={(open) => { if (!open) setDetailRec(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {detailRec && (() => {
            const Icon = typeIcons[detailRec.type] || IconServer2;
            const impact = impactColors[detailRec.impact];
            const isImplemented = detailRec.status === 'implemented';
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{detailRec.title}</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    {detailRec.service} &mdash; {detailRec.resourceName}
                  </p>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <Badge variant="secondary" className="text-xs">
                      <Icon className="h-3 w-3 mr-1" />
                      {typeLabels[detailRec.type] || detailRec.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Impact</span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs border", impact.bg, impact.text, impact.border)}
                    >
                      {detailRec.impact.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Effort</span>
                    <Badge variant="secondary" className="text-xs capitalize">{detailRec.effort}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", statusInfo[detailRec.status].color)}
                    >
                      {statusInfo[detailRec.status].label}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-6 leading-relaxed">
                  {detailRec.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Monthly Cost</p>
                    <p className="text-2xl font-mono font-bold">{formatCurrency(detailRec.currentCost, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Projected Savings</p>
                    <p className="text-2xl font-mono font-bold text-emerald-500">{formatCurrency(detailRec.projectedSavings, currency)}</p>
                  </div>
                </div>

                <SheetFooter className="mt-8">
                  <Button variant="outline" onClick={() => setDetailRec(null)}>Close</Button>
                  {isImplemented ? (
                    <Button disabled>Already Implemented</Button>
                  ) : (
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => {
                        const newIds = new Set(implementedIds);
                        newIds.add(detailRec.id);
                        setImplementedIds(newIds);
                        toast({ title: "Recommendation Implemented", description: `"${detailRec.title}" has been implemented.` });
                        setDetailRec(null);
                      }}
                    >
                      Implement Now
                    </Button>
                  )}
                </SheetFooter>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </ScrollArea>
  );
}

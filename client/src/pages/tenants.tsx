import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateOrgUnitSummaries, getOrgUnits } from '@/lib/mock-data';
import { getServiceInfo, getProviderConfig, OrgUnit } from '@/lib/provider-config';
import { useMemo, useState } from 'react';
import {
  IconUsersGroup,
  IconSearch,
  IconBuildingSkyscraper,
  IconBolt,
  IconBulb,
  IconTrendingUp,
  IconArrowRight,
  IconMail,
  IconWorld,
  IconChartBar,
  IconTarget,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function Tenants() {
  const { currency, setSelectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customUnits, setCustomUnits] = useState<OrgUnit[]>([]);
  const [form, setForm] = useState({ name: '', description: '', environment: 'production', budget: '' });

  const config = getProviderConfig(selectedProvider);
  const serviceInfo = useMemo(() => getServiceInfo(selectedProvider), [selectedProvider]);
  const orgUnits = useMemo(() => getOrgUnits(selectedProvider), [selectedProvider]);
  const baseSummaries = useMemo(() => generateOrgUnitSummaries(selectedProvider, dateRange), [selectedProvider, dateRange]);

  const summaries = useMemo(() => {
    const customSummaries = customUnits.map(unit => ({
      orgUnit: unit,
      totalSpend: 0,
      budgetUsage: 0,
      efficiencyScore: 100,
      topService: config.services[0],
      recommendationCount: 0,
    }));
    return [...baseSummaries, ...customSummaries];
  }, [baseSummaries, customUnits, config.services]);

  const handleAddUnit = () => {
    if (!form.name.trim()) return;
    const newUnit: OrgUnit = {
      id: `custom-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim() || 'Custom account',
      environment: form.environment,
      primaryRegion: config.regions[0],
      contactName: '',
      contactEmail: '',
      budget: Number(form.budget) || 0,
      efficiencyScore: 100,
      status: 'active',
    };
    setCustomUnits(prev => [...prev, newUnit]);
    setForm({ name: '', description: '', environment: 'production', budget: '' });
    setDialogOpen(false);
    toast({ title: `${config.hierarchy.orgUnitLabel} Created`, description: `"${newUnit.name}" has been added successfully.` });
  };
  
  const filteredSummaries = useMemo(() => {
    return summaries.filter(s => 
      s.orgUnit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orgUnit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orgUnit.environment.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-2xl font-bold text-foreground">{config.hierarchy.managementPageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {config.hierarchy.managementPageSubtitle}
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setDialogOpen(true)}>
            <IconBuildingSkyscraper className="h-4 w-4 mr-2" />
            {config.hierarchy.addButtonLabel}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: `Total ${config.hierarchy.orgUnitLabelPlural}`, value: orgUnits.length, icon: IconUsersGroup, color: 'text-primary', tooltip: `Total number of ${config.hierarchy.orgUnitLabelPlural.toLowerCase()} configured for cost tracking and management.` },
            { label: 'Combined Spend', value: formatCompactCurrency(stats.totalSpend, currency), icon: IconChartBar, color: 'text-emerald-500', tooltip: `Aggregate monthly cloud spend across all ${config.hierarchy.orgUnitLabelPlural.toLowerCase()}.` },
            { label: 'Avg Efficiency', value: `${stats.avgEfficiency.toFixed(0)}%`, icon: IconBolt, color: 'text-amber-500', tooltip: 'Mean resource utilization score across all accounts. Higher is better.' },
            { label: 'Pending Actions', value: stats.totalRecommendations, icon: IconBulb, color: 'text-blue-500', tooltip: 'Total unresolved optimization recommendations across all accounts awaiting review.' },
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
                  <IconBuildingSkyscraper className="h-5 w-5 text-primary" />
                  All {config.hierarchy.orgUnitLabelPlural}
                  <Badge variant="secondary" className="ml-2">{filteredSummaries.length}</Badge>
                </CardTitle>
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${config.hierarchy.orgUnitLabelPlural.toLowerCase()}...`}
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
                {filteredSummaries.map((summary, index) => (
                  <motion.div
                    key={summary.orgUnit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <div 
                      className="p-4 rounded-xl border border-border bg-background/50 hover-elevate cursor-pointer"
                      onClick={() => {
                        setSelectedOrgUnitId(summary.orgUnit.id);
                        navigate('/dashboard');
                      }}
                      data-testid={`tenant-card-${summary.orgUnit.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            <IconBuildingSkyscraper className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{summary.orgUnit.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{summary.orgUnit.description}</span>
                              <span>-</span>
                              <span className="flex items-center gap-1">
                                <IconWorld className="h-3 w-3" />
                                {summary.orgUnit.environment}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={summary.orgUnit.status === 'active' ? 'secondary' : 'outline'}
                          className={cn(
                            "text-xs capitalize",
                            summary.orgUnit.status === 'active' && "bg-emerald-500/10 text-emerald-500"
                          )}
                        >
                          {summary.orgUnit.status}
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
                            <IconBolt className={cn(
                              "h-4 w-4",
                              summary.efficiencyScore >= 80 ? "text-emerald-500" :
                              summary.efficiencyScore >= 60 ? "text-amber-500" : "text-destructive"
                            )} />
                            <span className="text-sm font-mono">{summary.efficiencyScore}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconBulb className="h-4 w-4 text-amber-500" />
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
                        <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {filteredSummaries.length === 0 && (
                <div className="text-center py-12">
                  <IconUsersGroup className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No {config.hierarchy.orgUnitLabelPlural} Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {config.hierarchy.orgUnitLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="unit-name"
                placeholder={`Enter ${config.hierarchy.orgUnitLabel.toLowerCase()} name`}
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-description">Description</Label>
              <Input
                id="unit-description"
                placeholder="Enter description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-environment">Environment</Label>
              <Select value={form.environment} onValueChange={(value) => setForm(prev => ({ ...prev, environment: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="testing">Testing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-budget">Monthly Budget</Label>
              <Input
                id="unit-budget"
                type="number"
                placeholder="Enter monthly budget"
                value={form.budget}
                onChange={(e) => setForm(prev => ({ ...prev, budget: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUnit} disabled={!form.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

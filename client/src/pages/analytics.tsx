import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateCostTrend, generateServiceBreakdown, generateRegionBreakdown, generateKPIs } from '@/lib/finops-data';
import { getServiceInfo, getRegionNames } from '@/lib/provider-config';
import { downloadCsv } from '@/lib/csv-utils';
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { 
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconDownload,
  IconFilter,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CHART_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#5E35B1', '#D81B60', '#00897B', '#7CB342',
];

export default function Analytics() {
  const { currency, selectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();
  const { toast } = useToast();

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());

  const serviceInfo = useMemo(() => getServiceInfo(selectedProvider), [selectedProvider]);
  const regionNames = useMemo(() => getRegionNames(selectedProvider), [selectedProvider]);

  const costTrend = useMemo(() => generateCostTrend(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);
  const serviceBreakdown = useMemo(() => generateServiceBreakdown(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);
  const regionBreakdown = useMemo(() => generateRegionBreakdown(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);
  const kpis = useMemo(() => generateKPIs(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);

  const filteredServiceBreakdown = useMemo(() => {
    if (selectedServices.size === 0) return serviceBreakdown;
    return serviceBreakdown.filter(s => selectedServices.has(s.service));
  }, [serviceBreakdown, selectedServices]);

  const filteredRegionBreakdown = useMemo(() => {
    if (selectedRegions.size === 0) return regionBreakdown;
    return regionBreakdown.filter(r => selectedRegions.has(r.region));
  }, [regionBreakdown, selectedRegions]);

  const activeFilterCount = selectedServices.size + selectedRegions.size;

  const toggleService = (service: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(service)) {
        next.delete(service);
      } else {
        next.add(service);
      }
      return next;
    });
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedServices(new Set());
    setSelectedRegions(new Set());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-popover-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-mono font-semibold" style={{ color: entry.color }}>
              {entry.name}: {formatCompactCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const dailyTrendData = costTrend.filter(d => d.amount > 0).slice(-14).map((d, i, arr) => ({
    ...d,
    previousAmount: arr[i - 1]?.amount || d.amount,
    change: i > 0 ? ((d.amount - arr[i - 1].amount) / arr[i - 1].amount * 100) : 0,
  }));

  const serviceTreemapData = filteredServiceBreakdown.slice(0, 12).map((s, i) => ({
    name: s.service,
    fullName: serviceInfo[s.service]?.name || s.service,
    size: s.cost,
    fill: serviceInfo[s.service]?.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="analytics-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cost Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deep dive into your cloud spending patterns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconFilter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Services</h4>
                      <div className="space-y-2">
                        {serviceBreakdown.slice(0, 8).map((s) => (
                          <label key={s.service} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedServices.has(s.service)}
                              onCheckedChange={() => toggleService(s.service)}
                            />
                            <span className="text-sm">{serviceInfo[s.service]?.name || s.service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-2">Regions</h4>
                      <div className="space-y-2">
                        {regionBreakdown.map((r) => (
                          <label key={r.region} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedRegions.has(r.region)}
                              onCheckedChange={() => toggleRegion(r.region)}
                            />
                            <span className="text-sm">{regionNames[r.region] || r.region}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {activeFilterCount > 0 && (
                      <div className="border-t pt-3">
                        <Button variant="ghost" size="sm" className="w-full" onClick={clearAllFilters}>
                          Clear All
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={() => {
              const headers = ['Service', 'Cost', 'Percentage', 'Trend', 'Resource Count'];
              const rows = filteredServiceBreakdown.map(s => [
                s.service,
                s.cost,
                s.percentage,
                s.trend,
                s.resourceCount,
              ]);
              downloadCsv('analytics-services.csv', headers, rows);
              toast({ title: "Export complete", description: "Service breakdown data has been exported as CSV." });
            }}>
              <IconDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: 'Total Spend', value: kpis.totalSpend, trend: kpis.spendGrowthRate, tooltip: 'Cumulative cloud spend across all services for the selected time period.' },
            { label: 'Daily Average', value: kpis.totalSpend / 30, trend: null, tooltip: 'Average daily cloud expenditure calculated over the selected date range.' },
            { label: 'Peak Day', value: Math.max(...costTrend.filter(d => d.amount > 0).map(d => d.amount)), trend: null, tooltip: 'Highest single-day spend recorded in the selected period. Useful for spotting spikes.' },
            { label: 'Lowest Day', value: Math.min(...costTrend.filter(d => d.amount > 0).map(d => d.amount)), trend: null, tooltip: 'Lowest single-day spend recorded in the selected period. Represents baseline cost.' },
          ].map((metric, i) => (
            <UITooltip key={metric.label} delayDuration={300}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</p>
                      <div className="flex items-end justify-between gap-2">
                        <p className="text-2xl font-bold font-mono">{formatCompactCurrency(metric.value, currency)}</p>
                        {metric.trend !== null && (
                          <Badge
                            variant={metric.trend > 0 ? "destructive" : "secondary"}
                            className={cn(
                              "text-xs",
                              metric.trend < 0 && "bg-emerald-500/10 text-emerald-500"
                            )}
                          >
                            {metric.trend > 0 ? <IconTrendingUp className="h-3 w-3 mr-1" /> : <IconTrendingDown className="h-3 w-3 mr-1" />}
                            {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-center">
                <p className="text-xs">{metric.tooltip}</p>
              </TooltipContent>
            </UITooltip>
          ))}
        </div>

        <Tabs defaultValue="trend" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="trend">Cost Trend</TabsTrigger>
            <TabsTrigger value="services">By Service</TabsTrigger>
            <TabsTrigger value="regions">By Region</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconChartBar className="h-5 w-5 text-primary" />
                    Daily Cost Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={dailyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) => formatCompactCurrency(value, currency)}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={70}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="amount"
                          name="Daily Cost"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCost)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="change"
                          name="Daily Change %"
                          stroke="hsl(var(--chart-5))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Service Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={filteredServiceBreakdown.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="cost"
                            nameKey="service"
                            label={({ service, percentage }) => `${service} (${percentage}%)`}
                            labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                          >
                            {filteredServiceBreakdown.slice(0, 8).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={serviceInfo[entry.service]?.color || CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value, currency)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Service Ranking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredServiceBreakdown.slice(0, 10)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis
                            type="number"
                            tickFormatter={(value) => formatCompactCurrency(value, currency)}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis
                            type="category"
                            dataKey="service"
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            width={50}
                          />
                          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                          <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={20}>
                            {filteredServiceBreakdown.slice(0, 10).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={serviceInfo[entry.service]?.color || CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Regional Spend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={filteredRegionBreakdown}
                          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="region"
                            tickFormatter={(value) => regionNames[value]?.split('-')[0] || value}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCompactCurrency(value, currency)}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value, currency)}
                            labelFormatter={(label) => regionNames[label] || label}
                          />
                          <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Region Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredRegionBreakdown.map((region, index) => (
                        <div key={region.region} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div 
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <div>
                              <p className="text-sm font-medium">{regionNames[region.region]}</p>
                              <p className="text-xs text-muted-foreground">{region.resourceCount} resources</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-semibold">{formatCurrency(region.cost, currency)}</p>
                            <p className="text-xs text-muted-foreground">{region.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Month-over-Month Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={filteredServiceBreakdown.slice(0, 8).map(s => ({
                          service: s.service,
                          current: s.cost,
                          previous: s.cost * (1 - s.trend / 100),
                        }))}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="service"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatCompactCurrency(value, currency)}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value, currency)}
                        />
                        <Legend />
                        <Bar dataKey="previous" name="Last Month" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        <Bar dataKey="current" name="This Month" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

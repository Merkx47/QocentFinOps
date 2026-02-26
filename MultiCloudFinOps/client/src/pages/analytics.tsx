import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateCostTrend, generateServiceBreakdown, generateRegionBreakdown, generateKPIs } from '@/lib/mock-data';
import { serviceInfo, regionNames } from '@shared/schema';
import { useMemo } from 'react';
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
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Filter,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const CHART_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#5E35B1', '#D81B60', '#00897B', '#7CB342',
];

export default function Analytics() {
  const { currency, selectedTenantId, dateRange } = useFinOpsStore();
  
  const costTrend = useMemo(() => generateCostTrend(selectedTenantId), [selectedTenantId]);
  const serviceBreakdown = useMemo(() => generateServiceBreakdown(selectedTenantId), [selectedTenantId]);
  const regionBreakdown = useMemo(() => generateRegionBreakdown(selectedTenantId), [selectedTenantId]);
  const kpis = useMemo(() => generateKPIs(selectedTenantId), [selectedTenantId]);

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

  const serviceTreemapData = serviceBreakdown.slice(0, 12).map((s, i) => ({
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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Spend', value: kpis.totalSpend, trend: kpis.spendGrowthRate },
            { label: 'Daily Average', value: kpis.totalSpend / 30, trend: null },
            { label: 'Peak Day', value: Math.max(...costTrend.filter(d => d.amount > 0).map(d => d.amount)), trend: null },
            { label: 'Lowest Day', value: Math.min(...costTrend.filter(d => d.amount > 0).map(d => d.amount)), trend: null },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
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
                        {metric.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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
                    <BarChart3 className="h-5 w-5 text-primary" />
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
                          stroke="#f59e0b"
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
                            data={serviceBreakdown.slice(0, 8)}
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
                            {serviceBreakdown.slice(0, 8).map((entry, index) => (
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
                          data={serviceBreakdown.slice(0, 10)} 
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
                            {serviceBreakdown.slice(0, 10).map((entry, index) => (
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
                          data={regionBreakdown}
                          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="region"
                            tickFormatter={(value) => regionNames[value as keyof typeof regionNames]?.split('-')[0] || value}
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
                            labelFormatter={(label) => regionNames[label as keyof typeof regionNames] || label}
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
                      {regionBreakdown.map((region, index) => (
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
                        data={serviceBreakdown.slice(0, 8).map(s => ({
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

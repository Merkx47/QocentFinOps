import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateUnitEconomics } from '@/lib/mock-data';
import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Cell,
  Legend,
  LineChart,
} from 'recharts';
import {
  IconReceipt,
  IconUsers,
  IconDatabase,
  IconActivity,
  IconTrendingDown,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const CHART_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#5E35B1', '#D81B60', '#00897B', '#7CB342',
];

const metricIcons = [
  IconActivity,
  IconUsers,
  IconDatabase,
  IconReceipt,
];

export default function UnitEconomics() {
  const { currency, selectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();

  const data = useMemo(
    () => generateUnitEconomics(selectedOrgUnitId, selectedProvider, dateRange),
    [selectedOrgUnitId, selectedProvider, dateRange],
  );

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
              {entry.name}: {entry.name === 'Transactions' ? entry.value.toLocaleString() : formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Unit Economics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Map cloud spend to business metrics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.metrics.map((metric, i) => {
            const Icon = metricIcons[i % metricIcons.length];
            return (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          metric.trend < 0
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500',
                        )}
                      >
                        <IconTrendingDown
                          className={cn(
                            'h-3 w-3 mr-1',
                            metric.trend > 0 && 'rotate-180',
                          )}
                        />
                        {metric.trend > 0 ? '+' : ''}
                        {metric.trend.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {metric.name}
                    </p>
                    <p className="text-2xl font-bold font-mono">
                      {formatCurrency(metric.value, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.unit}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconReceipt className="h-5 w-5 text-primary" />
                Cost per Unit &amp; Transaction Volume (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
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
                      tickFormatter={(v) => formatCompactCurrency(v, currency)}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      yAxisId="right"
                      dataKey="transactions"
                      name="Transactions"
                      fill="url(#barGrad)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={18}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="costPerUnit"
                      name="Cost per Unit"
                      stroke="#E53935"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconActivity className="h-5 w-5 text-primary" />
                  Top Services by Unit Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topServices.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatCompactCurrency(v, currency)}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="service"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        width={70}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                        labelFormatter={(label) => `Service: ${label}`}
                      />
                      <Bar dataKey="costPerUnit" name="Cost per Unit" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        {data.topServices.slice(0, 8).map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconTrendingDown className="h-5 w-5 text-emerald-500" />
                  Efficiency Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#43A047" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#43A047" stopOpacity={0} />
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
                        tickFormatter={(v) => formatCompactCurrency(v, currency)}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Line
                        type="monotone"
                        dataKey="costPerUnit"
                        name="Cost per Unit"
                        stroke="#43A047"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Downward trend indicates improving cost efficiency
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Service Unit Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topServices.map((svc, index) => (
                  <div key={svc.service} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <div>
                        <p className="text-sm font-medium">{svc.service}</p>
                        <p className="text-xs text-muted-foreground">{svc.units.toLocaleString()} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold">{formatCurrency(svc.costPerUnit, currency)}/unit</p>
                      <p className="text-xs text-muted-foreground">
                        Total: {formatCurrency(svc.totalCost, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
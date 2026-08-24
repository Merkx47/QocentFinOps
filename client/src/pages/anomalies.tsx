import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateAnomalies } from '@/lib/finops-data';
import { getRegionNames } from '@/lib/provider-config';
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import {
  IconAlertTriangle,
  IconShieldCheck,
  IconBolt,
  IconEye,
  IconCircleCheck,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const severityConfig = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', dot: '#ef4444' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', dot: '#f59e0b' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', dot: '#3b82f6' },
};

const statusConfig = {
  new: { icon: IconAlertTriangle, label: 'New', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  investigating: { icon: IconEye, label: 'Investigating', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  resolved: { icon: IconCircleCheck, label: 'Resolved', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export default function Anomalies() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const regionNames = useMemo(() => getRegionNames(selectedProvider), [selectedProvider]);
  const anomalies = useMemo(() => generateAnomalies(selectedOrgUnitId, selectedProvider), [selectedOrgUnitId, selectedProvider]);

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(a => {
      const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSeverity && matchesStatus;
    });
  }, [anomalies, severityFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = anomalies.length;
    const critical = anomalies.filter(a => a.severity === 'critical').length;
    const impact = anomalies.reduce((sum, a) => sum + (a.actualCost - a.expectedCost), 0);
    const resolved = anomalies.filter(a => a.status === 'resolved').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, critical, impact, resolutionRate };
  }, [anomalies]);

  const timelineData = useMemo(() => {
    const sorted = [...anomalies].sort((a, b) => a.date.localeCompare(b.date));
    const dateMap = new Map<string, { expected: number; actual: number }>();
    sorted.forEach(a => {
      const existing = dateMap.get(a.date) || { expected: 0, actual: 0 };
      existing.expected += a.expectedCost;
      existing.actual += a.actualCost;
      dateMap.set(a.date, existing);
    });
    return Array.from(dateMap.entries()).map(([date, vals]) => ({
      date,
      expected: Math.round(vals.expected * 100) / 100,
      actual: Math.round(vals.actual * 100) / 100,
    }));
  }, [anomalies]);

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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="anomalies-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Anomaly Detection</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered cost anomaly detection and alerting
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: 'Total Anomalies', value: stats.total.toString(), icon: IconAlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500/10', tooltip: 'Total number of spending anomalies detected by the AI engine in the current period.' },
            { label: 'Critical Alerts', value: stats.critical.toString(), icon: IconBolt, color: 'text-red-500', bgColor: 'bg-red-500/10', tooltip: 'High-severity anomalies requiring immediate investigation, typically 50%+ above expected spend.' },
            { label: 'Estimated Impact', value: formatCurrency(stats.impact, currency), icon: IconShieldCheck, color: 'text-primary', bgColor: 'bg-primary/10', tooltip: 'Total estimated financial impact of all detected anomalies if left unresolved.' },
            { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: IconCircleCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', tooltip: 'Percentage of detected anomalies that have been investigated and resolved.' },
          ].map((stat, i) => (
            <UITooltip key={stat.label} delayDuration={300}>
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
                        <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
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
            </UITooltip>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5 text-amber-500" />
                Expected vs Actual Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAnomalyActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                      tickFormatter={(value) => formatCompactCurrency(value, currency)}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="expected"
                      name="Expected"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorExpected)"
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Actual"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAnomalyActual)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconBolt className="h-5 w-5 text-primary" />
                  Anomaly List
                  <Badge variant="secondary" className="ml-2">{filteredAnomalies.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSeverityFilter('all'); setStatusFilter('all'); }}
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredAnomalies.map((anomaly, index) => {
                const severity = severityConfig[anomaly.severity];
                const status = statusConfig[anomaly.status];
                const StatusIcon = status.icon;
                const costImpact = anomaly.actualCost - anomaly.expectedCost;

                return (
                  <motion.div
                    key={anomaly.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <div className="p-4 rounded-lg border border-border bg-background/50 hover-elevate cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl flex-shrink-0", severity.bg)}>
                          <IconAlertTriangle className={cn("h-5 w-5", severity.text)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="text-base font-semibold">{anomaly.service}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs border", severity.bg, severity.text, severity.border)}
                                >
                                  {anomaly.severity.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {regionNames[anomaly.region] || anomaly.region}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(anomaly.date)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusIcon className={cn("h-4 w-4", status.color)} />
                              <Badge variant="secondary" className={cn("text-xs", status.bg, status.color)}>
                                {status.label}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {anomaly.description}
                          </p>

                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-xs text-muted-foreground">Expected</p>
                                <p className="text-sm font-mono">{formatCurrency(anomaly.expectedCost, currency)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Actual</p>
                                <p className="text-sm font-mono text-red-500">{formatCurrency(anomaly.actualCost, currency)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Deviation</p>
                                <p className="text-sm font-mono text-red-500">+{anomaly.deviation}%</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Cost Impact</p>
                              <p className="text-lg font-mono font-bold text-red-500">
                                +{formatCurrency(costImpact, currency)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filteredAnomalies.length === 0 && (
                <div className="text-center py-12">
                  <IconShieldCheck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Anomalies Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {severityFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your filters to see more anomalies.'
                      : 'Great news! No cost anomalies detected in your environment.'}
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateForecast } from '@/lib/finops-data';
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  IconChartLine,
  IconTarget,
  IconCalendarStats,
  IconAlertTriangle,
  IconBulb,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function Forecasting() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  const [resourceIncrease, setResourceIncrease] = useState([0]);

  const forecast = useMemo(
    () => generateForecast(selectedOrgUnitId, selectedProvider),
    [selectedOrgUnitId, selectedProvider]
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
              {entry.name}: {formatCompactCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartData = forecast.dataPoints.map((dp) => ({
    date: dp.date,
    ...(dp.isHistorical
      ? { historical: dp.amount }
      : {
          forecast: dp.amount,
          upperBound: dp.upperBound,
          lowerBound: dp.lowerBound,
          confidenceBand: dp.upperBound && dp.lowerBound ? [dp.lowerBound, dp.upperBound] : undefined,
        }),
  }));

  const whatIfCost = forecast.projectedMonthEnd * (1 + resourceIncrease[0] / 100);

  const summaryCards = [
    {
      label: 'Projected Month End',
      value: forecast.projectedMonthEnd,
      icon: IconCalendarStats,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      tooltip: 'ML-predicted total cloud spend by the end of the current month based on historical trends.',
    },
    {
      label: 'Projected Quarter End',
      value: forecast.projectedQuarterEnd,
      icon: IconTarget,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      tooltip: 'Forecasted cumulative spend through the end of the current fiscal quarter.',
    },
    {
      label: 'Budget Breach Risk',
      value: forecast.budgetBreachDate,
      icon: IconAlertTriangle,
      color: forecast.budgetBreachDate ? 'text-red-500' : 'text-emerald-500',
      bg: forecast.budgetBreachDate ? 'bg-red-500/10' : 'bg-emerald-500/10',
      isDate: true,
      tooltip: 'Earliest predicted date when spending will exceed the allocated budget. "No Risk" means the budget is safe.',
    },
    {
      label: 'Confidence Level',
      value: forecast.confidenceLevel,
      icon: IconChartLine,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      isPercent: true,
      tooltip: 'Statistical confidence of the forecast model. Higher values indicate more reliable predictions.',
    },
  ];

  const scenarioIcons: Record<string, string> = {
    optimistic: '📈',
    baseline: '📊',
    pessimistic: '📉',
    with_recommendations: '💡',
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Cost Forecasting</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ML-powered spend predictions and what-if scenarios
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0">
          {summaryCards.map((card, i) => (
            <UITooltip key={card.label} delayDuration={300}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('p-2 rounded-lg', card.bg)}>
                          <card.icon className={cn('h-5 w-5', card.color)} />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</p>
                      </div>
                      <p className="text-2xl font-bold font-mono">
                        {card.isDate
                          ? card.value
                            ? new Date(card.value as string).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'No Risk'
                          : card.isPercent
                            ? `${card.value}%`
                            : formatCompactCurrency(card.value as number, currency)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-center">
                <p className="text-xs">{card.tooltip}</p>
              </TooltipContent>
            </UITooltip>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconChartLine className="h-5 w-5 text-primary" />
                Spend Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={false}
                      interval={14}
                    />
                    <YAxis
                      tickFormatter={(value) => formatCompactCurrency(value, currency)}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="upperBound"
                      name="Upper Bound"
                      stroke="none"
                      fill="url(#colorConfidence)"
                      fillOpacity={1}
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="lowerBound"
                      name="Lower Bound"
                      stroke="none"
                      fill="hsl(var(--background))"
                      fillOpacity={0}
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="historical"
                      name="Historical"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorHistorical)"
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast"
                      stroke="hsl(var(--chart-5))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1}
                      fill="url(#colorForecast)"
                      connectNulls={false}
                    />
                    {forecast.budgetBreachDate && (
                      <ReferenceLine
                        x={forecast.budgetBreachDate}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                        label={{ value: 'Budget Breach', fill: '#ef4444', fontSize: 11 }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {forecast.budgetBreachDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <IconAlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-600">Budget Breach Warning</p>
                    <p className="text-sm text-muted-foreground">
                      At current spending rates, your budget is projected to be exceeded on{' '}
                      <span className="font-semibold text-red-600">
                        {new Date(forecast.budgetBreachDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      . Consider implementing optimization recommendations to reduce costs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <h2 className="text-lg font-semibold mb-4">Scenario Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0">
            {forecast.scenarios.map((scenario, i) => (
              <motion.div
                key={scenario.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{scenarioIcons[scenario.name] || '📊'}</span>
                      <div>
                        <p className="text-sm font-semibold">{scenario.label}</p>
                      </div>
                    </div>
                    <div
                      className="h-1 w-full rounded-full mb-3"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Projection</p>
                        <p className="text-lg font-bold font-mono">
                          {formatCompactCurrency(scenario.monthlyProjection, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Quarterly Projection</p>
                        <p className="text-lg font-bold font-mono">
                          {formatCompactCurrency(scenario.quarterlyProjection, currency)}
                        </p>
                      </div>
                    </div>
                    {scenario.name === 'with_recommendations' && (
                      <Badge className="mt-3 bg-violet-500/10 text-violet-600 hover:bg-violet-500/20">
                        <IconBulb className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconBulb className="h-5 w-5 text-amber-500" />
                What-If Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      What if we add <span className="font-semibold text-foreground">{resourceIncrease[0]}%</span> more
                      resources?
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        resourceIncrease[0] > 0
                          ? 'border-red-500/30 text-red-600'
                          : 'border-muted text-muted-foreground'
                      )}
                    >
                      {resourceIncrease[0] > 0 ? '+' : ''}
                      {formatCompactCurrency(whatIfCost - forecast.projectedMonthEnd, currency)}/mo
                    </Badge>
                  </div>
                  <Slider
                    value={resourceIncrease}
                    onValueChange={setResourceIncrease}
                    min={-30}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">-30%</span>
                    <span className="text-xs text-muted-foreground">0%</span>
                    <span className="text-xs text-muted-foreground">+100%</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Projection</p>
                    <p className="text-xl font-bold font-mono">
                      {formatCompactCurrency(forecast.projectedMonthEnd, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      With {resourceIncrease[0]}% Change
                    </p>
                    <p className={cn('text-xl font-bold font-mono', resourceIncrease[0] > 0 ? 'text-red-500' : resourceIncrease[0] < 0 ? 'text-emerald-500' : '')}>
                      {formatCompactCurrency(whatIfCost, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
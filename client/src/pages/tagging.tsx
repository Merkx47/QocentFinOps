import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFinOpsStore, formatCurrency } from '@/lib/finops-store';
import { generateTagCompliance } from '@/lib/mock-data';
import { getProviderConfig } from '@/lib/provider-config';
import { useMemo } from 'react';
import {
  IconTag,
  IconTags,
  IconShieldCheck,
  IconAlertTriangle,
  IconCircleCheck,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function Tagging() {
  const { selectedProvider, selectedOrgUnitId, currency } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);

  const data = useMemo(
    () => generateTagCompliance(selectedOrgUnitId, selectedProvider),
    [selectedOrgUnitId, selectedProvider]
  );

  const gaugeData = [
    { name: 'Compliant', value: data.overall.compliancePercent },
    { name: 'Non-Compliant', value: 100 - data.overall.compliancePercent },
  ];

  const gaugeColors = ['#10b981', '#e2e8f0'];

  const orgBarData = data.byOrgUnit
    .sort((a, b) => b.compliance - a.compliance)
    .map((ou) => ({
      name: ou.orgUnitName.length > 18 ? ou.orgUnitName.slice(0, 18) + '…' : ou.orgUnitName,
      compliance: ou.compliance,
      untaggedCost: ou.untaggedCost,
    }));

  const summaryCards = [
    {
      label: 'Overall Compliance',
      value: `${data.overall.compliancePercent}%`,
      icon: IconShieldCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Tagged Resources',
      value: `${data.overall.taggedResources} / ${data.overall.totalResources}`,
      icon: IconCircleCheck,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Untagged Cost',
      value: formatCurrency(data.overall.untaggedCost, currency),
      icon: IconAlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Required Tags',
      value: data.requiredTags.length,
      icon: IconTags,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Tag Governance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resource tagging compliance and cost attribution
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                      <p className="text-xl font-bold font-mono">{card.value}</p>
                    </div>
                    <div className={cn('p-2.5 rounded-xl', card.bg)}>
                      <card.icon className={cn('h-6 w-6', card.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconShieldCheck className="h-5 w-5 text-primary" />
                  Compliance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {gaugeData.map((_, index) => (
                          <Cell key={index} fill={gaugeColors[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="-mt-32 text-center">
                    <p className="text-4xl font-bold font-mono">{data.overall.compliancePercent}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Overall Compliance</p>
                  </div>
                  <div className="mt-14 w-full grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold font-mono text-emerald-500">
                        {data.overall.taggedResources}
                      </p>
                      <p className="text-xs text-muted-foreground">Tagged</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-amber-500">
                        {data.overall.totalResources - data.overall.taggedResources}
                      </p>
                      <p className="text-xs text-muted-foreground">Untagged</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconTag className="h-5 w-5 text-primary" />
                  Required Tags Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.requiredTags.map((tag) => (
                    <div key={tag.tag} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {tag.tag}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="text-emerald-500 font-mono">{tag.compliant} compliant</span>
                          <span className="text-destructive font-mono">{tag.nonCompliant} missing</span>
                          <span className="font-bold font-mono text-foreground w-12 text-right">
                            {tag.percentage}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={tag.percentage}
                        className={cn(
                          'h-2',
                          tag.percentage < 60 && '[&>div]:bg-destructive',
                          tag.percentage >= 60 && tag.percentage < 80 && '[&>div]:bg-amber-500',
                          tag.percentage >= 80 && '[&>div]:bg-emerald-500'
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconTags className="h-5 w-5 text-primary" />
                Compliance by {config.hierarchy.orgUnitLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={orgBarData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'compliance' ? `${value}%` : formatCurrency(value, currency)
                    }
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="compliance" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {orgBarData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.compliance >= 80
                            ? '#10b981'
                            : entry.compliance >= 60
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5 text-amber-500" />
                Top Violations
                <Badge variant="secondary" className="ml-2">
                  {data.topViolations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Resource</th>
                      <th className="pb-3 font-medium text-muted-foreground">Service</th>
                      <th className="pb-3 font-medium text-muted-foreground">Missing Tags</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topViolations.map((v) => (
                      <tr key={v.resourceId} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3">
                          <span className="font-mono text-xs">{v.resourceName}</span>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">
                            {v.service}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {v.missingTags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs bg-destructive/10 text-destructive"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono">
                          {formatCurrency(v.monthlyCost, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
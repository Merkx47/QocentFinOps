import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateSavingsPlans } from '@/lib/mock-data';
import { getProviderConfig } from '@/lib/provider-config';
import { useTableControls } from '@/hooks/use-table-controls';
import { useMemo, useState } from 'react';
import {
  IconShieldCheck,
  IconClock,
  IconCurrencyDollar,
  IconCalendarEvent,
  IconAlertTriangle,
  IconSearch,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function SavingsPlans() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  const providerConfig = getProviderConfig(selectedProvider);
  const title = selectedProvider === 'aws'
    ? 'Savings Plans & Reserved Instances'
    : selectedProvider === 'azure'
    ? 'Reserved Instances & Hybrid Benefit'
    : selectedProvider === 'gcp'
    ? 'Committed Use Discounts'
    : 'Reserved Instances';

  const data = useMemo(
    () => generateSavingsPlans(selectedOrgUnitId, selectedProvider),
    [selectedOrgUnitId, selectedProvider],
  );

  const { summary, commitments } = data;
  const expiringCommitments = commitments.filter(c => c.status === 'expiring');
  const activeCommitments = commitments.filter(c => c.status !== 'expired');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCommitments = useMemo(() => {
    return commitments.filter(c => {
      const matchesSearch = searchQuery === '' ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.service.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [commitments, searchQuery, statusFilter]);

  const { currentPage, setCurrentPage, totalPages, pageSize, paginatedData, totalItems } = useTableControls(filteredCommitments);

  const utilizationData = activeCommitments.map(c => ({
    name: `${c.type.split(' ')[0]} - ${c.service}`,
    utilization: c.utilization,
    coverage: c.coverage,
  }));

  const coverageAngle = (summary.coveragePercent / 100) * 360;
  const gaugeData = [
    { name: 'Covered', value: summary.coveragePercent },
    { name: 'Uncovered', value: 100 - summary.coveragePercent },
  ];
  const GAUGE_COLORS = [providerConfig.colors.chartPrimary, '#e2e8f0'];

  const summaryCards = [
    {
      label: 'Commitment Coverage',
      value: `${summary.coveragePercent}%`,
      icon: IconShieldCheck,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Utilization Rate',
      value: `${summary.utilizationPercent}%`,
      icon: IconClock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Monthly Savings',
      value: formatCurrency(summary.totalSavings, currency),
      icon: IconCurrencyDollar,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Expiring Soon',
      value: summary.expiringIn30Days,
      icon: IconAlertTriangle,
      color: summary.expiringIn30Days > 0 ? 'text-amber-500' : 'text-muted-foreground',
      bg: summary.expiringIn30Days > 0 ? 'bg-amber-500/10' : 'bg-muted',
    },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="savings-plans-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage commitment-based discounts and track utilization with {providerConfig.terminology.savingsMechanism}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((stat, i) => (
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
                      <p className="text-xl font-bold font-mono">{stat.value}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconShieldCheck className="h-5 w-5 text-primary" />
                  Coverage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {gaugeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-28 mb-16">
                  <p className="text-3xl font-bold font-mono">{summary.coveragePercent}%</p>
                  <p className="text-xs text-muted-foreground">Coverage</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full text-center">
                  <div>
                    <p className="text-sm font-mono font-semibold">{formatCompactCurrency(summary.totalCommitment, currency)}</p>
                    <p className="text-xs text-muted-foreground">Committed</p>
                  </div>
                  <div>
                    <p className="text-sm font-mono font-semibold">{formatCompactCurrency(summary.totalOnDemand, currency)}</p>
                    <p className="text-xs text-muted-foreground">On-Demand Equiv.</p>
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
                  <IconClock className="h-5 w-5 text-blue-500" />
                  Utilization by Commitment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={utilizationData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Bar dataKey="utilization" name="Utilization" fill={providerConfig.colors.chartPrimary} radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {expiringCommitments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mb-6"
          >
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <IconAlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-800">Expiring Commitments</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      {expiringCommitments.length} commitment{expiringCommitments.length > 1 ? 's' : ''} expiring within 30 days. Review and renew to maintain savings.
                    </p>
                    <div className="mt-3 space-y-2">
                      {expiringCommitments.map(c => (
                        <div key={c.id} className="flex items-center justify-between text-sm bg-card/60 rounded-lg px-3 py-2">
                          <span className="font-medium text-amber-900">{c.type} — {c.service}</span>
                          <span className="text-amber-700">Expires {c.expirationDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mb-6"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconCalendarEvent className="h-5 w-5 text-primary" />
                  Commitments
                  <Badge variant="secondary" className="ml-2">{filteredCommitments.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search commitments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expiring">Expiring</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase text-left">Type</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-left">Service</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-left">Term</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-right">Monthly Cost</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-right">On-Demand</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-center">Utilization</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-center">Coverage</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-left">Expiration</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((c, index) => (
                      <TableRow
                        key={c.id}
                        className="hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">{c.type}</TableCell>
                        <TableCell>{c.service}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{c.term}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(c.monthlyCommitment, currency)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(c.monthlyOnDemand, currency)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            <Progress
                              value={c.utilization}
                              className={cn(
                                "h-2 w-16",
                                c.utilization < 60 && "[&>div]:bg-amber-500",
                                c.utilization >= 60 && c.utilization < 80 && "[&>div]:bg-blue-500",
                                c.utilization >= 80 && "[&>div]:bg-emerald-500",
                              )}
                            />
                            <span className="font-mono text-xs w-10 text-right">{c.utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            <Progress value={c.coverage} className="h-2 w-16" />
                            <span className="font-mono text-xs w-10 text-right">{c.coverage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.expirationDate}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={c.status === 'expired' ? 'destructive' : 'secondary'}
                            className={cn(
                              "text-xs capitalize",
                              c.status === 'active' && "bg-emerald-500/10 text-emerald-600",
                              c.status === 'expiring' && "bg-amber-500/10 text-amber-600",
                            )}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconCurrencyDollar className="h-5 w-5 text-emerald-500" />
                Purchase Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: `${providerConfig.terminology.computeUnit} Coverage`,
                    description: `Increase ${providerConfig.terminology.savingsMechanism} coverage for compute workloads to save an additional 15-25%.`,
                    savings: summary.totalSavings * 0.3,
                    term: '1-year',
                  },
                  {
                    title: 'Database Coverage',
                    description: `Add reserved capacity for database services to reduce costs by up to 40%.`,
                    savings: summary.totalSavings * 0.2,
                    term: '1-year',
                  },
                  {
                    title: 'Long-Term Commitment',
                    description: `Switch expiring 1-year commitments to 3-year terms for deeper discounts of up to 60%.`,
                    savings: summary.totalSavings * 0.45,
                    term: '3-year',
                  },
                ].map((rec, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border bg-background/50">
                    <h4 className="font-medium mb-1">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{rec.term}</Badge>
                      <span className="text-sm font-mono font-semibold text-emerald-600">
                        +{formatCompactCurrency(rec.savings, currency)}/mo
                      </span>
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
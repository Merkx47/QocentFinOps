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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFinOpsStore, formatCurrency } from '@/lib/finops-store';
import { generateWasteAnalysis } from '@/lib/mock-data';
import { useMemo, useState } from 'react';
import {
  IconTrash,
  IconAlertTriangle,
  IconServer2,
  IconDeviceSdCard,
  IconPlugConnectedX,
  IconFlame,
  IconArrowDown,
  IconBolt,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const WASTE_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#6366f1'];

const categoryIcons: Record<string, React.ElementType> = {
  'Idle Resources': IconServer2,
  'Orphaned Volumes': IconDeviceSdCard,
  'Oversized Instances': IconAlertTriangle,
  'Unattached IPs': IconPlugConnectedX,
};

export default function WasteDetection() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'cost' | 'lastActive'>('cost');

  const wasteData = useMemo(
    () => generateWasteAnalysis(selectedOrgUnitId, selectedProvider),
    [selectedOrgUnitId, selectedProvider]
  );

  const filteredResources = useMemo(() => {
    let resources = wasteData.resources;
    if (categoryFilter !== 'all') {
      resources = resources.filter((r) => r.reason === categoryFilter);
    }
    if (sortBy === 'cost') {
      resources = [...resources].sort((a, b) => b.monthlyCost - a.monthlyCost);
    } else {
      resources = [...resources].sort(
        (a, b) => new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime()
      );
    }
    return resources;
  }, [wasteData.resources, categoryFilter, sortBy]);

  const quickWins = useMemo(
    () =>
      wasteData.resources
        .filter((r) => r.monthlyCost > 50)
        .sort((a, b) => b.monthlyCost - a.monthlyCost)
        .slice(0, 5),
    [wasteData.resources]
  );

  const pieData = wasteData.categories.map((cat) => ({
    name: cat.name,
    value: cat.monthlyCost,
  }));

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Waste Detection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Identify and eliminate cloud waste
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Waste',
              value: formatCurrency(wasteData.summary.totalWaste, currency),
              icon: IconTrash,
              color: 'text-red-500',
            },
            {
              label: 'Waste % of Spend',
              value: `${wasteData.summary.wastePercentage.toFixed(1)}%`,
              icon: IconFlame,
              color: 'text-amber-500',
            },
            {
              label: 'Idle Resources',
              value: wasteData.summary.idleResources.toString(),
              icon: IconServer2,
              color: 'text-violet-500',
            },
            {
              label: 'Orphaned Volumes',
              value: wasteData.summary.orphanedVolumes.toString(),
              icon: IconDeviceSdCard,
              color: 'text-indigo-500',
            },
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
                      <p className="text-xl font-bold font-mono">{stat.value}</p>
                    </div>
                    <stat.icon className={cn('h-8 w-8', stat.color)} />
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
                  <IconFlame className="h-5 w-5 text-amber-500" />
                  Waste by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={WASTE_COLORS[index % WASTE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: WASTE_COLORS[i % WASTE_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-mono font-medium">
                        {formatCurrency(entry.value, currency)}
                      </span>
                    </div>
                  ))}
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
                  <IconAlertTriangle className="h-5 w-5 text-amber-500" />
                  Waste Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wasteData.categories.map((cat, i) => {
                    const Icon = categoryIcons[cat.name] || IconTrash;
                    return (
                      <div
                        key={cat.name}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${WASTE_COLORS[i % WASTE_COLORS.length]}15`,
                            }}
                          >
                            <Icon
                              className="h-5 w-5"
                              style={{ color: WASTE_COLORS[i % WASTE_COLORS.length] }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">{cat.count} resources</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold font-mono">
                          {formatCurrency(cat.monthlyCost, currency)}
                          <span className="text-xs text-muted-foreground font-normal ml-1">
                            /month
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mb-6"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconBolt className="h-5 w-5 text-amber-500" />
                Quick Wins
                <Badge variant="secondary" className="ml-2">
                  Top {quickWins.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {quickWins.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.service}</p>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-bold font-mono text-red-500">
                        {formatCurrency(item.monthlyCost, currency)}
                      </span>
                      <Button variant="destructive" size="sm" className="h-7 text-xs px-2">
                        <IconTrash className="h-3 w-3 mr-1" />
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconTrash className="h-5 w-5 text-red-500" />
                  Wasted Resources
                  <Badge variant="secondary" className="ml-2">
                    {filteredResources.length}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Array.from(new Set(wasteData.resources.map((r) => r.reason))).map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as 'cost' | 'lastActive')}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">Highest Cost</SelectItem>
                      <SelectItem value="lastActive">Least Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase">Resource Name</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Service</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Type</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Region</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-right">Monthly Cost</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Reason</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Last Active</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id} className="hover-elevate cursor-pointer">
                        <TableCell>
                          <p className="font-medium text-sm">{resource.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {resource.service}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{resource.type}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{resource.region}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono font-medium text-red-500">
                            {formatCurrency(resource.monthlyCost, currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              resource.reason === 'Idle'
                                ? 'border-amber-300 text-amber-600 bg-amber-50'
                                : resource.reason === 'Orphaned'
                                ? 'border-violet-300 text-violet-600 bg-violet-50'
                                : resource.reason === 'Oversized'
                                ? 'border-red-300 text-red-600 bg-red-50'
                                : 'border-indigo-300 text-indigo-600 bg-indigo-50'
                            )}
                          >
                            {resource.reason}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(resource.lastActive).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="destructive" size="sm" className="h-7 text-xs">
                            <IconTrash className="h-3 w-3 mr-1" />
                            Terminate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
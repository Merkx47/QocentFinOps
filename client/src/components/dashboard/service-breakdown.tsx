import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinOpsStore, formatCurrency, formatCompactCurrency } from '@/lib/finops-store';
import { generateServiceBreakdown } from '@/lib/finops-data';
import { getServiceInfo } from '@/lib/provider-config';
import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconStack2,
  IconArrowRight,
  IconSearch,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTableControls } from '@/hooks/use-table-controls';
import { TablePagination } from '@/components/ui/table-pagination';

const CHART_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#5E35B1', '#D81B60', '#00897B', '#7CB342',
];

export function ServiceBreakdownChart() {
  const { currency, selectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();

  const serviceInfo = useMemo(() => getServiceInfo(selectedProvider), [selectedProvider]);
  const breakdown = useMemo(() => generateServiceBreakdown(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);
  const topServices = breakdown.slice(0, 8);
  
  const chartData = topServices.map((item, index) => ({
    name: item.service,
    value: item.cost,
    color: serviceInfo[item.service]?.color || CHART_COLORS[index % CHART_COLORS.length],
    percentage: item.percentage,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-popover-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium mb-1">{serviceInfo[data.name]?.name || data.name}</p>
          <p className="text-lg font-mono font-bold">{formatCompactCurrency(data.value, currency)}</p>
          <p className="text-xs text-muted-foreground">{data.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <IconStack2 className="h-5 w-5 text-primary" />
              Service Breakdown
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Top 8 services by cost</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="h-[200px] w-[200px] flex-shrink-0" data-testid="chart-service-pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2">
              {topServices.slice(0, 5).map((item, index) => (
                <div 
                  key={item.service}
                  className="flex items-center justify-between gap-3 py-1.5"
                  data-testid={`service-item-${item.service}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="h-3 w-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: serviceInfo[item.service]?.color || CHART_COLORS[index] }}
                    />
                    <span className="text-sm truncate">{item.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium">
                      {formatCompactCurrency(item.cost, currency)}
                    </span>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        item.trend > 0 ? "text-destructive" : item.trend < 0 ? "text-emerald-500" : ""
                      )}
                    >
                      {item.trend > 0 ? '+' : ''}{item.trend}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ServiceBreakdownTable() {
  const { currency, selectedOrgUnitId, selectedProvider, dateRange } = useFinOpsStore();

  const serviceInfo = useMemo(() => getServiceInfo(selectedProvider), [selectedProvider]);
  const breakdown = useMemo(() => generateServiceBreakdown(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredBreakdown = useMemo(() => {
    if (!searchQuery) return breakdown;
    return breakdown.filter(item =>
      item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (serviceInfo[item.service]?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [breakdown, searchQuery, serviceInfo]);

  const { currentPage, setCurrentPage, totalPages, pageSize, paginatedData, totalItems } = useTableControls(filteredBreakdown);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            All Services
            <Badge variant="secondary" className="ml-1">{filteredBreakdown.length}</Badge>
          </CardTitle>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[180px]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-testid="table-service-breakdown">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase">
                    Service
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">
                    Cost
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">
                    Share
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">
                    Trend
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">
                    Resources
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow
                    key={item.service}
                    className="hover-elevate"
                    data-testid={`table-row-${item.service}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: serviceInfo[item.service]?.color || CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <div>
                          <p className="text-sm font-medium">{item.service}</p>
                          <p className="text-xs text-muted-foreground">
                            {serviceInfo[item.service]?.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-mono font-medium">
                        {formatCurrency(item.cost, currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          item.trend > 0 ? "text-destructive" : item.trend < 0 ? "text-emerald-500" : ""
                        )}
                      >
                        {item.trend > 0 ? <IconTrendingUp className="h-3 w-3 mr-1" /> : item.trend < 0 ? <IconTrendingDown className="h-3 w-3 mr-1" /> : null}
                        {item.trend > 0 ? '+' : ''}{item.trend}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-mono">{item.resourceCount}</span>
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
  );
}

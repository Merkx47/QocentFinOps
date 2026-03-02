import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Progress } from '@/components/ui/progress';
import { useFinOpsStore, formatCurrency } from '@/lib/finops-store';
import { generateResources } from '@/lib/mock-data';
import { getServiceInfo, getRegionNames } from '@/lib/provider-config';
import { downloadCsv } from '@/lib/csv-utils';
import { useMemo, useState } from 'react';
import { 
  IconServer2,
  IconSearch,
  IconFilter,
  IconDownload,
  IconRefresh,
  IconCpu,
  IconDeviceDesktop,
  IconDeviceSdCard,
  IconNetwork,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useTableControls } from '@/hooks/use-table-controls';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TablePagination } from '@/components/ui/table-pagination';

const getUtilizationBadge = (value: number) => {
  if (value < 20) return { label: 'Low', color: 'text-destructive bg-destructive/10' };
  if (value < 40) return { label: 'Below Avg', color: 'text-orange-500 bg-orange-500/10' };
  if (value < 60) return { label: 'Moderate', color: 'text-amber-500 bg-amber-500/10' };
  if (value < 80) return { label: 'Good', color: 'text-emerald-400 bg-emerald-400/10' };
  return { label: 'Optimal', color: 'text-emerald-500 bg-emerald-500/10' };
};

export default function Resources() {
  const { currency, selectedOrgUnitId, selectedProvider } = useFinOpsStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncSeed, setSyncSeed] = useState(0);
  
  const serviceInfo = useMemo(() => getServiceInfo(selectedProvider), [selectedProvider]);
  const regionNames = useMemo(() => getRegionNames(selectedProvider), [selectedProvider]);

  const resources = useMemo(() => {
    const orgId = syncSeed > 0 ? `${selectedOrgUnitId}-sync${syncSeed}` : selectedOrgUnitId;
    return generateResources(orgId, selectedProvider);
  }, [selectedOrgUnitId, selectedProvider, syncSeed]);
  
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesService = serviceFilter === 'all' || r.service === serviceFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesService && matchesStatus;
    });
  }, [resources, searchQuery, serviceFilter, statusFilter]);

  const { currentPage, setCurrentPage, totalPages, pageSize, paginatedData, totalItems } = useTableControls(filteredResources);

  const stats = useMemo(() => {
    const running = resources.filter(r => r.status === 'running').length;
    const stopped = resources.filter(r => r.status === 'stopped').length;
    const underutilized = resources.filter(r => r.cpuUtilization < 20 && r.memoryUtilization < 20).length;
    const totalCost = resources.reduce((sum, r) => sum + r.monthlyCost, 0);
    return { running, stopped, underutilized, totalCost };
  }, [resources]);

  const uniqueServices = [...new Set(resources.map(r => r.service))];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="resources-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resource Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and monitor all your cloud resources
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={() => {
                setSyncing(true);
                setTimeout(() => {
                  setSyncSeed(prev => prev + 1);
                  setSyncing(false);
                  toast({ title: "Sync complete", description: "Resource inventory has been synchronized." });
                }, 1500);
              }}
            >
              <IconRefresh className={cn("h-4 w-4 mr-2", syncing && "animate-spin")} />
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ['Name', 'Type', 'Service', 'Region', 'Status', 'CPU %', 'Memory %', 'Network %', 'Monthly Cost'];
                const rows = filteredResources.map(r => [
                  r.name,
                  r.type,
                  r.service,
                  r.region,
                  r.status,
                  r.cpuUtilization,
                  r.memoryUtilization,
                  r.networkUtilization,
                  r.monthlyCost,
                ]);
                downloadCsv('resources-export.csv', headers, rows);
                toast({ title: "Export complete", description: `Exported ${filteredResources.length} resources to CSV.` });
              }}
            >
              <IconDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: 'Running', value: stats.running, icon: IconCircleCheck, color: 'text-emerald-500', tooltip: 'Number of cloud resources currently in a running state and actively incurring compute charges.' },
            { label: 'Stopped', value: stats.stopped, icon: IconCircleX, color: 'text-muted-foreground', tooltip: 'Resources that are stopped but may still incur storage or allocation costs.' },
            { label: 'Underutilized', value: stats.underutilized, icon: IconAlertTriangle, color: 'text-amber-500', tooltip: 'Resources with CPU or memory utilization below 40%, candidates for rightsizing or termination.' },
            { label: 'Monthly Cost', value: formatCurrency(stats.totalCost, currency), icon: IconServer2, color: 'text-primary', isValue: true, tooltip: 'Total estimated monthly cost across all provisioned resources in the current view.' },
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
                          <p className={cn(
                            "font-bold font-mono",
                            stat.isValue ? "text-xl" : "text-2xl"
                          )}>{stat.value}</p>
                        </div>
                        <stat.icon className={cn("h-8 w-8", stat.color)} />
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
                  <IconServer2 className="h-5 w-5 text-primary" />
                  All Resources
                  <Badge variant="secondary" className="ml-2">{filteredResources.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search resources..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[200px]"
                      data-testid="input-search-resources"
                    />
                  </div>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-service-filter">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {uniqueServices.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px]" data-testid="select-status-filter">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="stopped">Stopped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table data-testid="table-resources">
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase">Resource</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Service</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Region</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">CPU</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Memory</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Network</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-right">Monthly Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((resource, index) => {
                      const cpuBadge = getUtilizationBadge(resource.cpuUtilization);
                      const memBadge = getUtilizationBadge(resource.memoryUtilization);
                      
                      return (
                        <TableRow 
                          key={resource.id}
                          className="hover-elevate cursor-pointer"
                          data-testid={`resource-row-${resource.id}`}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{resource.name}</p>
                              <p className="text-xs text-muted-foreground">{resource.type}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary"
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${serviceInfo[resource.service]?.color}20`,
                                color: serviceInfo[resource.service]?.color,
                              }}
                            >
                              {resource.service}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{regionNames[resource.region]?.split('-')[0] || resource.region}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {resource.status === 'running' ? (
                                <IconCircleCheck className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <IconCircleX className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm capitalize">{resource.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={resource.cpuUtilization} className="w-16 h-1.5" />
                              <span className={cn("text-xs font-mono", cpuBadge.color.split(' ')[0])}>
                                {resource.cpuUtilization}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={resource.memoryUtilization} className="w-16 h-1.5" />
                              <span className={cn("text-xs font-mono", memBadge.color.split(' ')[0])}>
                                {resource.memoryUtilization}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={resource.networkUtilization} className="w-16 h-1.5" />
                              <span className="text-xs font-mono text-muted-foreground">
                                {resource.networkUtilization}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-mono font-medium">
                              {formatCurrency(resource.monthlyCost, currency)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
      </div>
    </ScrollArea>
  );
}

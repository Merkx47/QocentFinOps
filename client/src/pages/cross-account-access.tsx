import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFinOpsStore } from '@/lib/finops-store';
import { downloadCsv } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';
import {
  buildTrustPolicy,
  getCustomerName,
  getSaasTool,
  getSaasTools,
  getToolConnections,
  roleArn,
  type SaasTool,
  type ToolConnection,
} from '@/lib/saas-tooling';
import {
  IconShieldLock,
  IconSearch,
  IconDownload,
  IconCopy,
  IconPlugConnected,
  IconBuildingSkyscraper,
  IconKey,
  IconCircleCheck,
  IconClockExclamation,
  IconExternalLink,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

interface Row {
  connection: ToolConnection;
  tool: SaasTool;
}

function PolicyBlock({ policy }: { policy: string }) {
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(policy);
    toast({ title: 'Copied', description: 'Trust policy copied to your clipboard.' });
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="absolute right-3 top-3 h-7 gap-1.5 text-xs"
        onClick={copy}
        data-testid="button-copy-policy"
      >
        <IconCopy className="h-3.5 w-3.5" />
        Copy
      </Button>
      <pre className="rounded-xl border border-border bg-muted/40 p-4 pr-24 text-[12px] leading-relaxed font-mono overflow-x-auto">
        {policy}
      </pre>
    </div>
  );
}

export default function CrossAccountAccess() {
  const { selectedProvider, selectedCustomerId } = useFinOpsStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showExternalIds, setShowExternalIds] = useState(false);
  const [openRow, setOpenRow] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(() => {
    return getToolConnections(selectedProvider, selectedCustomerId)
      .map(connection => {
        const tool = getSaasTool(connection.toolId);
        return tool ? { connection, tool } : null;
      })
      .filter((r): r is Row => r !== null)
      .sort((a, b) => a.tool.name.localeCompare(b.tool.name));
  }, [selectedProvider, selectedCustomerId]);

  const categories = useMemo(
    () => Array.from(new Set(getSaasTools().map(t => t.category))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return rows.filter(({ tool, connection }) => {
      const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
      const matchesQuery =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.vendor.toLowerCase().includes(query) ||
        tool.roleName.toLowerCase().includes(query) ||
        getCustomerName(connection.customerId).toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [rows, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const distinctTools = new Set(rows.map(r => r.tool.id)).size;
    const accounts = rows.reduce((sum, r) => sum + r.connection.accountsCovered, 0);
    const reviewDue = rows.filter(r => r.connection.status === 'review-due').length;
    return { distinctTools, accounts, reviewDue, connections: rows.length };
  }, [rows]);

  const exportInventory = () => {
    downloadCsv(
      `cross-account-access-${selectedCustomerId}.csv`,
      [
        'Tool',
        'Vendor',
        'Operated by',
        'Category',
        'Customer',
        'Role ARN',
        'Vendor AWS account',
        'External ID required',
        'External ID',
        'Access',
        'Accounts covered',
        'Last verified',
        'Verified by',
      ],
      filtered.map(({ tool, connection }) => [
        tool.name,
        tool.vendor,
        tool.partnerOperated ? 'Qocent' : 'Third party',
        tool.category,
        getCustomerName(connection.customerId),
        roleArn(tool, connection),
        tool.vendorAccountId,
        'Yes',
        connection.externalId,
        tool.accessType,
        connection.accountsCovered,
        connection.lastVerified,
        connection.verifiedBy,
      ])
    );
    toast({
      title: 'Inventory exported',
      description: `${filtered.length} connections written to CSV.`,
    });
  };

  const maskExternalId = (externalId: string) => {
    if (showExternalIds) return externalId;
    const prefix = externalId.split('-').slice(0, 2).join('-');
    return `${prefix}-••••••••-••••-••••-••••-••••••••••••`;
  };

  const scopeLabel =
    selectedCustomerId === 'all' ? 'all customers' : getCustomerName(selectedCustomerId);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="cross-account-access-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cross-Account Access</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Every tool that reaches into customer AWS accounts — ours and our vendors' — assumes an
              IAM role guarded by an external ID. Nothing here uses long-lived access keys. Showing {scopeLabel}.
            </p>
          </div>
          <Button variant="outline" onClick={exportInventory} data-testid="button-export-inventory">
            <IconDownload className="h-4 w-4 mr-2" />
            Export inventory
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            {
              label: 'Tools with access',
              value: stats.distinctTools,
              icon: IconPlugConnected,
              color: 'text-primary',
              tooltip: 'Distinct SaaS and platform tools holding a role in customer accounts.',
            },
            {
              label: 'Role connections',
              value: stats.connections,
              icon: IconShieldLock,
              color: 'text-blue-500',
              tooltip: 'One connection per tool per customer organisation.',
            },
            {
              label: 'External ID in place',
              value: `${stats.connections}/${stats.connections}`,
              icon: IconKey,
              color: 'text-emerald-500',
              tooltip: 'Connections whose trust policy conditions sts:AssumeRole on a unique external ID.',
            },
            {
              label: 'Verification due',
              value: stats.reviewDue,
              icon: IconClockExclamation,
              color: 'text-amber-500',
              tooltip: 'Connections last checked more than 90 days ago.',
            },
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
                          <p className="text-2xl font-bold font-mono">{stat.value}</p>
                        </div>
                        <div className={cn(
                          "p-2.5 rounded-xl",
                          stat.color === 'text-emerald-500' ? 'bg-emerald-500/10' :
                          stat.color === 'text-amber-500' ? 'bg-amber-500/10' :
                          stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10'
                        )}>
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
            </Tooltip>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border mb-6">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconShieldLock className="h-5 w-5 text-primary" />
                  Tooling with account access
                  <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="reveal-external-ids"
                      checked={showExternalIds}
                      onCheckedChange={setShowExternalIds}
                      data-testid="switch-reveal-external-ids"
                    />
                    <Label htmlFor="reveal-external-ids" className="text-xs text-muted-foreground cursor-pointer">
                      Reveal external IDs
                    </Label>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[190px] h-9 text-sm" data-testid="select-tool-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tools or roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[230px]"
                      data-testid="input-search-tools"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase">Tool</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Customer</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">IAM role</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Trusted principal</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">External ID</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-right">Accounts</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Access</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Last verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(row => {
                      const { tool, connection } = row;
                      return (
                        <TableRow
                          key={connection.id}
                          className="cursor-pointer"
                          onClick={() => setOpenRow(row)}
                          data-testid={`row-connection-${connection.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground truncate">{tool.name}</span>
                                  {tool.partnerOperated && (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Ours</Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{tool.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{getCustomerName(connection.customerId)}</TableCell>
                          <TableCell className="font-mono text-[12px]">{tool.roleName}</TableCell>
                          <TableCell className="font-mono text-[12px] text-muted-foreground">
                            {tool.vendorAccountId}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[240px] truncate">
                            {maskExternalId(connection.externalId)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{connection.accountsCovered}</TableCell>
                          <TableCell>
                            <Badge
                              variant={tool.accessType === 'Read-only' ? 'secondary' : 'outline'}
                              className="text-[11px]"
                            >
                              {tool.accessType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {connection.status === 'verified' ? (
                                <IconCircleCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <IconClockExclamation className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              )}
                              <span className="text-sm font-mono">{connection.lastVerified}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">
                          No tooling matches the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Select a row to see the trust policy deployed in the customer account.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconKey className="h-5 w-5 text-primary" />
                How these roles are set up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: 'One external ID per connection',
                    body: 'Each customer gets a distinct secret for each tool, generated by us rather than by the vendor, and shared with the vendor out of band.',
                  },
                  {
                    title: 'The role is the only door',
                    body: 'Vendors hold no IAM users and no long-lived keys in customer accounts. They call sts:AssumeRole from their own account and get short-lived credentials.',
                  },
                  {
                    title: 'Rotated on offboarding',
                    body: 'Removing a tool means deleting the role and retiring its external ID, so a leaked secret cannot be replayed later.',
                  },
                ].map(item => (
                  <div key={item.title} className="p-4 rounded-xl border border-border bg-background/50">
                    <p className="text-sm font-semibold text-foreground mb-1.5">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Trust policy shape</p>
                <p className="text-xs text-muted-foreground mb-3 max-w-3xl">
                  The first statement lets only the vendor's account assume the role, and only when it
                  passes the external ID we issued. The second stops the role being assumed at all if the
                  external ID is missing, so the condition cannot be dropped by a later policy edit.
                </p>
                <PolicyBlock
                  policy={JSON.stringify(
                    {
                      Version: '2012-10-17',
                      Statement: [
                        {
                          Sid: 'VendorCrossAccountAccess',
                          Effect: 'Allow',
                          Principal: { AWS: 'arn:aws:iam::<VENDOR_ACCOUNT_ID>:root' },
                          Action: 'sts:AssumeRole',
                          Condition: { StringEquals: { 'sts:ExternalId': '<EXTERNAL_ID>' } },
                        },
                        {
                          Sid: 'DenyAssumeRoleWithoutExternalId',
                          Effect: 'Deny',
                          Principal: { AWS: '*' },
                          Action: 'sts:AssumeRole',
                          Condition: { Null: { 'sts:ExternalId': 'true' } },
                        },
                      ],
                    },
                    null,
                    2
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={openRow !== null} onOpenChange={(open) => !open && setOpenRow(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            {openRow && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {openRow.tool.name}
                    <span className="text-muted-foreground font-normal">·</span>
                    <span className="text-muted-foreground font-normal text-base">
                      {getCustomerName(openRow.connection.customerId)}
                    </span>
                    {openRow.tool.partnerOperated && (
                      <Badge variant="secondary" className="text-[10px]">Operated by us</Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground -mt-1">{openRow.tool.purpose}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Vendor', value: openRow.tool.vendor },
                    { label: 'Category', value: openRow.tool.category },
                    { label: 'Role ARN', value: roleArn(openRow.tool, openRow.connection), mono: true },
                    { label: 'Vendor AWS account', value: openRow.tool.vendorAccountId, mono: true },
                    { label: 'External ID', value: openRow.connection.externalId, mono: true },
                    { label: 'Access', value: openRow.tool.accessType },
                    { label: 'Accounts covered', value: String(openRow.connection.accountsCovered) },
                    { label: 'Internal owner', value: openRow.tool.owner },
                    { label: 'Last verified', value: `${openRow.connection.lastVerified} by ${openRow.connection.verifiedBy}` },
                  ].map(field => (
                    <div key={field.label} className="p-3 rounded-lg border border-border bg-background/50 min-w-0">
                      <p className="text-[11px] text-muted-foreground mb-0.5">{field.label}</p>
                      <p className={cn('text-sm break-all', field.mono && 'font-mono text-[12px]')}>
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Attached permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {openRow.tool.permissions.map(permission => (
                      <Badge key={permission} variant="outline" className="text-[11px] font-mono">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <IconBuildingSkyscraper className="h-4 w-4 text-muted-foreground" />
                    Trust policy on {roleArn(openRow.tool, openRow.connection).split('/').pop()}
                  </p>
                  <PolicyBlock policy={buildTrustPolicy(openRow.tool, openRow.connection)} />
                </div>

                <a
                  href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-user_externalid.html"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  AWS guidance on external IDs
                  <IconExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}

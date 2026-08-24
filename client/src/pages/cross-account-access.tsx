import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  getCustomerName,
  getSaasTool,
  getSaasTools,
  runCrossAccountScan,
  type SaasTool,
  type ScannedRole,
} from '@/lib/cross-account-scanner';
import {
  EXTERNAL_ID_STANDARD,
  buildTrustPolicy,
  getCustomerAwsOrg,
  getExternalId,
  getPolicyFindings,
  isRotationDue,
  listRetiredExternalIds,
} from '@/lib/cross-account-policies';
import {
  evaluateTrustPolicy,
  parseTrustPolicy,
  type PolicyVerdict,
} from '@shared/trust-policy';
import {
  IconShieldLock,
  IconSearch,
  IconDownload,
  IconCopy,
  IconPlugConnected,
  IconKey,
  IconCircleCheck,
  IconAlertTriangle,
  IconClockExclamation,
  IconExternalLink,
  IconFileText,
  IconHistory,
  IconTestPipe,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

interface Row {
  role: ScannedRole;
  tool: SaasTool;
  verdict: PolicyVerdict;
}

const VERIFICATION_WINDOW_DAYS = 90;

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

function PolicyBlock({ policy, testId }: { policy: string; testId?: string }) {
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
        data-testid={testId ?? 'button-copy-policy'}
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

function CheckList({ verdict }: { verdict: PolicyVerdict }) {
  return (
    <ul className="space-y-2">
      {verdict.checks.map(check => (
        <li key={check.id} className="flex items-start gap-2.5">
          {check.passed ? (
            <IconCircleCheck className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          ) : check.severity === 'required' ? (
            <IconAlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          ) : (
            <IconAlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{check.label}</span>
              {check.severity === 'hardening' && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">Advisory</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{check.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const UNGATED_EXAMPLE = JSON.stringify(
  {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'VendorAccess',
        Effect: 'Allow',
        Principal: { AWS: 'arn:aws:iam::417248063411:root' },
        Action: 'sts:AssumeRole',
      },
    ],
  },
  null,
  2
);

function PolicyValidator() {
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<{ verdict?: PolicyVerdict; error?: string } | null>(null);

  const check = () => {
    try {
      setResult({ verdict: evaluateTrustPolicy(parseTrustPolicy(draft)) });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'That policy could not be read.' });
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-card-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <IconTestPipe className="h-5 w-5 text-primary" />
          Check a trust policy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground max-w-3xl">
          Paste a policy to run it through the same rules that grade the roles above — useful before a new
          tool is onboarded, or to confirm what the rules reject.
        </p>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='{ "Version": "2012-10-17", "Statement": [ ... ] }'
          className="font-mono text-[12px] min-h-[180px]"
          data-testid="textarea-policy-draft"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={check} disabled={!draft.trim()} data-testid="button-check-policy">
            Check policy
          </Button>
          <Button
            variant="outline"
            onClick={() => { setDraft(UNGATED_EXAMPLE); setResult(null); }}
            data-testid="button-load-ungated"
          >
            Load one with no external ID
          </Button>
          {draft && (
            <Button variant="ghost" onClick={() => { setDraft(''); setResult(null); }}>
              Clear
            </Button>
          )}
        </div>

        {result?.error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4">
            <p className="text-sm text-red-500">{result.error}</p>
          </div>
        )}

        {result?.verdict && (
          <div
            className={cn(
              'rounded-xl border p-4 space-y-3',
              result.verdict.compliant
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-red-500/40 bg-red-500/5'
            )}
            data-testid="validator-result"
          >
            <div className="flex items-center gap-2">
              {result.verdict.compliant ? (
                <IconCircleCheck className="h-5 w-5 text-emerald-500" />
              ) : (
                <IconAlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm font-semibold">
                {result.verdict.compliant
                  ? 'Cross-account access is gated on an external ID.'
                  : 'This policy would not be accepted.'}
              </span>
            </div>
            <CheckList verdict={result.verdict} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CrossAccountAccess() {
  const { selectedProvider, selectedCustomerId, user } = useFinOpsStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showExternalIds, setShowExternalIds] = useState(false);
  const [openRow, setOpenRow] = useState<Row | null>(null);

  const scan = useMemo(
    () => runCrossAccountScan(selectedProvider, selectedCustomerId),
    [selectedProvider, selectedCustomerId]
  );

  const rows = useMemo<Row[]>(() => {
    return scan.roles
      .map(role => {
        const tool = getSaasTool(role.toolId);
        if (!tool) return null;
        return { role, tool, verdict: evaluateTrustPolicy(role.trustPolicy) };
      })
      .filter((r): r is Row => r !== null)
      .sort((a, b) => a.tool.name.localeCompare(b.tool.name));
  }, [scan]);

  const findings = useMemo(() => getPolicyFindings(selectedCustomerId), [selectedCustomerId]);
  const retiredIds = useMemo(() => listRetiredExternalIds(selectedCustomerId), [selectedCustomerId]);

  const categories = useMemo(
    () => Array.from(new Set(getSaasTools().map(t => t.category))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return rows.filter(({ tool, role }) => {
      const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
      const matchesQuery =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.vendor.toLowerCase().includes(query) ||
        role.roleName.toLowerCase().includes(query) ||
        getCustomerName(role.customerId).toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [rows, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const gated = rows.filter(r => r.verdict.compliant).length;
    const advisories = rows.filter(r =>
      r.verdict.checks.some(c => c.severity === 'hardening' && !c.passed)
    ).length;
    const staleVerification = rows.filter(
      r => daysSince(r.role.lastVerified) > VERIFICATION_WINDOW_DAYS
    ).length;
    const rotationDue = rows.filter(r => {
      const issued = getExternalId(r.role.customerId, r.tool.id);
      return issued ? isRotationDue(issued) : false;
    }).length;
    return {
      tools: new Set(rows.map(r => r.tool.id)).size,
      connections: rows.length,
      gated,
      ungated: rows.length - gated,
      advisories,
      staleVerification,
      rotationDue,
    };
  }, [rows]);

  const externalIdOf = (row: Row) => row.verdict.externalIds[0] ?? '—';

  const maskExternalId = (externalId: string) => {
    if (showExternalIds) return externalId;
    const prefix = externalId.split('-').slice(0, 2).join('-');
    return `${prefix}-••••••••-••••-••••-••••-••••••••••••`;
  };

  const scopeLabel =
    selectedCustomerId === 'all' ? 'all customers' : getCustomerName(selectedCustomerId);

  const exportCsv = () => {
    downloadCsv(
      `cross-account-access-${selectedCustomerId}.csv`,
      [
        'Tool', 'Vendor', 'Operated by', 'Category', 'Customer', 'Role ARN', 'Role ID',
        'Trusted principal', 'External ID enforced', 'External ID', 'Issued on', 'Rotates on',
        'Access', 'Accounts covered', 'Role created', 'Role last used', 'Last verified', 'Verified by',
      ],
      filtered.map(({ tool, role, verdict }) => [
        tool.name,
        tool.vendor,
        tool.partnerOperated ? 'Qucoon' : 'Third party',
        tool.category,
        getCustomerName(role.customerId),
        role.roleArn,
        role.roleId,
        verdict.trustedPrincipals.join(' '),
        verdict.compliant ? 'Yes' : 'No',
        externalIdOf({ tool, role, verdict }),
        getExternalId(role.customerId, tool.id)?.issuedOn ?? '',
        getExternalId(role.customerId, tool.id)?.rotatesOn ?? '',
        tool.accessType,
        role.accountsCovered,
        role.createdDate,
        role.roleLastUsed,
        role.lastVerified,
        role.verifiedBy,
      ])
    );
    toast({ title: 'Inventory exported', description: `${filtered.length} roles written to CSV.` });
  };

  const exportEvidencePack = () => {
    const generatedAt = new Date().toISOString();
    const attestedBy = user ? `${user.name} (${user.role}), ${user.email}` : 'Cloud Platform Team';
    const uniqueTools = Array.from(new Map(filtered.map(r => [r.tool.id, r])).values());
    const checkLabels = rows[0]?.verdict.checks ?? [];

    const lines: string[] = [
      '# Cross-account access to customer AWS accounts',
      '',
      `Generated: ${generatedAt}`,
      `Prepared by: ${attestedBy}`,
      `Scope: ${scopeLabel}`,
      `Accounts read: ${scan.accountsScanned.join(', ') || 'none'}`,
      `Inventory reference: ${scan.scanId}`,
      '',
      '## Position',
      '',
      `${stats.gated} of ${stats.connections} role connections gate sts:AssumeRole on an external ID.`,
      'No third-party or partner-operated tool holds an IAM user or long-lived access key in a customer account.',
      '',
      '## How external IDs are issued',
      '',
      `- Issued by ${EXTERNAL_ID_STANDARD.issuer}, never chosen by the vendor.`,
      `- ${EXTERNAL_ID_STANDARD.randomLength} random characters after a customer specific prefix.`,
      `- Rotated every ${EXTERNAL_ID_STANDARD.rotationMonths} months and on offboarding.`,
      `- ${EXTERNAL_ID_STANDARD.transport}`,
      `- ${EXTERNAL_ID_STANDARD.note}`,
      '',
      '## Rules applied to every trust policy',
      '',
      ...checkLabels.map(c => `- **${c.label}** (${c.severity === 'required' ? 'required' : 'advisory'})`),
      '',
      '## Tools with access to customer AWS accounts',
      '',
      '| Tool | Operated by | Customer | IAM role | Trusted principal | External ID enforced | Issued | Rotates | Access | Accounts |',
      '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      ...filtered.map(({ tool, role, verdict }) => {
        const issued = getExternalId(role.customerId, tool.id);
        return `| ${tool.name} | ${tool.partnerOperated ? 'Qucoon' : tool.vendor} | ${getCustomerName(role.customerId)} | \`${role.roleArn}\` | \`${verdict.trustedPrincipals.join(', ')}\` | ${verdict.compliant ? 'Yes' : 'No'} | ${issued?.issuedOn ?? '—'} | ${issued?.rotatesOn ?? '—'} | ${tool.accessType} | ${role.accountsCovered} |`;
      }),
      '',
      '## Example trust policies',
      '',
    ];

    for (const { tool, role, verdict } of uniqueTools) {
      lines.push(
        `### ${tool.name} — ${getCustomerName(role.customerId)}`,
        '',
        `Role: \`${role.roleArn}\``,
        `External ID enforced: ${verdict.compliant ? 'yes' : 'no'}`,
        '',
        '```json',
        JSON.stringify(role.trustPolicy, null, 2),
        '```',
        ''
      );
    }

    if (findings.length > 0) {
      lines.push('## Findings raised and closed', '');
      for (const finding of findings) {
        const tool = getSaasTool(finding.toolId);
        lines.push(
          `- **${finding.raisedOn} → ${finding.closedOn}** · ${tool?.name ?? finding.toolId} · ${getCustomerName(finding.customerId)}`,
          `  - Finding: ${finding.summary}`,
          `  - Closed by: ${finding.action}`
        );
      }
      lines.push('');
    }

    if (retiredIds.length > 0) {
      lines.push('## External IDs withdrawn', '');
      for (const record of retiredIds) {
        lines.push(
          `- **${record.issuedOn} → ${record.retiredOn}** · ${getSaasTool(record.toolId)?.name ?? record.toolId} · ${getCustomerName(record.customerId)} — ${record.retiredReason}`
        );
      }
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cross-account-access-evidence-${selectedCustomerId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Evidence pack ready',
      description: `${uniqueTools.length} trust policies and ${filtered.length} roles, attested to ${user?.name ?? 'the platform team'}.`,
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto space-y-6" data-testid="cross-account-access-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cross-Account Access</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Every tool that reaches into customer AWS accounts — ours and our vendors' — assumes an IAM
              role. Each role's trust policy is read back and graded on whether it requires an external ID.
              Showing {scopeLabel}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv} data-testid="button-export-inventory">
              <IconDownload className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportEvidencePack} data-testid="button-export-evidence">
              <IconFileText className="h-4 w-4 mr-2" />
              Evidence pack
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 [&>*]:min-w-0">
          {[
            {
              label: 'Tools with access',
              value: stats.tools,
              icon: IconPlugConnected,
              color: 'text-primary',
              tooltip: 'Distinct vendor and platform tools holding a role in customer accounts.',
            },
            {
              label: 'Role connections',
              value: stats.connections,
              icon: IconShieldLock,
              color: 'text-blue-500',
              tooltip: 'One connection per tool per customer organisation.',
            },
            {
              label: 'External ID enforced',
              value: `${stats.gated}/${stats.connections}`,
              icon: IconKey,
              color: stats.ungated > 0 ? 'text-red-500' : 'text-emerald-500',
              tooltip: 'Roles whose trust policy conditions sts:AssumeRole on an exact external ID, read from the policy itself.',
            },
            {
              label: 'Rotation due',
              value: `${stats.rotationDue} of ${stats.connections}`,
              icon: IconClockExclamation,
              color: 'text-amber-500',
              tooltip: `External IDs past their ${EXTERNAL_ID_STANDARD.rotationMonths} month rotation date, or roles not verified in ${VERIFICATION_WINDOW_DAYS} days (${stats.staleVerification}).`,
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
                          stat.color === 'text-red-500' ? 'bg-red-500/10' :
                          stat.color === 'text-blue-500' ? 'bg-blue-500/10' : 'bg-primary/10'
                        )}>
                          <stat.icon className={cn("h-6 w-6", stat.color)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] text-center">
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
                      <TableHead className="text-xs font-semibold uppercase">Trust policy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(row => {
                      const { tool, role, verdict } = row;
                      const advisory = verdict.checks.some(c => c.severity === 'hardening' && !c.passed);
                      return (
                        <TableRow
                          key={role.connectionId}
                          className="cursor-pointer"
                          onClick={() => setOpenRow(row)}
                          data-testid={`row-connection-${role.connectionId}`}
                        >
                          <TableCell>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground truncate">{tool.name}</span>
                                {tool.partnerOperated && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Ours</Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">{tool.category}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{getCustomerName(role.customerId)}</TableCell>
                          <TableCell className="font-mono text-[12px]">{role.roleName}</TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[190px] truncate">
                            {verdict.trustedPrincipals[0] ?? '—'}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground max-w-[240px] truncate">
                            {maskExternalId(externalIdOf(row))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{role.accountsCovered}</TableCell>
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
                              {verdict.compliant ? (
                                <IconCircleCheck className={cn('h-4 w-4 flex-shrink-0', advisory ? 'text-amber-500' : 'text-emerald-500')} />
                              ) : (
                                <IconAlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              <span className="text-sm">
                                {verdict.compliant
                                  ? advisory ? 'External ID, with notes' : 'External ID enforced'
                                  : 'Not gated'}
                              </span>
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
                Select a row for the trust policy read back from the role and the rules applied to it.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <PolicyValidator />
        </motion.div>

        {findings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconHistory className="h-5 w-5 text-primary" />
                  Findings raised and closed
                  <Badge variant="secondary" className="ml-2">{findings.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {findings.map(finding => {
                  const tool = getSaasTool(finding.toolId);
                  return (
                    <div
                      key={finding.id}
                      className="p-4 rounded-xl border border-border bg-background/50"
                      data-testid={`finding-${finding.id}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-foreground">{tool?.name ?? finding.toolId}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">{getCustomerName(finding.customerId)}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-1">
                          <IconCircleCheck className="h-3 w-3" />
                          Closed {finding.closedOn}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/90">{finding.summary}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Raised {finding.raisedOn}. {finding.action}
                      </p>
                    </div>
                  );
                })}
                {retiredIds.length > 0 && (
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-foreground mb-2">External IDs withdrawn</p>
                    <div className="rounded-xl border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs font-semibold uppercase">Tool</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Customer</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">In force</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Withdrawn because</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {retiredIds.map(record => (
                            <TableRow key={record.id} data-testid={`retired-${record.id}`}>
                              <TableCell className="text-sm">{getSaasTool(record.toolId)?.name ?? record.toolId}</TableCell>
                              <TableCell className="text-sm">{getCustomerName(record.customerId)}</TableCell>
                              <TableCell className="font-mono text-[12px] whitespace-nowrap">
                                {record.issuedOn} → {record.retiredOn}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{record.retiredReason}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Withdrawn values are never reissued. {EXTERNAL_ID_STANDARD.transport}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
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
                    body: `Each customer gets a distinct ${EXTERNAL_ID_STANDARD.randomLength} character value for each tool. ${EXTERNAL_ID_STANDARD.note}`,
                  },
                  {
                    title: 'The role is the only door',
                    body: 'Vendors hold no IAM users and no long-lived keys in customer accounts. They call sts:AssumeRole from their own account and get short-lived credentials.',
                  },
                  {
                    title: `Rotated every ${EXTERNAL_ID_STANDARD.rotationMonths} months`,
                    body: 'Removing a tool means deleting the role and retiring its external ID, so a leaked value cannot be replayed later. The register keeps every value it has withdrawn.',
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
                  The first statement lets only the vendor's account assume the role, and only when it passes
                  the external ID we issued. The second stops the role being assumed at all if the external ID
                  is missing, so the condition cannot be dropped by a later policy edit.
                </p>
                <PolicyBlock
                  testId="button-copy-reference-policy"
                  policy={JSON.stringify(
                    buildTrustPolicy({
                      sid: 'VendorCrossAccountAccess',
                      vendorAccountId: '<VENDOR_ACCOUNT_ID>',
                      externalId: '<EXTERNAL_ID>',
                    }),
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
                  <DialogTitle className="flex items-center gap-2 flex-wrap">
                    {openRow.tool.name}
                    <span className="text-muted-foreground font-normal">·</span>
                    <span className="text-muted-foreground font-normal text-base">
                      {getCustomerName(openRow.role.customerId)}
                    </span>
                    {openRow.tool.partnerOperated && (
                      <Badge variant="secondary" className="text-[10px]">Operated by us</Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground -mt-1">{openRow.tool.purpose}</p>

                <div
                  className={cn(
                    'rounded-xl border p-3',
                    openRow.verdict.compliant
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-red-500/40 bg-red-500/5'
                  )}
                >
                  <CheckList verdict={openRow.verdict} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Vendor', value: openRow.tool.vendor },
                    { label: 'Category', value: openRow.tool.category },
                    { label: 'Role ARN', value: openRow.role.roleArn, mono: true },
                    { label: 'Role ID', value: openRow.role.roleId, mono: true },
                    { label: 'Trusted principal', value: openRow.verdict.trustedPrincipals.join(', '), mono: true },
                    { label: 'External ID', value: externalIdOf(openRow), mono: true },
                    { label: 'Access', value: openRow.tool.accessType },
                    { label: 'Accounts covered', value: String(openRow.role.accountsCovered) },
                    { label: 'Role created', value: openRow.role.createdDate },
                    { label: 'Role last used', value: openRow.role.roleLastUsed },
                    { label: 'Internal owner', value: openRow.tool.owner },
                    { label: 'Last verified', value: `${openRow.role.lastVerified} by ${openRow.role.verifiedBy}` },
                    ...(() => {
                      const issued = getExternalId(openRow.role.customerId, openRow.tool.id);
                      const org = getCustomerAwsOrg(openRow.role.customerId);
                      return [
                        { label: 'External ID issued', value: issued ? `${issued.issuedOn} by ${issued.issuedBy}` : 'Not issued' },
                        { label: 'Rotates on', value: issued ? `${issued.rotatesOn}${isRotationDue(issued) ? ' — overdue' : ''}` : '—' },
                        { label: 'AWS organization', value: org?.organizationId ?? '—', mono: true },
                        { label: 'Deployed by', value: org ? `${org.deployedBy} (${org.stackSetName})` : '—' },
                      ];
                    })(),
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
                    {openRow.role.attachedPolicies.map(permission => (
                      <Badge key={permission} variant="outline" className="text-[11px] font-mono">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    AssumeRolePolicyDocument on {openRow.role.roleName}
                  </p>
                  <PolicyBlock policy={JSON.stringify(openRow.role.trustPolicy, null, 2)} />
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

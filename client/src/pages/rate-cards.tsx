import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFinOpsStore, formatCurrency, formatCompactCurrency, convertCurrency } from '@/lib/finops-store';
import { useCustomers } from '@/lib/customers';
import { NumberField } from '@/components/number-field';
import { getProviderConfig } from '@/lib/provider-config';
import { generateServiceBreakdown, withCustomerScope } from '@/lib/finops-data';
import { downloadCsv } from '@/lib/csv-utils';
import { downloadMarkdown } from '@/lib/report-utils';
import { useToast } from '@/hooks/use-toast';
import { uid } from '@/lib/tco-store';
import {
  MANAGED_CHARGE_LABELS,
  activeVersion,
  buildStatement,
  emptyCard,
  nextVersionNumber,
  parseUsageCsv,
  resolveRate,
  useRateCardStore,
  versionsForCustomer,
  type AdjustmentType,
  type ManagedChargeBasis,
  type RateCardVersion,
  type UsageLine,
} from '@/lib/rate-card-store';
import {
  IconReceipt,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconDownload,
  IconFileText,
  IconUpload,
  IconRefresh,
  IconVersions,
  IconCoin,
  IconPercentage,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function RateCards() {
  const { currency, selectedProvider, selectedCustomerId, dateRange, user } = useFinOpsStore();
  const { cards, usageByCustomer, saveCard, deleteCard, setUsage } = useRateCardStore();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const config = getProviderConfig(selectedProvider);
  const customers = useCustomers(selectedProvider);

  const [customerId, setCustomerId] = useState<string>(
    selectedCustomerId !== 'all' ? selectedCustomerId : customers[0]?.id ?? ''
  );
  const [period, setPeriod] = useState(currentMonth());
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RateCardVersion | null>(null);

  // The header filter seeds the customer when it changes; the page picker stays usable after that.
  useEffect(() => {
    if (selectedCustomerId !== 'all') {
      setCustomerId(selectedCustomerId);
      setViewingVersionId(null);
    }
  }, [selectedCustomerId]);

  const customer = customers.find(c => c.id === customerId);
  const versions = useMemo(() => versionsForCustomer(cards, customerId), [cards, customerId]);
  const today = new Date().toISOString().split('T')[0];
  const resolved = useMemo(() => activeVersion(cards, customerId), [cards, customerId]);
  const inForce = resolved && resolved.effectiveFrom <= today ? resolved : undefined;
  const viewing = versions.find(v => v.id === viewingVersionId) ?? resolved;

  // Reset the editor whenever a different version comes into view.
  useEffect(() => {
    setDraft(viewing ? { ...viewing } : null);
  }, [viewing?.id]);

  const isDirty = draft && viewing ? JSON.stringify(viewing) !== JSON.stringify(draft) : false;

  const usage = usageByCustomer[customerId] ?? [];
  const statement = useMemo(
    () => (draft ? buildStatement(draft, usage, customer?.accountCount ?? 0) : null),
    [draft, usage, customer?.accountCount]
  );

  const patch = (changes: Partial<RateCardVersion>) =>
    setDraft(current => (current ? { ...current, ...changes } : current));

  const saveDraft = () => {
    if (!draft) return;
    saveCard(draft);
    toast({ title: 'Rate card saved', description: `Version ${draft.version} for ${customer?.name}.` });
  };

  const createVersion = () => {
    if (!customerId) return;
    const base = resolved;
    const version = nextVersionNumber(cards, customerId);
    const fresh: RateCardVersion = base
      ? {
          ...base,
          id: uid('rc'),
          version,
          effectiveFrom: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          createdBy: user?.name ?? 'Cloud Platform Team',
          note: `Version ${version}, based on version ${base.version}.`,
          serviceRates: base.serviceRates.map(r => ({ ...r, id: uid('sr') })),
          managedServiceCharges: base.managedServiceCharges.map(c => ({ ...c, id: uid('msc') })),
        }
      : emptyCard(customerId, version, user?.name ?? 'Cloud Platform Team');

    saveCard(fresh);
    setViewingVersionId(fresh.id);
    toast({
      title: `Version ${version} created`,
      description: 'Set its effective date and agreed rates, then save.',
    });
  };

  const removeVersion = () => {
    if (!draft) return;
    if (versions.length <= 1) {
      toast({ title: 'Cannot delete', description: 'A customer must keep at least one rate card version.' });
      return;
    }
    deleteCard(draft.id);
    setViewingVersionId(null);
    toast({ title: 'Version deleted' });
  };

  const loadFromCostData = () => {
    if (!customerId) return;
    const breakdown = withCustomerScope(customerId, () =>
      generateServiceBreakdown('all', selectedProvider, dateRange)
    );
    const lines: UsageLine[] = breakdown.map(item => ({
      id: uid('usage'),
      service: item.service,
      region: customer?.primaryRegion ?? config.regions[0],
      description: `${item.resourceCount} billed resources`,
      quantity: item.resourceCount,
      unit: 'resources',
      baseCost: Math.round(item.cost * 100) / 100,
    }));
    setUsage(customerId, lines);
    toast({ title: 'Usage loaded', description: `${lines.length} service lines from the current cost data.` });
  };

  const importCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const { lines, skipped } = parseUsageCsv(String(reader.result ?? ''));
      if (lines.length === 0) {
        toast({ title: 'Nothing imported', description: 'No usable rows were found in that file.' });
        return;
      }
      setUsage(customerId, lines);
      toast({
        title: 'Usage imported',
        description: `${lines.length} lines loaded${skipped > 0 ? `, ${skipped} row${skipped === 1 ? '' : 's'} skipped` : ''}.`,
      });
    };
    reader.readAsText(file);
  };

  const updateUsageLine = (id: string, changes: Partial<UsageLine>) =>
    setUsage(customerId, usage.map(line => (line.id === id ? { ...line, ...changes } : line)));

  const exportStatementCsv = () => {
    if (!statement || !draft || !customer) return;
    const amount = (value: number) => round(convertCurrency(value, currency));
    downloadCsv(
      `statement-${slugify(customer.name)}-${period}.csv`,
      ['Section', 'Item', 'Region', `AWS base cost (${currency})`, 'Agreed rate', `Adjustment (${currency})`, `Customer charge (${currency})`],
      [
        ...statement.usage.lines.map(line => [
          'AWS charges',
          line.service,
          line.region,
          amount(line.baseCost),
          `${line.adjustmentType} ${line.percent}%`,
          amount(line.adjustmentAmount),
          amount(line.customerCharge),
        ]),
        ['AWS charges', 'Subtotal', '', amount(statement.usage.baseTotal), '', amount(statement.usage.adjustmentTotal), amount(statement.usage.chargeTotal)],
        ...statement.managedCharges.map(charge => [
          'Managed services',
          charge.label,
          '',
          '',
          charge.basisLabel,
          '',
          amount(charge.computed),
        ]),
        ['Managed services', 'Subtotal', '', '', '', '', amount(statement.managedTotal)],
        ['Total', 'Total customer charge', '', '', '', '', amount(statement.total)],
      ]
    );
    toast({ title: 'Statement exported', description: 'Billing statement written to CSV.' });
  };

  const exportStatement = () => {
    if (!statement || !draft || !customer) return;
    const money = (value: number) => formatCurrency(value, currency);
    const lines = [
      `# Cost statement — ${customer.name}`,
      '',
      `Billing period: ${period}`,
      `Rate card: version ${draft.version}, effective ${draft.effectiveFrom}`,
      `Linked accounts: ${customer.accountCount}`,
      `Prepared by: ${user?.name ?? 'Cloud Platform Team'} on ${new Date().toISOString().split('T')[0]}`,
      `All figures in ${currency}.`,
      ...(isDirty ? ['', '> This statement was produced from unsaved edits to the rate card.'] : []),
      '',
      '## AWS charges',
      '',
      '| Service | Region | AWS base cost | Agreed rate | Adjustment | Customer AWS charge |',
      '| --- | --- | --- | --- | --- | --- |',
      ...statement.usage.lines.map(
        line =>
          `| ${line.service} | ${line.region} | ${money(line.baseCost)} | ${line.adjustmentType} ${line.percent}%${line.rateSource === 'global' ? ' (global)' : ''} | ${money(line.adjustmentAmount)} | ${money(line.customerCharge)} |`
      ),
      `| **Subtotal** | | **${money(statement.usage.baseTotal)}** | | **${money(statement.usage.adjustmentTotal)}** | **${money(statement.usage.chargeTotal)}** |`,
      '',
      '## Managed service charges',
      '',
      statement.managedCharges.length > 0 ? '| Charge | Basis | Amount |' : 'None on this rate card.',
      ...(statement.managedCharges.length > 0
        ? [
            '| --- | --- | --- |',
            ...statement.managedCharges.map(c => `| ${c.label} | ${c.basisLabel} | ${money(c.computed)} |`),
            `| **Subtotal** | | **${money(statement.managedTotal)}** |`,
          ]
        : []),
      '',
      '## Total',
      '',
      `| Line | Amount |`,
      `| --- | --- |`,
      `| AWS charges at agreed rates | ${money(statement.usage.chargeTotal)} |`,
      `| Managed service charges | ${money(statement.managedTotal)} |`,
      `| **Total customer charge** | **${money(statement.total)}** |`,
      '',
      '## Rates applied',
      '',
      `- Headline rate: ${draft.globalAdjustment.adjustmentType} ${draft.globalAdjustment.percent}% on AWS base cost.`,
      ...(draft.serviceRates.length > 0
        ? draft.serviceRates.map(r => `- ${r.service}: ${r.adjustmentType} ${r.percent}%`)
        : ['- No per-service exceptions.']),
      draft.note ? `\n${draft.note}` : '',
      '',
    ];
    downloadMarkdown(`statement-${slugify(customer.name)}-${period}.md`, lines.join('\n'));
    toast({ title: 'Statement ready', description: 'Billing statement written to Markdown.' });
  };

  if (customers.length === 0) {
    return (
      <div className="p-6">
        <Card className="bg-card/50 border-card-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Rate cards are available in the AWS portal.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto space-y-6" data-testid="rate-cards-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customer Rate Cards</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              The agreed rate for each customer, versioned by effective date, applied to their AWS usage to
              produce the charge they see. Managed service fees are kept separate from AWS charges.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={createVersion} data-testid="button-new-version">
              <IconPlus className="h-4 w-4 mr-2" />
              New version
            </Button>
            {draft && (
              <Button onClick={saveDraft} disabled={!isDirty} data-testid="button-save-card">
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                {isDirty ? 'Save changes' : 'Saved'}
              </Button>
            )}
          </div>
        </motion.div>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardContent className="py-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <Select
                value={customerId}
                onValueChange={(v) => { setCustomerId(v); setViewingVersionId(null); }}
              >
                <SelectTrigger className="w-[220px] h-9 text-sm" data-testid="select-rate-card-customer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Billing period</Label>
              <Input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-[160px] h-9 text-sm"
                data-testid="input-billing-period"
              />
            </div>
            {draft && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[11px]">Version {draft.version}</Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[11px]',
                    viewing?.id === inForce?.id
                      ? 'text-emerald-500 border-emerald-500/40'
                      : 'text-muted-foreground'
                  )}
                >
                  {viewing?.id === inForce?.id ? 'In force' : 'Not in force'}
                </Badge>
                <span className="text-xs text-muted-foreground">effective {draft.effectiveFrom}</span>
                {isDirty && (
                  <Badge variant="outline" className="text-[11px] text-amber-500 border-amber-500/40">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {!draft && (
          <Card className="bg-card/50 border-card-border">
            <CardContent className="py-12 text-center space-y-3">
              <IconReceipt className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No rate card for {customer?.name ?? 'this customer'} yet.
              </p>
              <Button onClick={createVersion}>
                <IconPlus className="h-4 w-4 mr-2" />
                Create the first version
              </Button>
            </CardContent>
          </Card>
        )}

        {draft && statement && (
          <Tabs defaultValue="card" className="space-y-4">
            <TabsList>
              <TabsTrigger value="card" data-testid="tab-rate-card">Rate card</TabsTrigger>
              <TabsTrigger value="usage" data-testid="tab-usage">Usage and charges</TabsTrigger>
              <TabsTrigger value="statement" data-testid="tab-statement">Statement</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <IconPercentage className="h-4 w-4 text-primary" />
                      Agreed rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Effective from</Label>
                        <Input
                          type="date"
                          value={draft.effectiveFrom}
                          onChange={(e) => patch({ effectiveFrom: e.target.value })}
                          className="h-9 text-sm"
                          data-testid="input-effective-from"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Agreed by</Label>
                        <Input
                          value={draft.createdBy}
                          onChange={(e) => patch({ createdBy: e.target.value })}
                          className="h-9 text-sm"
                          data-testid="input-created-by"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-background/50 space-y-2">
                      <Label className="text-xs">Headline rate, applied to every service without an exception</Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={draft.globalAdjustment.adjustmentType}
                          onValueChange={(v) =>
                            patch({ globalAdjustment: { ...draft.globalAdjustment, adjustmentType: v as AdjustmentType } })
                          }
                        >
                          <SelectTrigger className="w-[130px] h-9 text-sm" data-testid="select-global-adjustment">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="markup">Markup</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
                          </SelectContent>
                        </Select>
                        <NumberField
                          value={draft.globalAdjustment.percent}
                          onChange={(percent) =>
                            patch({ globalAdjustment: { ...draft.globalAdjustment, percent } })
                          }
                          className="h-9 w-24 font-mono text-sm text-right"
                          data-testid="input-global-percent"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Note</Label>
                      <Textarea
                        value={draft.note}
                        onChange={(e) => patch({ note: e.target.value })}
                        className="text-sm min-h-[70px]"
                        placeholder="What changed in this version and why"
                        data-testid="textarea-card-note"
                      />
                    </div>

                    {versions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={removeVersion}
                        data-testid="button-delete-version"
                      >
                        <IconTrash className="h-4 w-4 mr-1.5" />
                        Delete this version
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <IconCoin className="h-4 w-4 text-primary" />
                      Per-service exceptions
                      <Badge variant="secondary" className="ml-1 text-[10px]">{draft.serviceRates.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {draft.serviceRates.map(rate => (
                      <div key={rate.id} className="grid grid-cols-[1fr_120px_90px_32px] gap-2 items-center">
                        <Select
                          value={rate.service}
                          onValueChange={(v) =>
                            patch({
                              serviceRates: draft.serviceRates.map(r => (r.id === rate.id ? { ...r, service: v } : r)),
                            })
                          }
                        >
                          <SelectTrigger className="h-9 text-sm" data-testid={`select-service-${rate.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.services.map(service => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={rate.adjustmentType}
                          onValueChange={(v) =>
                            patch({
                              serviceRates: draft.serviceRates.map(r =>
                                r.id === rate.id ? { ...r, adjustmentType: v as AdjustmentType } : r
                              ),
                            })
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="markup">Markup</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
                          </SelectContent>
                        </Select>
                        <NumberField
                          value={rate.percent}
                          onChange={(percent) =>
                            patch({
                              serviceRates: draft.serviceRates.map(r =>
                                r.id === rate.id ? { ...r, percent } : r
                              ),
                            })
                          }
                          className="h-9 font-mono text-sm text-right"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            patch({ serviceRates: draft.serviceRates.filter(r => r.id !== rate.id) })
                          }
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {draft.serviceRates.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2">
                        No exceptions. Every service takes the headline rate.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        patch({
                          serviceRates: [
                            ...draft.serviceRates,
                            { id: uid('sr'), service: config.services[0], adjustmentType: 'markup', percent: 10 },
                          ],
                        })
                      }
                      data-testid="button-add-service-rate"
                    >
                      <IconPlus className="h-3.5 w-3.5 mr-1.5" />
                      Add service rate
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Managed service charges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Billed alongside AWS charges but shown separately on the statement.
                  </p>
                  {draft.managedServiceCharges.map(charge => (
                    <div key={charge.id} className="grid grid-cols-[1fr_200px_130px_32px] gap-2 items-center">
                      <Input
                        value={charge.label}
                        onChange={(e) =>
                          patch({
                            managedServiceCharges: draft.managedServiceCharges.map(c =>
                              c.id === charge.id ? { ...c, label: e.target.value } : c
                            ),
                          })
                        }
                        className="h-9 text-sm"
                        placeholder="Charge description"
                        data-testid={`input-managed-label-${charge.id}`}
                      />
                      <Select
                        value={charge.basis}
                        onValueChange={(v) =>
                          patch({
                            managedServiceCharges: draft.managedServiceCharges.map(c =>
                              c.id === charge.id ? { ...c, basis: v as ManagedChargeBasis } : c
                            ),
                          })
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(MANAGED_CHARGE_LABELS) as ManagedChargeBasis[]).map(basis => (
                            <SelectItem key={basis} value={basis}>{MANAGED_CHARGE_LABELS[basis]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <NumberField
                        value={charge.amount}
                        onChange={(amount) =>
                          patch({
                            managedServiceCharges: draft.managedServiceCharges.map(c =>
                              c.id === charge.id ? { ...c, amount } : c
                            ),
                          })
                        }
                        className="h-9 font-mono text-sm text-right"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          patch({
                            managedServiceCharges: draft.managedServiceCharges.filter(c => c.id !== charge.id),
                          })
                        }
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patch({
                        managedServiceCharges: [
                          ...draft.managedServiceCharges,
                          { id: uid('msc'), label: '', basis: 'fixed', amount: 0 },
                        ],
                      })
                    }
                    data-testid="button-add-managed-charge"
                  >
                    <IconPlus className="h-3.5 w-3.5 mr-1.5" />
                    Add charge
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IconVersions className="h-4 w-4 text-primary" />
                    Version history
                    <Badge variant="secondary" className="ml-1 text-[10px]">{versions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs font-semibold uppercase">Version</TableHead>
                          <TableHead className="text-xs font-semibold uppercase">Effective from</TableHead>
                          <TableHead className="text-xs font-semibold uppercase">Headline rate</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-right">Exceptions</TableHead>
                          <TableHead className="text-xs font-semibold uppercase">Agreed by</TableHead>
                          <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map(version => {
                          const status =
                            version.id === inForce?.id
                              ? 'In force'
                              : version.effectiveFrom > today
                                ? 'Scheduled'
                                : 'Superseded';
                          return (
                            <TableRow
                              key={version.id}
                              className={cn('cursor-pointer', version.id === viewing?.id && 'bg-muted/20')}
                              onClick={() => setViewingVersionId(version.id)}
                              data-testid={`row-version-${version.id}`}
                            >
                              <TableCell className="font-mono text-sm">v{version.version}</TableCell>
                              <TableCell className="font-mono text-sm">{version.effectiveFrom}</TableCell>
                              <TableCell className="text-sm">
                                {version.globalAdjustment.adjustmentType} {version.globalAdjustment.percent}%
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">{version.serviceRates.length}</TableCell>
                              <TableCell className="text-sm">{version.createdBy}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={status === 'In force' ? 'default' : 'secondary'}
                                  className="text-[11px]"
                                >
                                  {status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Select a row to view or edit that version. Previous versions are kept so a past statement can be
                    reproduced on the rates that were in force at the time.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6 mt-0">
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold">
                      AWS usage for {customer?.name}
                      <Badge variant="secondary" className="ml-2 text-[10px]">{usage.length} lines</Badge>
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={loadFromCostData} data-testid="button-load-usage">
                        <IconRefresh className="h-3.5 w-3.5 mr-1.5" />
                        Load from cost data
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} data-testid="button-import-usage">
                        <IconUpload className="h-3.5 w-3.5 mr-1.5" />
                        Import CSV
                      </Button>
                      <input
                        ref={fileInput}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) importCsv(file);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUsage(customerId, [
                            ...usage,
                            {
                              id: uid('usage'),
                              service: config.services[0],
                              region: customer?.primaryRegion ?? config.regions[0],
                              description: '',
                              quantity: 0,
                              unit: '',
                              baseCost: 0,
                            },
                          ])
                        }
                        data-testid="button-add-usage"
                      >
                        <IconPlus className="h-3.5 w-3.5 mr-1.5" />
                        Add line
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usage.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No usage loaded. Pull the current cost data, import a CSV, or add lines by hand.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CSV columns: service, region, description, quantity, unit, baseCost
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs font-semibold uppercase">Service</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Region</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Description</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-right">AWS base cost</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Agreed rate</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-right">Adjustment</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-right">Customer AWS charge</TableHead>
                            <TableHead className="w-8" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statement.usage.lines.map(line => (
                            <TableRow key={line.id} data-testid={`row-usage-${line.id}`}>
                              <TableCell>
                                <Select
                                  value={config.services.includes(line.service) ? line.service : ''}
                                  onValueChange={(v) => updateUsageLine(line.id, { service: v })}
                                >
                                  <SelectTrigger className="h-8 text-sm w-[140px]">
                                    <SelectValue placeholder={line.service || 'Service'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {config.services.map(service => (
                                      <SelectItem key={service} value={service}>{service}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="font-mono text-[12px] text-muted-foreground">{line.region}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                {line.description}
                              </TableCell>
                              <TableCell className="text-right">
                                <NumberField
                                  value={line.baseCost}
                                  onChange={(baseCost) => updateUsageLine(line.id, { baseCost })}
                                  className="h-8 w-[120px] ml-auto font-mono text-sm text-right"
                                  data-testid={`input-base-cost-${line.id}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">
                                    {line.adjustmentType === 'markup' ? '+' : '−'}{line.percent}%
                                  </span>
                                  {line.rateSource === 'global' && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1">global</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className={cn(
                                'text-right font-mono text-sm',
                                line.adjustmentAmount >= 0 ? 'text-muted-foreground' : 'text-emerald-500'
                              )}>
                                {formatCurrency(line.adjustmentAmount, currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">
                                {formatCurrency(line.customerCharge, currency)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setUsage(customerId, usage.filter(u => u.id !== line.id))}
                                >
                                  <IconTrash className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={3} className="text-sm font-semibold">Total</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(statement.usage.baseTotal, currency)}
                            </TableCell>
                            <TableCell />
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(statement.usage.adjustmentTotal, currency)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(statement.usage.chargeTotal, currency)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Rates come from version {draft.version}, effective {draft.effectiveFrom}. A service with its own
                    agreed rate uses that; everything else takes the headline rate.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statement" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'AWS base cost', value: statement.usage.baseTotal, tooltip: 'What AWS charges us for this customer.' },
                  { label: 'Customer AWS charge', value: statement.usage.chargeTotal, tooltip: 'AWS base cost with the agreed rate applied.' },
                  { label: 'Total customer charge', value: statement.total, tooltip: 'AWS charges plus managed service charges.', emphasis: true },
                ].map((tile, i) => (
                  <Tooltip key={tile.label} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.08 }}
                      >
                        <Card className={cn('bg-card/50 backdrop-blur-sm border-card-border', tile.emphasis && 'border-primary/40')}>
                          <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground mb-1">{tile.label}</p>
                            <p className={cn('text-2xl font-bold font-mono', tile.emphasis && 'text-primary')}>
                              {formatCompactCurrency(tile.value, currency)}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p className="text-xs">{tile.tooltip}</p></TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-semibold">Cost statement — {customer?.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Billing period {period} · rate card version {draft.version} effective {draft.effectiveFrom} ·{' '}
                        {customer?.accountCount} linked accounts
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportStatementCsv} data-testid="button-export-statement-csv">
                        <IconDownload className="h-3.5 w-3.5 mr-1.5" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportStatement} data-testid="button-export-statement">
                        <IconFileText className="h-3.5 w-3.5 mr-1.5" />
                        Statement
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">AWS charges</p>
                    <div className="rounded-xl border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs font-semibold uppercase">Service</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Region</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-right">AWS base cost</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Agreed rate</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-right">Customer AWS charge</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statement.usage.lines.map(line => (
                            <TableRow key={line.id}>
                              <TableCell className="text-sm">{line.service}</TableCell>
                              <TableCell className="font-mono text-[12px] text-muted-foreground">{line.region}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{formatCurrency(line.baseCost, currency)}</TableCell>
                              <TableCell className="text-sm">
                                {line.adjustmentType === 'markup' ? '+' : '−'}{line.percent}%
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">{formatCurrency(line.customerCharge, currency)}</TableCell>
                            </TableRow>
                          ))}
                          {statement.usage.lines.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                                No usage loaded for this period.
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={2} className="text-sm font-semibold">Subtotal, AWS charges</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(statement.usage.baseTotal, currency)}
                            </TableCell>
                            <TableCell />
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(statement.usage.chargeTotal, currency)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Managed service charges</p>
                    <div className="rounded-xl border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs font-semibold uppercase">Charge</TableHead>
                            <TableHead className="text-xs font-semibold uppercase">Basis</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statement.managedCharges.map(charge => (
                            <TableRow key={charge.id}>
                              <TableCell className="text-sm">{charge.label || 'Unnamed charge'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{charge.basisLabel}</TableCell>
                              <TableCell className="text-right font-mono text-sm">{formatCurrency(charge.computed, currency)}</TableCell>
                            </TableRow>
                          ))}
                          {statement.managedCharges.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                                No managed service charges on this rate card.
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={2} className="text-sm font-semibold">Subtotal, managed services</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(statement.managedTotal, currency)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                    <div className="space-y-2 max-w-md ml-auto">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">AWS charges at agreed rates</span>
                        <span className="font-mono">{formatCurrency(statement.usage.chargeTotal, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Managed service charges</span>
                        <span className="font-mono">{formatCurrency(statement.managedTotal, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-primary/30">
                        <span className="text-sm font-semibold">Total customer charge</span>
                        <span className="text-xl font-mono font-bold text-primary" data-testid="text-total-charge">
                          {formatCurrency(statement.total, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ScrollArea>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'customer';
}

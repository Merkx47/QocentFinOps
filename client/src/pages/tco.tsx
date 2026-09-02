import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useFinOpsStore, formatCurrency, formatCompactCurrency, convertCurrency } from '@/lib/finops-store';
import { useCustomers } from '@/lib/customers';
import { NewCustomerDialog } from '@/components/new-customer-dialog';
import { NumberField } from '@/components/number-field';
import { getProviderConfig } from '@/lib/provider-config';
import { downloadCsv } from '@/lib/csv-utils';
import { downloadMarkdown } from '@/lib/report-utils';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_AWS_CATEGORIES,
  DEFAULT_ONPREM_CATEGORIES,
  calculateTco,
  emptyAnalysis,
  getAnalysesForCustomer,
  uid,
  useTcoStore,
  type CostLine,
  type TcoAnalysis,
} from '@/lib/tco-store';
import {
  IconCalculator,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconDownload,
  IconFileText,
  IconServer,
  IconCloud,
  IconArrowRight,
  IconPigMoney,
  IconChartBar,
  IconPercentage,
} from '@tabler/icons-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

const CURRENT_COLOR = '#64748b';

function CostLineEditor({
  lines,
  onChange,
  accent,
  testPrefix,
  currency,
}: {
  lines: CostLine[];
  onChange: (lines: CostLine[]) => void;
  accent: string;
  testPrefix: string;
  currency: Parameters<typeof formatCurrency>[1];
}) {
  const update = (id: string, patch: Partial<CostLine>) =>
    onChange(lines.map(line => (line.id === id ? { ...line, ...patch } : line)));

  const total = lines.reduce((sum, line) => sum + line.monthlyCost, 0);

  return (
    <div className="space-y-2">
      {lines.map(line => (
        <div key={line.id} className="grid grid-cols-[1fr_120px_32px] gap-2 items-start">
          <div className="space-y-1 min-w-0">
            <Input
              value={line.label}
              onChange={(e) => update(line.id, { label: e.target.value })}
              className="h-9 text-sm"
              placeholder="Cost category"
              data-testid={`${testPrefix}-label-${line.id}`}
            />
            <Input
              value={line.note ?? ''}
              onChange={(e) => update(line.id, { note: e.target.value })}
              className="h-7 text-xs text-muted-foreground"
              placeholder="Basis for this figure (optional)"
              data-testid={`${testPrefix}-note-${line.id}`}
            />
          </div>
          <NumberField
            value={line.monthlyCost}
            onChange={(monthlyCost) => update(line.id, { monthlyCost })}
            blankWhenZero
            className="h-9 text-sm font-mono text-right"
            placeholder="0"
            data-testid={`${testPrefix}-amount-${line.id}`}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(lines.filter(l => l.id !== line.id))}
            data-testid={`${testPrefix}-remove-${line.id}`}
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...lines, { id: uid(testPrefix), label: '', monthlyCost: 0 }])}
          data-testid={`${testPrefix}-add`}
        >
          <IconPlus className="h-3.5 w-3.5 mr-1.5" />
          Add cost
        </Button>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground">Monthly total</p>
          <p className="text-sm font-mono font-semibold" style={{ color: accent }}>
            {formatCurrency(total, currency)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Tco() {
  const { currency, selectedProvider, selectedCustomerId, user } = useFinOpsStore();
  const { analyses, saveAnalysis, deleteAnalysis } = useTcoStore();
  const { toast } = useToast();

  const config = getProviderConfig(selectedProvider);
  const customers = useCustomers(selectedProvider);
  const scoped = useMemo(
    () => getAnalysesForCustomer(analyses, selectedCustomerId),
    [analyses, selectedCustomerId]
  );

  const [selectedId, setSelectedId] = useState<string | null>(scoped[0]?.id ?? null);
  const [draft, setDraft] = useState<TcoAnalysis | null>(scoped[0] ?? null);

  // Follow the header customer filter without discarding an analysis being edited.
  useEffect(() => {
    if (selectedId && scoped.some(a => a.id === selectedId)) return;
    const next = scoped[0] ?? null;
    setSelectedId(next?.id ?? null);
    setDraft(next ? { ...next } : null);
  }, [scoped, selectedId]);

  const stored = draft ? analyses.find(a => a.id === draft.id) : undefined;
  const isDirty = draft ? JSON.stringify(stored) !== JSON.stringify(draft) : false;

  const result = useMemo(() => (draft ? calculateTco(draft) : null), [draft]);

  const selectAnalysis = (id: string) => {
    const found = analyses.find(a => a.id === id);
    if (!found) return;
    setSelectedId(id);
    setDraft({ ...found });
  };

  const createAnalysis = () => {
    const customerId = selectedCustomerId !== 'all' ? selectedCustomerId : customers[0]?.id;
    if (!customerId) return;
    const fresh = emptyAnalysis(customerId, user?.name ?? 'Cloud Platform Team');
    saveAnalysis(fresh);
    setSelectedId(fresh.id);
    setDraft(fresh);
    toast({ title: 'Analysis created', description: 'Fill in the current and proposed costs to see the comparison.' });
  };

  const save = () => {
    if (!draft) return;
    const saved = { ...draft, updatedAt: new Date().toISOString() };
    saveAnalysis(saved);
    setDraft(saved);
    toast({ title: 'Analysis saved', description: `"${saved.name}" has been saved.` });
  };

  const remove = () => {
    if (!draft) return;
    deleteAnalysis(draft.id);
    const remaining = scoped.filter(a => a.id !== draft.id);
    setSelectedId(remaining[0]?.id ?? null);
    setDraft(remaining[0] ? { ...remaining[0] } : null);
    toast({ title: 'Analysis deleted' });
  };

  const patch = (changes: Partial<TcoAnalysis>) => setDraft(current => (current ? { ...current, ...changes } : current));
  const patchAssumptions = (changes: Partial<TcoAnalysis['assumptions']>) =>
    setDraft(current => (current ? { ...current, assumptions: { ...current.assumptions, ...changes } } : current));

  const customerName = (id: string) => customers.find(c => c.id === id)?.name ?? id;

  const exportCsv = () => {
    if (!draft || !result) return;
    // Exported figures follow the currency shown on screen, so the two agree.
    const amount = (value: number) => round(convertCurrency(value, currency));
    const rows: (string | number)[][] = [
      ['Section', 'Item', 'Basis', `Monthly (${currency})`],
      ...draft.onPremise.map(l => ['Current estate', l.label, l.note ?? '', amount(l.monthlyCost)]),
      ...draft.aws.map(l => ['Proposed AWS', l.label, l.note ?? '', amount(l.monthlyCost)]),
      ['Totals', 'Current estate monthly', '', amount(result.onPremMonthly)],
      ['Totals', 'AWS monthly before commitments', '', amount(result.awsMonthly)],
      ['Totals', 'AWS monthly after commitments', `${result.commitmentDiscountPercent}% coverage`, amount(result.awsMonthlyEffective)],
      ['Totals', 'Monthly saving', '', amount(result.monthlySavings)],
      ['Totals', 'Annual saving', '', amount(result.annualSavings)],
      ['Totals', `${result.termYears} year current estate`, '', amount(result.onPremTerm)],
      ['Totals', `${result.termYears} year AWS including migration`, '', amount(result.awsTerm)],
      ['Totals', `${result.termYears} year saving`, `${result.savingsPercent.toFixed(1)}%`, amount(result.termSavings)],
      ...result.years.map(y => [`Year ${y.year}`, 'Current estate', '', amount(y.onPremCost)]),
      ...result.years.map(y => [`Year ${y.year}`, 'AWS', '', amount(y.awsCost)]),
      ['Assumption', 'Term (years)', '', result.termYears],
      ['Assumption', 'Current estate growth', '', `${result.onPremGrowthPercent}%`],
      ['Assumption', 'AWS growth', '', `${result.awsGrowthPercent}%`],
      ['Assumption', 'Commitment discount', '', `${result.commitmentDiscountPercent}%`],
      ['Assumption', 'One-off migration cost', '', amount(result.migrationCost)],
      ['Assumption', 'Notes', '', draft.assumptions.notes],
    ];
    downloadCsv(`tco-${draft.name.toLowerCase().replace(/\s+/g, '-')}.csv`, rows[0].map(String), rows.slice(1));
    toast({ title: 'Exported', description: 'TCO analysis written to CSV.' });
  };

  const exportReport = () => {
    if (!draft || !result) return;
    const money = (value: number) => formatCurrency(value, currency);
    const lines = [
      `# TCO analysis — ${draft.name}`,
      '',
      `Customer: ${customerName(draft.customerId)}`,
      `Prepared by: ${draft.preparedBy}`,
      `Status: ${draft.status === 'final' ? 'Final' : 'Draft'}`,
      `Last updated: ${new Date(draft.updatedAt).toISOString()}`,
      `Term: ${result.termYears} years. All figures in ${currency}.`,
      '',
      '## Headline',
      '',
      `| Basis | Current estate | Proposed AWS | Saving |`,
      `| --- | --- | --- | --- |`,
      `| Monthly | ${money(result.onPremMonthly)} | ${money(result.awsMonthlyEffective)} | ${money(result.monthlySavings)} |`,
      `| Annual | ${money(result.onPremAnnual)} | ${money(result.awsAnnual)} | ${money(result.annualSavings)} |`,
      `| ${result.termYears} year | ${money(result.onPremTerm)} | ${money(result.awsTerm)} | ${money(result.termSavings)} |`,
      '',
      result.onPremTerm > 0
        ? `Saving over the term is ${result.savingsPercent.toFixed(1)}% of the current estate cost.`
        : 'No current estate cost was entered, so a percentage saving cannot be stated.',
      result.migrationCost === 0
        ? 'No one-off migration cost was included in this analysis.'
        : result.breakEvenMonths !== null
          ? `The one-off migration cost of ${money(result.migrationCost)} is recovered in ${result.breakEvenMonths} month${result.breakEvenMonths === 1 ? '' : 's'} on the month one saving.`
          : `The one-off migration cost of ${money(result.migrationCost)} is never recovered: the proposed AWS environment does not cost less per month than the current estate.`,
      '',
      '## Current environment',
      '',
      draft.currentEnvironment || 'Not described.',
      '',
      '| Cost category | Basis | Monthly |',
      '| --- | --- | --- |',
      ...draft.onPremise.map(l => `| ${l.label} | ${l.note ?? ''} | ${money(l.monthlyCost)} |`),
      `| **Total** | | **${money(result.onPremMonthly)}** |`,
      '',
      '## Proposed AWS environment',
      '',
      draft.proposedEnvironment || 'Not described.',
      '',
      '| Cost category | Basis | Monthly |',
      '| --- | --- | --- |',
      ...draft.aws.map(l => `| ${l.label} | ${l.note ?? ''} | ${money(l.monthlyCost)} |`),
      `| **Total before commitments** | | **${money(result.awsMonthly)}** |`,
      `| **Total after commitments** | ${result.commitmentDiscountPercent}% coverage | **${money(result.awsMonthlyEffective)}** |`,
      '',
      '## Year by year',
      '',
      '| Year | Current estate | AWS | Saving | Cumulative saving |',
      '| --- | --- | --- | --- | --- |',
      ...result.years.map(
        y => `| ${y.year} | ${money(y.onPremCost)} | ${money(y.awsCost)} | ${money(y.savings)} | ${money(y.cumulativeSavings)} |`
      ),
      '',
      '## Assumptions',
      '',
      `- Term: ${result.termYears} years`,
      `- Current estate growth: ${result.onPremGrowthPercent}% per year`,
      `- AWS growth: ${result.awsGrowthPercent}% per year`,
      `- Commitment discount applied to the AWS run rate: ${result.commitmentDiscountPercent}%`,
      `- One-off migration cost, charged in year one: ${money(result.migrationCost)}`,
      '',
      draft.assumptions.notes || 'No further notes.',
      '',
    ];
    downloadMarkdown(`tco-${draft.name.toLowerCase().replace(/\s+/g, '-')}.md`, lines.join('\n'));
    toast({ title: 'Report ready', description: 'TCO report written to Markdown.' });
  };

  if (customers.length === 0) {
    return (
      <div className="p-6">
        <Card className="bg-card/50 border-card-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            TCO analysis is available in the AWS portal.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto space-y-6" data-testid="tco-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">TCO Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Compare what a customer spends running their estate today against the proposed AWS
              environment, over a term you set. Costs are entered as monthly figures in USD.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NewCustomerDialog />
            <Button variant="outline" onClick={createAnalysis} data-testid="button-new-analysis">
              <IconPlus className="h-4 w-4 mr-2" />
              New analysis
            </Button>
            {draft && (
              <>
                <Button variant="outline" onClick={exportCsv} data-testid="button-export-tco-csv">
                  <IconDownload className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" onClick={exportReport} data-testid="button-export-tco-report">
                  <IconFileText className="h-4 w-4 mr-2" />
                  Report
                </Button>
                <Button onClick={save} disabled={!isDirty} data-testid="button-save-analysis">
                  <IconDeviceFloppy className="h-4 w-4 mr-2" />
                  {isDirty ? 'Save changes' : 'Saved'}
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {scoped.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardContent className="py-3 flex flex-wrap items-center gap-3">
              <Label className="text-xs text-muted-foreground">Analysis</Label>
              <Select value={selectedId ?? ''} onValueChange={selectAnalysis}>
                <SelectTrigger className="w-[340px] h-9 text-sm" data-testid="select-analysis">
                  <SelectValue placeholder="Select an analysis" />
                </SelectTrigger>
                <SelectContent>
                  {scoped.map(analysis => (
                    <SelectItem key={analysis.id} value={analysis.id}>
                      <div className="flex items-center gap-2">
                        <span>{analysis.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customerName(analysis.customerId)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {draft && (
                <>
                  <Badge variant={draft.status === 'final' ? 'default' : 'secondary'} className="text-[11px]">
                    {draft.status === 'final' ? 'Final' : 'Draft'}
                  </Badge>
                  {isDirty && (
                    <Badge variant="outline" className="text-[11px] text-amber-500 border-amber-500/40">
                      Unsaved changes
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    onClick={remove}
                    data-testid="button-delete-analysis"
                  >
                    <IconTrash className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {!draft && (
          <Card className="bg-card/50 border-card-border">
            <CardContent className="py-12 text-center space-y-3">
              <IconCalculator className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No analysis yet for this selection. Create one to get started.
              </p>
              <Button onClick={createAnalysis}>
                <IconPlus className="h-4 w-4 mr-2" />
                New analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {draft && result && (
          <div className="grid grid-cols-1 xl:grid-cols-[440px_1fr] gap-6 items-start">
            <div className="space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Analysis details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      className="h-9"
                      data-testid="input-analysis-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Customer</Label>
                      <Select value={draft.customerId} onValueChange={(v) => patch({ customerId: v })}>
                        <SelectTrigger className="h-9 text-sm" data-testid="select-analysis-customer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={draft.status}
                        onValueChange={(v) => patch({ status: v as TcoAnalysis['status'] })}
                      >
                        <SelectTrigger className="h-9 text-sm" data-testid="select-analysis-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Current environment</Label>
                    <Textarea
                      value={draft.currentEnvironment}
                      onChange={(e) => patch({ currentEnvironment: e.target.value })}
                      className="text-sm min-h-[72px]"
                      placeholder="What the customer runs today"
                      data-testid="textarea-current-environment"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Proposed AWS environment</Label>
                    <Textarea
                      value={draft.proposedEnvironment}
                      onChange={(e) => patch({ proposedEnvironment: e.target.value })}
                      className="text-sm min-h-[72px]"
                      placeholder="Target architecture on AWS"
                      data-testid="textarea-proposed-environment"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IconServer className="h-4 w-4" style={{ color: CURRENT_COLOR }} />
                    Current monthly costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CostLineEditor
                    lines={draft.onPremise}
                    onChange={(onPremise) => patch({ onPremise })}
                    accent={CURRENT_COLOR}
                    testPrefix="onprem"
                    currency={currency}
                  />
                  {draft.onPremise.length === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        patch({
                          onPremise: DEFAULT_ONPREM_CATEGORIES.map(label => ({
                            id: uid('onprem'), label, monthlyCost: 0,
                          })),
                        })
                      }
                    >
                      Restore standard categories
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IconCloud className="h-4 w-4" style={{ color: config.colors.chartPrimary }} />
                    Proposed AWS monthly costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CostLineEditor
                    lines={draft.aws}
                    onChange={(aws) => patch({ aws })}
                    accent={config.colors.chartPrimary}
                    testPrefix="aws"
                    currency={currency}
                  />
                  {draft.aws.length === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        patch({
                          aws: DEFAULT_AWS_CATEGORIES.map(label => ({
                            id: uid('aws'), label, monthlyCost: 0,
                          })),
                        })
                      }
                    >
                      Restore standard categories
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Assumptions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Term (years)', key: 'termYears' as const, suffix: '' },
                      { label: 'Current growth %/yr', key: 'onPremGrowthPercent' as const, suffix: '%' },
                      { label: 'AWS growth %/yr', key: 'awsGrowthPercent' as const, suffix: '%' },
                      { label: 'Commitment discount %', key: 'commitmentDiscountPercent' as const, suffix: '%' },
                    ].map(field => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="text-xs">{field.label}</Label>
                        <NumberField
                          value={draft.assumptions[field.key]}
                          onChange={(value) => patchAssumptions({ [field.key]: value } as any)}
                          className="h-9 font-mono text-sm"
                          data-testid={`input-${field.key}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">One-off migration cost (USD)</Label>
                    <NumberField
                      value={draft.assumptions.migrationCost}
                      onChange={(value) => patchAssumptions({ migrationCost: Math.max(0, value) })}
                      blankWhenZero
                      className="h-9 font-mono text-sm"
                      placeholder="0"
                      data-testid="input-migration-cost"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes</Label>
                    <Textarea
                      value={draft.assumptions.notes}
                      onChange={(e) => patchAssumptions({ notes: e.target.value })}
                      className="text-sm min-h-[90px]"
                      placeholder="What these figures are based on"
                      data-testid="textarea-assumption-notes"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 [&>*]:min-w-0">
                {[
                  {
                    label: 'Monthly saving',
                    value: formatCompactCurrency(result.monthlySavings, currency),
                    icon: IconPigMoney,
                    color: result.monthlySavings >= 0 ? 'text-emerald-500' : 'text-red-500',
                    tooltip: 'Current monthly cost less the AWS monthly cost after commitment discounts.',
                  },
                  {
                    label: 'Annual saving',
                    value: formatCompactCurrency(result.annualSavings, currency),
                    icon: IconChartBar,
                    color: result.annualSavings >= 0 ? 'text-emerald-500' : 'text-red-500',
                    tooltip: 'Monthly saving over twelve months, before growth is applied.',
                  },
                  {
                    label: `${result.termYears} year saving`,
                    value: formatCompactCurrency(result.termSavings, currency),
                    icon: IconCalculator,
                    color: result.termSavings >= 0 ? 'text-emerald-500' : 'text-red-500',
                    tooltip: 'Across the full term, with growth applied to both sides and the migration cost charged to AWS.',
                  },
                  {
                    label: 'Saving on current spend',
                    value: result.onPremTerm > 0 ? `${result.savingsPercent.toFixed(1)}%` : '—',
                    icon: IconPercentage,
                    color: 'text-primary',
                    tooltip: result.onPremTerm > 0
                      ? `The term saving as a share of what the current estate would cost over ${result.termYears} years. ${
                          result.migrationCost === 0
                            ? 'No migration cost was included.'
                            : result.breakEvenMonths !== null
                              ? `The migration cost is recovered in ${result.breakEvenMonths} month${result.breakEvenMonths === 1 ? '' : 's'}.`
                              : 'AWS does not cost less per month on these figures, so the migration cost is never recovered.'
                        }`
                      : 'Enter the current estate costs to see a percentage.',
                  },
                ].map((stat, i) => (
                  <Tooltip key={stat.label} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.08 }}
                      >
                        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground mb-1 truncate">{stat.label}</p>
                                <p className={cn('text-2xl font-bold font-mono', stat.color)}>{stat.value}</p>
                              </div>
                              <div className="p-2.5 rounded-xl bg-primary/10">
                                <stat.icon className="h-6 w-6 text-primary" />
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

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Current estate against proposed AWS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-xs font-semibold uppercase">Basis</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-right">Current estate</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-right">Proposed AWS</TableHead>
                          <TableHead className="text-xs font-semibold uppercase text-right">Saving</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { basis: 'Monthly', current: result.onPremMonthly, aws: result.awsMonthlyEffective, saving: result.monthlySavings },
                          { basis: 'Annual', current: result.onPremAnnual, aws: result.awsAnnual, saving: result.annualSavings },
                          {
                            basis: `${result.termYears} year term`,
                            current: result.onPremTerm,
                            aws: result.awsTerm,
                            saving: result.termSavings,
                            emphasis: true,
                          },
                        ].map(row => (
                          <TableRow key={row.basis} className={cn(row.emphasis && 'bg-muted/20')}>
                            <TableCell className={cn('text-sm', row.emphasis && 'font-semibold')}>{row.basis}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.current, currency)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(row.aws, currency)}</TableCell>
                            <TableCell className={cn(
                              'text-right font-mono text-sm font-semibold',
                              row.saving >= 0 ? 'text-emerald-500' : 'text-red-500'
                            )}>
                              {formatCurrency(row.saving, currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    The AWS monthly figure is {formatCurrency(result.awsMonthly, currency)} before a{' '}
                    {result.commitmentDiscountPercent}% commitment discount.{' '}
                    {result.migrationCost > 0
                      ? `The term column charges the one-off migration cost of ${formatCurrency(result.migrationCost, currency)} to year one.`
                      : 'No one-off migration cost was included.'}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Cost by year</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={result.years} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="year"
                          tickFormatter={(y) => `Yr ${y}`}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                        />
                        <YAxis
                          tickFormatter={(v) => formatCompactCurrency(v, currency)}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          width={70}
                        />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
                          labelFormatter={(y) => `Year ${y}`}
                          contentStyle={{
                            background: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.75rem',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="onPremCost" name="Current estate" fill={CURRENT_COLOR} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="awsCost" name="Proposed AWS" fill={config.colors.chartPrimary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Cumulative saving</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={result.years} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="year"
                          tickFormatter={(y) => `Yr ${y}`}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                        />
                        <YAxis
                          tickFormatter={(v) => formatCompactCurrency(v, currency)}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          width={70}
                        />
                        <RechartsTooltip
                          formatter={(value: number) => formatCurrency(value, currency)}
                          labelFormatter={(y) => `Year ${y}`}
                          contentStyle={{
                            background: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '0.75rem',
                            fontSize: '12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulativeSavings"
                          name="Cumulative saving"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Cost categories</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { title: 'Current estate', lines: draft.onPremise, total: result.onPremMonthly, color: CURRENT_COLOR },
                    { title: 'Proposed AWS', lines: draft.aws, total: result.awsMonthly, color: config.colors.chartPrimary },
                  ].map(side => (
                    <div key={side.title} className="rounded-xl border border-border overflow-hidden">
                      <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: side.color }}>{side.title}</span>
                        <span className="text-xs text-muted-foreground">Monthly</span>
                      </div>
                      <Table>
                        <TableBody>
                          {side.lines.map(line => (
                            <TableRow key={line.id}>
                              <TableCell className="text-sm">
                                <div className="min-w-0">
                                  <p className="truncate">{line.label || 'Unnamed'}</p>
                                  {line.note && <p className="text-[11px] text-muted-foreground truncate">{line.note}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm w-[130px]">
                                {formatCurrency(line.monthlyCost, currency)}
                              </TableCell>
                              <TableCell className="text-right text-[11px] text-muted-foreground w-[60px]">
                                {side.total > 0 ? `${((line.monthlyCost / side.total) * 100).toFixed(0)}%` : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/20">
                            <TableCell className="text-sm font-semibold">Total</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {formatCurrency(side.total, currency)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Assumptions used in this calculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    {[
                      { label: 'Term', value: `${result.termYears} years` },
                      { label: 'Current growth', value: `${result.onPremGrowthPercent}% per year` },
                      { label: 'AWS growth', value: `${result.awsGrowthPercent}% per year` },
                      { label: 'Commitment discount', value: `${result.commitmentDiscountPercent}%` },
                      { label: 'Migration cost', value: formatCurrency(draft.assumptions.migrationCost, currency) },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-lg border border-border bg-background/50">
                        <p className="text-[11px] text-muted-foreground mb-0.5">{item.label}</p>
                        <p className="text-sm font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {draft.assumptions.notes || 'No further notes recorded for this analysis.'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <IconArrowRight className="h-3.5 w-3.5" />
                    Prepared by {draft.preparedBy} · last updated{' '}
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

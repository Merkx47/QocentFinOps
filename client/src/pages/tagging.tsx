import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinOpsStore, formatCurrency } from '@/lib/finops-store';
import { generateTagCompliance } from '@/lib/finops-data';
import { getProviderConfig } from '@/lib/provider-config';
import { useTableControls } from '@/hooks/use-table-controls';
import { TablePagination } from '@/components/ui/table-pagination';
import { useMemo, useState, useRef, KeyboardEvent } from 'react';
import {
  IconTag,
  IconTags,
  IconShieldCheck,
  IconAlertTriangle,
  IconCircleCheck,
  IconPlus,
  IconTrash,
  IconEdit,
  IconCopy,
  IconX,
  IconCheck,
  IconLayersLinked,
  IconSearch,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Tag Group Types ──────────────────────────────────────────────────────────

type ValueType = 'string' | 'int' | 'float' | 'bool' | 'date' | 'json' | 'list' | 'enum';

interface TagKey {
  id: string;
  key: string;
  valueType: ValueType;
  required: boolean;
  allowedValues: string; // comma-separated for enum/list, example value for others
  description: string;
}

interface TagGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  tags: TagKey[];
  appliedTo: number; // resource count
  createdAt: string;
}

const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  string: 'String',
  int: 'Integer',
  float: 'Float',
  bool: 'Boolean',
  date: 'Date',
  json: 'JSON',
  list: 'List',
  enum: 'Enum (allowed values)',
};

const VALUE_TYPE_HINT: Record<ValueType, string> = {
  string: 'Any text value',
  int: 'Whole numbers only (e.g. 42)',
  float: 'Decimal numbers (e.g. 3.14)',
  bool: 'Accepts: true or false',
  date: 'Format: YYYY-MM-DD',
  json: 'Define expected JSON shape as key → value pairs',
  list: 'Add accepted values below',
  enum: 'Exactly one of the values below must be used',
};

// ─── Chip Input ───────────────────────────────────────────────────────────────

function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, '');
    if (!trimmed || values.includes(trimmed)) { setInput(''); return; }
    onChange([...values, trimmed]);
    setInput('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip(input); }
    if (e.key === 'Backspace' && !input && values.length) onChange(values.slice(0, -1));
  };

  return (
    <div
      className="min-h-[38px] flex flex-wrap gap-1.5 p-2 rounded-lg border border-input bg-background cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map(v => (
        <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
          {v}
          <button type="button" onClick={e => { e.stopPropagation(); onChange(values.filter(x => x !== v)); }} className="hover:text-red-500 transition-colors">
            <IconX className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => input.trim() && addChip(input)}
        placeholder={values.length === 0 ? (placeholder ?? 'Type and press Enter…') : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ─── JSON Key-Value Editor ────────────────────────────────────────────────────

interface KVRow { id: string; key: string; value: string; }

function JsonKVEditor({
  rows,
  onChange,
}: {
  rows: KVRow[];
  onChange: (rows: KVRow[]) => void;
}) {
  const addRow = () => onChange([...rows, { id: `kv-${Date.now()}`, key: '', value: '' }]);
  const updateRow = (id: string, field: 'key' | 'value', val: string) =>
    onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  const removeRow = (id: string) => onChange(rows.filter(r => r.id !== id));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
        <span>Key</span><span>Value</span><span />
      </div>
      {rows.map(row => (
        <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <Input
            value={row.key}
            onChange={e => updateRow(row.id, 'key', e.target.value)}
            placeholder="key"
            className="h-8 text-xs bg-background border-input font-mono"
          />
          <Input
            value={row.value}
            onChange={e => updateRow(row.id, 'value', e.target.value)}
            placeholder="value"
            className="h-8 text-xs bg-background border-input"
          />
          <button type="button" onClick={() => removeRow(row.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-7 text-xs gap-1 w-full border-dashed">
        <IconPlus className="h-3 w-3" /> Add Field
      </Button>
    </div>
  );
}

const GROUP_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const INITIAL_GROUPS: TagGroup[] = [
  {
    id: 'tg-1',
    name: 'Cost Allocation',
    description: 'Required for chargeback and cost reporting',
    color: '#6366f1',
    appliedTo: 412,
    createdAt: '2025-01-15',
    tags: [
      { id: 'tk-1', key: 'CostCenter', valueType: 'string', required: true, allowedValues: '', description: 'Business unit cost center code' },
      { id: 'tk-2', key: 'Project', valueType: 'string', required: true, allowedValues: '', description: 'Project name or ID' },
      { id: 'tk-3', key: 'Environment', valueType: 'enum', required: true, allowedValues: 'prod,staging,dev,test', description: 'Deployment environment' },
      { id: 'tk-4', key: 'BudgetYear', valueType: 'int', required: false, allowedValues: '', description: 'Fiscal year for budget tracking' },
    ],
  },
  {
    id: 'tg-2',
    name: 'Ownership',
    description: 'Identifies who owns and maintains a resource',
    color: '#10b981',
    appliedTo: 389,
    createdAt: '2025-01-20',
    tags: [
      { id: 'tk-5', key: 'Owner', valueType: 'string', required: true, allowedValues: '', description: 'Email of resource owner' },
      { id: 'tk-6', key: 'Team', valueType: 'enum', required: true, allowedValues: 'platform,data,security,backend,frontend', description: 'Responsible team' },
      { id: 'tk-7', key: 'OnCallRotation', valueType: 'string', required: false, allowedValues: '', description: 'PagerDuty rotation ID' },
    ],
  },
  {
    id: 'tg-3',
    name: 'Lifecycle',
    description: 'Resource lifecycle and retention policies',
    color: '#f59e0b',
    appliedTo: 201,
    createdAt: '2025-02-01',
    tags: [
      { id: 'tk-8', key: 'ExpirationDate', valueType: 'date', required: false, allowedValues: '', description: 'When to decommission' },
      { id: 'tk-9', key: 'Temporary', valueType: 'bool', required: false, allowedValues: '', description: 'Whether resource is ephemeral' },
      { id: 'tk-10', key: 'RetentionDays', valueType: 'int', required: false, allowedValues: '', description: 'Data retention period in days' },
    ],
  },
];

function newTagKey(): TagKey {
  return {
    id: `tk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: '',
    valueType: 'string',
    required: true,
    allowedValues: '',
    description: '',
  };
}

function newGroup(): Omit<TagGroup, 'id' | 'createdAt' | 'appliedTo'> {
  return {
    name: '',
    description: '',
    color: GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)],
    tags: [newTagKey()],
  };
}

// ─── Tag Group Dialog ─────────────────────────────────────────────────────────

function parseChips(csv: string) { return csv.split(',').map(s => s.trim()).filter(Boolean); }
function parseJsonRows(raw: string): KVRow[] {
  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch {}
  return [];
}
function serializeJsonRows(rows: KVRow[]): string {
  return JSON.stringify(rows.map(({ key, value }) => ({ key, value })));
}

function TagGroupDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (group: Omit<TagGroup, 'id' | 'createdAt' | 'appliedTo'>) => void;
  initial?: TagGroup | null;
}) {
  const [form, setForm] = useState<Omit<TagGroup, 'id' | 'createdAt' | 'appliedTo'>>(
    initial
      ? { name: initial.name, description: initial.description, color: initial.color, tags: initial.tags.map(t => ({ ...t })) }
      : newGroup()
  );

  const updateTag = (id: string, field: keyof TagKey, value: string | boolean) =>
    setForm(f => ({ ...f, tags: f.tags.map(t => t.id === id ? { ...t, [field]: value } : t) }));

  const updateTagType = (id: string, valueType: ValueType) =>
    setForm(f => ({ ...f, tags: f.tags.map(t => t.id === id ? { ...t, valueType, allowedValues: '' } : t) }));

  const addTag = () => setForm(f => ({ ...f, tags: [...f.tags, newTagKey()] }));
  const removeTag = (id: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t.id !== id) }));

  const handleSave = () => {
    if (!form.name.trim() || form.tags.some(t => !t.key.trim())) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconLayersLinked className="h-5 w-5 text-primary" />
            {initial ? 'Edit Tag Group' : 'Create Tag Group'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name + Color */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Group Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Cost Allocation"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {GROUP_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn('w-6 h-6 rounded-full border-2 transition-all', form.color === c ? 'border-foreground scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this group used for?" />
          </div>

          {/* Tag Keys */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Tag Keys *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-7 text-xs gap-1">
                <IconPlus className="h-3 w-3" /> Add Key
              </Button>
            </div>

            <div className="space-y-3">
              {form.tags.map((tag, i) => (
                <div key={tag.id} className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
                  {/* Row header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">KEY {i + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                        <input type="checkbox" checked={tag.required} onChange={e => updateTag(tag.id, 'required', e.target.checked)} className="rounded" />
                        Required
                      </label>
                      {form.tags.length > 1 && (
                        <button type="button" onClick={() => removeTag(tag.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <IconX className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Key name + type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Key Name</Label>
                      <Input value={tag.key} onChange={e => updateTag(tag.id, 'key', e.target.value)} placeholder="e.g. Environment" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Value Type</Label>
                      <Select value={tag.valueType} onValueChange={v => updateTagType(tag.id, v as ValueType)}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.entries(VALUE_TYPE_LABELS) as [ValueType, string][]).map(([v, label]) => (
                            <SelectItem key={v} value={v}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Type hint */}
                  <p className="text-[10px] text-muted-foreground italic">{VALUE_TYPE_HINT[tag.valueType]}</p>

                  {/* enum / list → chip input */}
                  {(tag.valueType === 'enum' || tag.valueType === 'list') && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        {tag.valueType === 'enum' ? 'Allowed Values' : 'Example Values'} — type a value and press Enter
                      </Label>
                      <ChipInput
                        values={parseChips(tag.allowedValues)}
                        onChange={chips => updateTag(tag.id, 'allowedValues', chips.join(','))}
                        placeholder={tag.valueType === 'enum' ? 'prod, staging, dev…' : 'value1, value2…'}
                      />
                    </div>
                  )}

                  {/* json → key-value table */}
                  {tag.valueType === 'json' && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">JSON Shape — define expected keys and example values</Label>
                      <JsonKVEditor
                        rows={parseJsonRows(tag.allowedValues).length > 0 ? parseJsonRows(tag.allowedValues).map((r, ri) => ({ id: `r-${ri}`, ...r })) : [{ id: `r-0`, key: '', value: '' }]}
                        onChange={rows => updateTag(tag.id, 'allowedValues', serializeJsonRows(rows))}
                      />
                      {/* Live preview */}
                      {tag.allowedValues && parseJsonRows(tag.allowedValues).some(r => r.key) && (
                        <div className="mt-2 rounded-lg bg-muted/40 border border-border p-2">
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Preview</p>
                          <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap">
                            {JSON.stringify(Object.fromEntries(parseJsonRows(tag.allowedValues).filter(r => r.key).map(r => [r.key, r.value || '<value>'])), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* bool → informational */}
                  {tag.valueType === 'bool' && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                      <IconCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      Accepts <code className="font-mono text-foreground mx-1">true</code> or <code className="font-mono text-foreground mx-1">false</code> only.
                    </div>
                  )}

                  {/* string / int / float / date → example value */}
                  {['string', 'int', 'float', 'date'].includes(tag.valueType) && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Example / Default Value (optional)</Label>
                      <Input
                        value={tag.allowedValues}
                        onChange={e => updateTag(tag.id, 'allowedValues', e.target.value)}
                        placeholder={tag.valueType === 'date' ? '2025-12-31' : tag.valueType === 'int' ? '42' : tag.valueType === 'float' ? '3.14' : 'my-value'}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Description (optional)</Label>
                    <Input value={tag.description} onChange={e => updateTag(tag.id, 'description', e.target.value)} placeholder="What does this tag represent?" className="h-8 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || form.tags.some(t => !t.key.trim())}>
            <IconCheck className="h-4 w-4 mr-1.5" />
            {initial ? 'Save Changes' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Tagging() {
  const { selectedProvider, selectedOrgUnitId, currency } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);
  const { toast } = useToast();

  const data = useMemo(
    () => generateTagCompliance(selectedOrgUnitId, selectedProvider),
    [selectedOrgUnitId, selectedProvider]
  );

  const [groups, setGroups] = useState<TagGroup[]>(INITIAL_GROUPS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TagGroup | null>(null);

  const openCreate = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit = (g: TagGroup) => { setEditTarget(g); setDialogOpen(true); };

  const handleSave = (form: Omit<TagGroup, 'id' | 'createdAt' | 'appliedTo'>) => {
    if (editTarget) {
      setGroups(gs => gs.map(g => g.id === editTarget.id ? { ...g, ...form } : g));
      toast({ title: 'Tag group updated', description: `"${form.name}" has been saved.` });
    } else {
      const newG: TagGroup = {
        ...form,
        id: `tg-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        appliedTo: 0,
      };
      setGroups(gs => [...gs, newG]);
      toast({ title: 'Tag group created', description: `"${form.name}" is ready to apply to resources.` });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const g = groups.find(g => g.id === id);
    setGroups(gs => gs.filter(g => g.id !== id));
    toast({ title: 'Tag group deleted', description: `"${g?.name}" has been removed.` });
  };

  const handleDuplicate = (g: TagGroup) => {
    const copy: TagGroup = {
      ...g,
      id: `tg-${Date.now()}`,
      name: `${g.name} (copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      appliedTo: 0,
      tags: g.tags.map(t => ({ ...t, id: `tk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })),
    };
    setGroups(gs => [...gs, copy]);
    toast({ title: 'Tag group duplicated', description: `"${copy.name}" created.` });
  };

  const gaugeData = [
    { name: 'Compliant', value: data.overall.compliancePercent },
    { name: 'Non-Compliant', value: 100 - data.overall.compliancePercent },
  ];
  const gaugeColors = ['#10b981', '#e2e8f0'];

  const orgBarData = data.byOrgUnit
    .sort((a, b) => b.compliance - a.compliance)
    .map(ou => ({
      name: ou.orgUnitName.length > 18 ? ou.orgUnitName.slice(0, 18) + '…' : ou.orgUnitName,
      compliance: ou.compliance,
      untaggedCost: ou.untaggedCost,
    }));

  const summaryCards = [
    { label: 'Overall Compliance', value: `${data.overall.compliancePercent}%`, icon: IconShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', tooltip: 'Percentage of all cloud resources that have every required tag applied correctly.' },
    { label: 'Tagged Resources', value: `${data.overall.taggedResources} / ${data.overall.totalResources}`, icon: IconCircleCheck, color: 'text-blue-500', bg: 'bg-blue-500/10', tooltip: 'Number of resources with at least one tag versus the total number of provisioned resources.' },
    { label: 'Untagged Cost', value: formatCurrency(data.overall.untaggedCost, currency), icon: IconAlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', tooltip: 'Monthly spend from resources missing required tags — this cost cannot be attributed to any team or project.' },
    { label: 'Tag Groups', value: groups.length, icon: IconLayersLinked, color: 'text-purple-500', bg: 'bg-purple-500/10', tooltip: 'Total number of tag group schemas defined for enforcing consistent tagging across resources.' },
  ];

  const [violationSearch, setViolationSearch] = useState('');
  const [violationServiceFilter, setViolationServiceFilter] = useState<string>('all');

  const filteredViolations = useMemo(() => {
    return data.topViolations.filter(v => {
      const matchesSearch = violationSearch === '' ||
        v.resourceName.toLowerCase().includes(violationSearch.toLowerCase()) ||
        v.service.toLowerCase().includes(violationSearch.toLowerCase()) ||
        v.missingTags.some(t => t.toLowerCase().includes(violationSearch.toLowerCase()));
      const matchesService = violationServiceFilter === 'all' || v.service === violationServiceFilter;
      return matchesSearch && matchesService;
    });
  }, [data.topViolations, violationSearch, violationServiceFilter]);

  const violationServices = useMemo(() => Array.from(new Set(data.topViolations.map(v => v.service))), [data.topViolations]);

  const { currentPage: violationPage, setCurrentPage: setViolationPage, totalPages: violationTotalPages, pageSize: violationPageSize, paginatedData: paginatedViolations, totalItems: violationTotalItems } = useTableControls(filteredViolations);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-[1920px] mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold text-foreground">Tag Governance</h1>
          <p className="text-sm text-muted-foreground mt-1">Resource tagging compliance and cost attribution</p>
        </motion.div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0">
          {summaryCards.map((card, i) => (
            <UITooltip key={card.label} delayDuration={300}>
              <TooltipTrigger asChild>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.08 }}>
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
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-center">
                <p className="text-xs">{card.tooltip}</p>
              </TooltipContent>
            </UITooltip>
          ))}
        </div>

        {/* ── TAG GROUPS ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconLayersLinked className="h-5 w-5 text-primary" />
                  Tag Groups
                  <Badge variant="secondary" className="ml-1">{groups.length}</Badge>
                </CardTitle>
                <Button size="sm" onClick={openCreate} className="h-8 gap-1.5 text-xs">
                  <IconPlus className="h-3.5 w-3.5" /> New Group
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Define reusable tag schemas with typed key-value pairs — apply across resources like security groups.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className="rounded-xl border border-card-border bg-background p-4 flex flex-col hover:shadow-md transition-shadow"
                  >
                    {/* Group header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                        <span className="font-semibold text-sm truncate">{group.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleDuplicate(group)} title="Duplicate" className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
                          <IconCopy className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => openEdit(group)} title="Edit" className="text-muted-foreground hover:text-primary transition-colors p-1 rounded">
                          <IconEdit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(group.id)} title="Delete" className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded">
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {group.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{group.description}</p>
                    )}

                    {/* Tag keys */}
                    <div className="space-y-1.5 flex-1">
                      {group.tags.map(tag => (
                        <div key={tag.id} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 shrink-0">
                            {tag.key}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-1.5 shrink-0"
                            style={{ backgroundColor: group.color + '18', color: group.color }}
                          >
                            {VALUE_TYPE_LABELS[tag.valueType].split(' ')[0]}
                          </Badge>
                          {tag.required && (
                            <span className="text-[10px] text-red-500 font-medium">required</span>
                          )}
                          {tag.valueType === 'enum' && tag.allowedValues && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              [{tag.allowedValues}]
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-card-border">
                      <span className="text-[10px] text-muted-foreground">
                        {group.tags.length} key{group.tags.length !== 1 ? 's' : ''} · Created {group.createdAt}
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {group.appliedTo} resources
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Empty state new group card */}
                <button
                  onClick={openCreate}
                  className="rounded-xl border-2 border-dashed border-card-border bg-background p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[140px]"
                >
                  <IconPlus className="h-6 w-6" />
                  <span className="text-xs font-medium">New Tag Group</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compliance Score + Required Tags */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
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
                      <Pie data={gaugeData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
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
                      <p className="text-lg font-bold font-mono text-emerald-500">{data.overall.taggedResources}</p>
                      <p className="text-xs text-muted-foreground">Tagged</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-amber-500">{data.overall.totalResources - data.overall.taggedResources}</p>
                      <p className="text-xs text-muted-foreground">Untagged</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-card-border h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconTag className="h-5 w-5 text-primary" />
                  Required Tags Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.requiredTags.map(tag => (
                    <div key={tag.tag} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">{tag.tag}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="text-emerald-500 font-mono">{tag.compliant} compliant</span>
                          <span className="text-destructive font-mono">{tag.nonCompliant} missing</span>
                          <span className="font-bold font-mono text-foreground w-12 text-right">{tag.percentage}%</span>
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

        {/* Compliance by org unit */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
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
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'compliance' ? `${value}%` : formatCurrency(value, currency)
                    }
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="compliance" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {orgBarData.map((entry, index) => (
                      <Cell key={index} fill={entry.compliance >= 80 ? '#10b981' : entry.compliance >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Violations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5 text-amber-500" />
                  Top Violations
                  <Badge variant="secondary" className="ml-2">{filteredViolations.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search violations..."
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={violationServiceFilter} onValueChange={setViolationServiceFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {violationServices.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold uppercase">Resource</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Service</TableHead>
                      <TableHead className="text-xs font-semibold uppercase">Missing Tags</TableHead>
                      <TableHead className="text-xs font-semibold uppercase text-right">Monthly Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedViolations.map(v => (
                      <TableRow key={v.resourceId}>
                        <TableCell><span className="font-mono text-xs">{v.resourceName}</span></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{v.service}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {v.missingTags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs bg-destructive/10 text-destructive">{tag}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(v.monthlyCost, currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                currentPage={violationPage}
                totalPages={violationTotalPages}
                totalItems={violationTotalItems}
                pageSize={violationPageSize}
                onPageChange={setViolationPage}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <TagGroupDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
          initial={editTarget}
        />
      )}
    </ScrollArea>
  );
}

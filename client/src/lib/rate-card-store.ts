import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from './tco-store';

/**
 * Customer rate cards and usage costing.
 *
 * A rate card is versioned and dated: the version in force on a given day is the
 * newest one whose effective date has passed. Pricing a usage line always runs
 * AWS base cost -> agreed rate -> customer charge, and managed service charges
 * are kept apart from AWS charges all the way to the statement.
 */

export type AdjustmentType = 'markup' | 'discount';

export interface Adjustment {
  adjustmentType: AdjustmentType;
  percent: number;
}

export interface ServiceRate extends Adjustment {
  id: string;
  service: string;
}

export type ManagedChargeBasis = 'fixed' | 'percent_of_aws' | 'per_account';

export interface ManagedServiceCharge {
  id: string;
  label: string;
  basis: ManagedChargeBasis;
  /** Currency amount for fixed and per_account, percentage for percent_of_aws. */
  amount: number;
}

export interface RateCardVersion {
  id: string;
  customerId: string;
  version: number;
  effectiveFrom: string;
  createdAt: string;
  createdBy: string;
  note: string;
  globalAdjustment: Adjustment;
  serviceRates: ServiceRate[];
  managedServiceCharges: ManagedServiceCharge[];
}

export interface UsageLine {
  id: string;
  service: string;
  region: string;
  description: string;
  quantity: number;
  unit: string;
  baseCost: number;
}

export interface ChargeLine extends UsageLine {
  adjustmentType: AdjustmentType;
  percent: number;
  rateSource: 'service' | 'global';
  adjustmentAmount: number;
  customerCharge: number;
}

export interface PricedUsage {
  lines: ChargeLine[];
  baseTotal: number;
  adjustmentTotal: number;
  chargeTotal: number;
}

export interface ComputedManagedCharge extends ManagedServiceCharge {
  computed: number;
  basisLabel: string;
}

export interface Statement {
  usage: PricedUsage;
  managedCharges: ComputedManagedCharge[];
  managedTotal: number;
  total: number;
}

export const MANAGED_CHARGE_LABELS: Record<ManagedChargeBasis, string> = {
  fixed: 'Fixed monthly fee',
  percent_of_aws: 'Percentage of AWS charge',
  per_account: 'Per linked account',
};

/** The rate in force for a service: a service specific entry wins over the global one. */
export function resolveRate(card: RateCardVersion, service: string): Adjustment & { source: 'service' | 'global' } {
  const specific = card.serviceRates.find(r => r.service.toLowerCase() === service.toLowerCase());
  if (specific) {
    return { adjustmentType: specific.adjustmentType, percent: specific.percent, source: 'service' };
  }
  return { ...card.globalAdjustment, source: 'global' };
}

/** A discount can take a charge to zero but never below it; a markup is capped at 10x. */
export function clampRatePercent(adjustment: Adjustment): number {
  const percent = Number.isFinite(adjustment.percent) ? adjustment.percent : 0;
  const ceiling = adjustment.adjustmentType === 'discount' ? 100 : 1000;
  return Math.max(0, Math.min(ceiling, percent));
}

export function rateFactor(adjustment: Adjustment): number {
  const percent = clampRatePercent(adjustment);
  return adjustment.adjustmentType === 'markup' ? 1 + percent / 100 : 1 - percent / 100;
}

export function priceUsage(card: RateCardVersion, usage: UsageLine[]): PricedUsage {
  const lines: ChargeLine[] = usage.map(line => {
    const rate = resolveRate(card, line.service);
    // One unparseable persisted cost must not turn every total into NaN.
    const baseCost = Number.isFinite(line.baseCost) ? line.baseCost : 0;
    const customerCharge = baseCost * rateFactor(rate);
    return {
      ...line,
      baseCost,
      adjustmentType: rate.adjustmentType,
      percent: clampRatePercent(rate),
      rateSource: rate.source,
      adjustmentAmount: customerCharge - baseCost,
      customerCharge,
    };
  });

  const baseTotal = lines.reduce((sum, l) => sum + l.baseCost, 0);
  const chargeTotal = lines.reduce((sum, l) => sum + l.customerCharge, 0);

  return { lines, baseTotal, adjustmentTotal: chargeTotal - baseTotal, chargeTotal };
}

export function computeManagedCharges(
  card: RateCardVersion,
  awsChargeTotal: number,
  accountCount: number
): ComputedManagedCharge[] {
  return card.managedServiceCharges.map(entry => {
    const charge = { ...entry, amount: Number.isFinite(entry.amount) ? entry.amount : 0 };
    let computed = 0;
    if (charge.basis === 'fixed') computed = charge.amount;
    if (charge.basis === 'percent_of_aws') computed = awsChargeTotal * (charge.amount / 100);
    if (charge.basis === 'per_account') computed = charge.amount * accountCount;
    return {
      ...charge,
      computed,
      basisLabel:
        charge.basis === 'percent_of_aws'
          ? `${charge.amount}% of AWS charge`
          : charge.basis === 'per_account'
            ? `${accountCount} accounts`
            : 'Fixed',
    };
  });
}

export function buildStatement(
  card: RateCardVersion,
  usage: UsageLine[],
  accountCount: number
): Statement {
  const priced = priceUsage(card, usage);
  const managedCharges = computeManagedCharges(card, priced.chargeTotal, accountCount);
  const managedTotal = managedCharges.reduce((sum, c) => sum + c.computed, 0);
  return {
    usage: priced,
    managedCharges,
    managedTotal,
    total: priced.chargeTotal + managedTotal,
  };
}

export function versionsForCustomer(cards: RateCardVersion[], customerId: string): RateCardVersion[] {
  return cards
    .filter(c => c.customerId === customerId)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.version - a.version);
}

/** The version in force on a date: newest one already in effect, else the earliest on record. */
export function activeVersion(
  cards: RateCardVersion[],
  customerId: string,
  asOf: Date = new Date()
): RateCardVersion | undefined {
  const versions = versionsForCustomer(cards, customerId);
  const today = asOf.toISOString().split('T')[0];
  return versions.find(v => v.effectiveFrom <= today) ?? versions[versions.length - 1];
}

export function nextVersionNumber(cards: RateCardVersion[], customerId: string): number {
  const versions = versionsForCustomer(cards, customerId);
  return versions.reduce((highest, v) => Math.max(highest, v.version), 0) + 1;
}

function seedCards(): RateCardVersion[] {
  return [
    {
      id: 'rc-nibss-v2',
      customerId: 'cust-nibss',
      version: 2,
      effectiveFrom: '2026-04-01',
      createdAt: '2026-03-18T10:00:00.000Z',
      createdBy: 'Tunde Bakare',
      note: 'Renewal: headline markup reduced to 8% and EC2 held at 5% in exchange for a three year term.',
      globalAdjustment: { adjustmentType: 'markup', percent: 8 },
      serviceRates: [
        { id: 'sr-nibss-1', service: 'EC2', adjustmentType: 'markup', percent: 5 },
        { id: 'sr-nibss-2', service: 'S3', adjustmentType: 'markup', percent: 6 },
        { id: 'sr-nibss-3', service: 'Lambda', adjustmentType: 'discount', percent: 2 },
      ],
      managedServiceCharges: [
        { id: 'msc-nibss-1', label: 'Managed operations retainer', basis: 'fixed', amount: 18500 },
        { id: 'msc-nibss-2', label: 'Account governance', basis: 'per_account', amount: 450 },
        { id: 'msc-nibss-3', label: 'FinOps optimisation service', basis: 'percent_of_aws', amount: 3 },
      ],
    },
    {
      id: 'rc-nibss-v1',
      customerId: 'cust-nibss',
      version: 1,
      effectiveFrom: '2025-04-01',
      createdAt: '2025-03-20T10:00:00.000Z',
      createdBy: 'Tunde Bakare',
      note: 'Initial agreement at 12% headline markup.',
      globalAdjustment: { adjustmentType: 'markup', percent: 12 },
      serviceRates: [{ id: 'sr-nibss-old-1', service: 'EC2', adjustmentType: 'markup', percent: 10 }],
      managedServiceCharges: [
        { id: 'msc-nibss-old-1', label: 'Managed operations retainer', basis: 'fixed', amount: 15000 },
      ],
    },
    {
      id: 'rc-pencom-v1',
      customerId: 'cust-pencom',
      version: 1,
      effectiveFrom: '2026-02-01',
      createdAt: '2026-01-22T10:00:00.000Z',
      createdBy: 'Ngozi Eze',
      note: 'Public sector schedule: 10% headline markup, no per-service exceptions.',
      globalAdjustment: { adjustmentType: 'markup', percent: 10 },
      serviceRates: [],
      managedServiceCharges: [
        { id: 'msc-pencom-1', label: 'Managed operations retainer', basis: 'fixed', amount: 9500 },
        { id: 'msc-pencom-2', label: 'Compliance reporting', basis: 'fixed', amount: 2400 },
      ],
    },
    {
      id: 'rc-firstbank-v3',
      customerId: 'cust-firstbank',
      version: 3,
      effectiveFrom: '2026-01-01',
      createdAt: '2025-12-04T10:00:00.000Z',
      createdBy: 'Segun Adigun',
      note: 'Volume tier reached: headline markup 6%, RDS and Redshift discounted against list.',
      globalAdjustment: { adjustmentType: 'markup', percent: 6 },
      serviceRates: [
        { id: 'sr-fb-1', service: 'EC2', adjustmentType: 'markup', percent: 4 },
        { id: 'sr-fb-2', service: 'RDS', adjustmentType: 'discount', percent: 3 },
        { id: 'sr-fb-3', service: 'Redshift', adjustmentType: 'discount', percent: 5 },
        { id: 'sr-fb-4', service: 'CloudFront', adjustmentType: 'markup', percent: 9 },
      ],
      managedServiceCharges: [
        { id: 'msc-fb-1', label: 'Managed operations retainer', basis: 'fixed', amount: 32000 },
        { id: 'msc-fb-2', label: 'Account governance', basis: 'per_account', amount: 400 },
        { id: 'msc-fb-3', label: '24x7 incident response', basis: 'fixed', amount: 14000 },
      ],
    },
    {
      id: 'rc-firstbank-v2',
      customerId: 'cust-firstbank',
      version: 2,
      effectiveFrom: '2025-01-01',
      createdAt: '2024-12-06T10:00:00.000Z',
      createdBy: 'Segun Adigun',
      note: 'Second year: markup trimmed from 12% to 9%.',
      globalAdjustment: { adjustmentType: 'markup', percent: 9 },
      serviceRates: [{ id: 'sr-fb-old-1', service: 'EC2', adjustmentType: 'markup', percent: 7 }],
      managedServiceCharges: [
        { id: 'msc-fb-old-1', label: 'Managed operations retainer', basis: 'fixed', amount: 28000 },
      ],
    },
    {
      id: 'rc-fidelity-v1',
      customerId: 'cust-fidelity',
      version: 1,
      effectiveFrom: '2025-10-01',
      createdAt: '2025-09-12T10:00:00.000Z',
      createdBy: 'Amara Obi',
      note: 'Pilot agreement at 9% headline markup while the estate is onboarded.',
      globalAdjustment: { adjustmentType: 'markup', percent: 9 },
      serviceRates: [
        { id: 'sr-fid-1', service: 'S3', adjustmentType: 'markup', percent: 7 },
      ],
      managedServiceCharges: [
        { id: 'msc-fid-1', label: 'Managed operations retainer', basis: 'fixed', amount: 12000 },
        { id: 'msc-fid-2', label: 'Onboarding support', basis: 'percent_of_aws', amount: 2 },
      ],
    },
  ];
}

interface RateCardStore {
  cards: RateCardVersion[];
  usageByCustomer: Record<string, UsageLine[]>;
  saveCard: (card: RateCardVersion) => void;
  deleteCard: (id: string) => void;
  setUsage: (customerId: string, lines: UsageLine[]) => void;
}

export const useRateCardStore = create<RateCardStore>()(
  persist(
    (set) => ({
      cards: seedCards(),
      usageByCustomer: {},
      saveCard: (card) =>
        set((state) => {
          const index = state.cards.findIndex(c => c.id === card.id);
          if (index === -1) return { cards: [...state.cards, card] };
          const cards = [...state.cards];
          cards[index] = card;
          return { cards };
        }),
      deleteCard: (id) => set((state) => ({ cards: state.cards.filter(c => c.id !== id) })),
      setUsage: (customerId, lines) =>
        set((state) => ({ usageByCustomer: { ...state.usageByCustomer, [customerId]: lines } })),
    }),
    { name: 'qocent-rate-cards', version: 1 }
  )
);

export function emptyCard(customerId: string, version: number, createdBy: string): RateCardVersion {
  return {
    id: uid('rc'),
    customerId,
    version,
    effectiveFrom: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    createdBy,
    note: '',
    globalAdjustment: { adjustmentType: 'markup', percent: 10 },
    serviceRates: [],
    managedServiceCharges: [],
  };
}

/** Parse pasted or uploaded usage: service,region,description,quantity,unit,baseCost */
export function parseUsageCsv(text: string): { lines: UsageLine[]; skipped: number } {
  const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
  if (rows.length === 0) return { lines: [], skipped: 0 };

  const startsWithHeader = (splitCsvRow(rows[0])[0] ?? '').trim().toLowerCase() === 'service';
  const body = startsWithHeader ? rows.slice(1) : rows;

  const lines: UsageLine[] = [];
  let skipped = 0;

  for (const row of body) {
    const cells = splitCsvRow(row);
    const service = (cells[0] ?? '').trim();
    const baseCost = toNumber(cells[5]);
    if (!service || baseCost === null) {
      skipped++;
      continue;
    }
    lines.push({
      id: uid('usage'),
      service,
      region: (cells[1] ?? '').trim(),
      description: (cells[2] ?? '').trim(),
      quantity: toNumber(cells[3]) ?? 0,
      unit: (cells[4] ?? '').trim(),
      baseCost,
    });
  }

  return { lines, skipped };
}

/**
 * A cell is a number only if something numeric is actually there.
 * Accepts currency symbols and thousands separators, and reads the accounting
 * convention "(500)" as -500 so a credit stays a credit.
 */
function toNumber(cell: string | undefined): number | null {
  const raw = (cell ?? '').trim();
  if (raw === '') return null;

  const negated = /^\((.*)\)$/.test(raw);
  const inner = negated ? raw.slice(1, -1) : raw;

  // Anything that is not a currency symbol, separator, sign or digit means this is not a number.
  if (/[^0-9.,\-+$£€₦¥\s]/.test(inner)) return null;

  const cleaned = inner.replace(/[^0-9.\-]/g, '');
  const match = cleaned.match(/^-?\d*(\.\d+)?$/);
  if (!match || cleaned === '' || cleaned === '-' || cleaned === '.') return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return negated ? -Math.abs(value) : value;
}

function splitCsvRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Total cost of ownership analyses.
 *
 * An analysis pairs what a customer spends running an estate today against what
 * the proposed AWS environment is expected to cost, and projects both over a
 * term. Everything is entered as a monthly figure; the term maths derives the
 * rest so the annual and multi-year views cannot drift from the inputs.
 */

export interface CostLine {
  id: string;
  label: string;
  monthlyCost: number;
  note?: string;
}

export interface TcoAssumptions {
  termYears: number;
  /** Year on year growth applied to the current estate. */
  onPremGrowthPercent: number;
  /** Year on year growth applied to the AWS estate. */
  awsGrowthPercent: number;
  /** Savings Plans and Reserved Instance coverage applied to the AWS run rate. */
  commitmentDiscountPercent: number;
  /** One-off cost of getting there, charged against the AWS side. */
  migrationCost: number;
  notes: string;
}

export interface TcoAnalysis {
  id: string;
  customerId: string;
  name: string;
  status: 'draft' | 'final';
  createdAt: string;
  updatedAt: string;
  preparedBy: string;
  currentEnvironment: string;
  proposedEnvironment: string;
  onPremise: CostLine[];
  aws: CostLine[];
  assumptions: TcoAssumptions;
}

export interface TcoYear {
  year: number;
  onPremCost: number;
  awsCost: number;
  savings: number;
  cumulativeOnPrem: number;
  cumulativeAws: number;
  cumulativeSavings: number;
}

export interface TcoResult {
  /** The term actually used, after clamping. */
  termYears: number;
  /** The commitment discount actually applied, after clamping. */
  commitmentDiscountPercent: number;
  /** The growth rates actually applied, after clamping. */
  onPremGrowthPercent: number;
  awsGrowthPercent: number;
  onPremMonthly: number;
  awsMonthly: number;
  /** AWS monthly after commitment discount. */
  awsMonthlyEffective: number;
  monthlySavings: number;
  onPremAnnual: number;
  awsAnnual: number;
  annualSavings: number;
  onPremTerm: number;
  /** Term run cost plus the one-off migration cost. */
  awsTerm: number;
  termSavings: number;
  savingsPercent: number;
  migrationCost: number;
  breakEvenMonths: number | null;
  years: TcoYear[];
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_ONPREM_CATEGORIES = [
  'Compute and servers',
  'Storage',
  'Networking',
  'Software licensing',
  'Data centre and facilities',
  'Backup and disaster recovery',
  'Operations and personnel',
  'Other',
];

export const DEFAULT_AWS_CATEGORIES = [
  'Compute (EC2, ECS, Lambda)',
  'Storage (S3, EBS, EFS)',
  'Database (RDS, DynamoDB)',
  'Networking and data transfer',
  'Backup and disaster recovery',
  'AWS Support',
  'Other',
];

export function blankLines(labels: string[], prefix: string): CostLine[] {
  return labels.map(label => ({ id: uid(prefix), label, monthlyCost: 0 }));
}

export function emptyAnalysis(customerId: string, preparedBy: string): TcoAnalysis {
  const now = new Date().toISOString();
  return {
    id: uid('tco'),
    customerId,
    name: 'Untitled analysis',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    preparedBy,
    currentEnvironment: '',
    proposedEnvironment: '',
    onPremise: blankLines(DEFAULT_ONPREM_CATEGORIES, 'onprem'),
    aws: blankLines(DEFAULT_AWS_CATEGORIES, 'aws'),
    assumptions: {
      termYears: 3,
      onPremGrowthPercent: 5,
      awsGrowthPercent: 3,
      commitmentDiscountPercent: 0,
      migrationCost: 0,
      notes: '',
    },
  };
}

function sumLines(lines: CostLine[]): number {
  return lines.reduce((total, line) => total + (Number.isFinite(line.monthlyCost) ? line.monthlyCost : 0), 0);
}

export function calculateTco(analysis: TcoAnalysis): TcoResult {
  const { assumptions } = analysis;
  const termYears = clampTerm(assumptions.termYears);

  const onPremMonthly = sumLines(analysis.onPremise);
  const awsMonthly = sumLines(analysis.aws);
  const discountFactor = 1 - clampDiscount(assumptions.commitmentDiscountPercent) / 100;
  const awsMonthlyEffective = awsMonthly * discountFactor;

  const onPremGrowth = 1 + clampPercent(assumptions.onPremGrowthPercent) / 100;
  const awsGrowth = 1 + clampPercent(assumptions.awsGrowthPercent) / 100;
  const migrationCost = Math.max(0, assumptions.migrationCost || 0);

  const years: TcoYear[] = [];
  let cumulativeOnPrem = 0;
  let cumulativeAws = 0;

  for (let year = 1; year <= termYears; year++) {
    const onPremCost = onPremMonthly * 12 * Math.pow(onPremGrowth, year - 1);
    // The one-off migration cost lands in year one alongside the run rate.
    const awsRun = awsMonthlyEffective * 12 * Math.pow(awsGrowth, year - 1);
    const awsCost = year === 1 ? awsRun + migrationCost : awsRun;

    cumulativeOnPrem += onPremCost;
    cumulativeAws += awsCost;

    years.push({
      year,
      onPremCost,
      awsCost,
      savings: onPremCost - awsCost,
      cumulativeOnPrem,
      cumulativeAws,
      cumulativeSavings: cumulativeOnPrem - cumulativeAws,
    });
  }

  const monthlySavings = onPremMonthly - awsMonthlyEffective;
  const onPremTerm = cumulativeOnPrem;
  const awsTerm = cumulativeAws;
  const termSavings = onPremTerm - awsTerm;

  return {
    termYears,
    commitmentDiscountPercent: clampDiscount(assumptions.commitmentDiscountPercent),
    onPremGrowthPercent: clampPercent(assumptions.onPremGrowthPercent),
    awsGrowthPercent: clampPercent(assumptions.awsGrowthPercent),
    onPremMonthly,
    awsMonthly,
    awsMonthlyEffective,
    monthlySavings,
    onPremAnnual: onPremMonthly * 12,
    awsAnnual: awsMonthlyEffective * 12,
    annualSavings: (onPremMonthly - awsMonthlyEffective) * 12,
    onPremTerm,
    awsTerm,
    termSavings,
    savingsPercent: onPremTerm > 0 ? (termSavings / onPremTerm) * 100 : 0,
    migrationCost,
    // Null means there is nothing to recover, or nothing to recover it with.
    breakEvenMonths: migrationCost > 0 && monthlySavings > 0
      ? Math.ceil(migrationCost / monthlySavings)
      : null,
    years,
  };
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-100, Math.min(100, value));
}

/** A discount can remove all of a cost but never more, or the estate goes negative. */
function clampDiscount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/** Long enough for any real commercial term, short enough that a mistyped year cannot melt the chart. */
export const MAX_TERM_YEARS = 15;

export function clampTerm(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_TERM_YEARS, Math.round(value)));
}

/** One worked example so the module opens with something to look at. */
function seedAnalyses(): TcoAnalysis[] {
  const created = '2026-07-02T09:15:00.000Z';
  return [
    {
      id: 'tco-firstbank-core',
      customerId: 'cust-firstbank',
      name: 'Core banking platform migration',
      status: 'final',
      createdAt: created,
      updatedAt: created,
      preparedBy: 'Segun Adigun',
      currentEnvironment:
        'Two owned data centres in Lagos running 340 virtual machines across VMware, a 480 TB SAN, Oracle and MSSQL licensing, and a leased DR site in Abuja.',
      proposedEnvironment:
        'Landing zone across eu-west-1 and us-east-1: EC2 with Graviton where supported, Aurora PostgreSQL for the core ledger, S3 with Intelligent-Tiering, Direct Connect to the branch network, and AWS Backup replacing the tape estate.',
      onPremise: [
        { id: 'onprem-fb-1', label: 'Compute and servers', monthlyCost: 128000, note: '340 VMs, 3 year refresh amortised' },
        { id: 'onprem-fb-2', label: 'Storage', monthlyCost: 46000, note: '480 TB SAN plus growth' },
        { id: 'onprem-fb-3', label: 'Networking', monthlyCost: 31000, note: 'Core switching, load balancers, links' },
        { id: 'onprem-fb-4', label: 'Software licensing', monthlyCost: 74000, note: 'VMware, Oracle, MSSQL, monitoring' },
        { id: 'onprem-fb-5', label: 'Data centre and facilities', monthlyCost: 58000, note: 'Power, cooling, space, security' },
        { id: 'onprem-fb-6', label: 'Backup and disaster recovery', monthlyCost: 27000, note: 'Abuja DR site and tape rotation' },
        { id: 'onprem-fb-7', label: 'Operations and personnel', monthlyCost: 62000, note: '6 infrastructure engineers' },
        { id: 'onprem-fb-8', label: 'Other', monthlyCost: 9000, note: 'Support contracts and sundries' },
      ],
      aws: [
        { id: 'aws-fb-1', label: 'Compute (EC2, ECS, Lambda)', monthlyCost: 121000, note: 'Graviton where supported' },
        { id: 'aws-fb-2', label: 'Storage (S3, EBS, EFS)', monthlyCost: 34000, note: 'Intelligent-Tiering on the archive' },
        { id: 'aws-fb-3', label: 'Database (RDS, DynamoDB)', monthlyCost: 52000, note: 'Aurora PostgreSQL, Multi-AZ' },
        { id: 'aws-fb-4', label: 'Networking and data transfer', monthlyCost: 18500, note: 'Direct Connect and egress' },
        { id: 'aws-fb-5', label: 'Backup and disaster recovery', monthlyCost: 11000, note: 'AWS Backup, cross-region copies' },
        { id: 'aws-fb-6', label: 'AWS Support', monthlyCost: 9500, note: 'Enterprise Support' },
        { id: 'aws-fb-7', label: 'Other', monthlyCost: 6000, note: 'Security tooling and observability' },
      ],
      assumptions: {
        termYears: 5,
        onPremGrowthPercent: 6,
        awsGrowthPercent: 3,
        commitmentDiscountPercent: 22,
        migrationCost: 480000,
        notes:
          'On-premises growth reflects the 2026 refresh cycle and rising facilities costs. AWS growth assumes workload growth net of continued rightsizing. Commitment discount assumes three year Compute Savings Plans across the steady state. Migration cost covers professional services, dual running for four months, and staff training.',
      },
    },
  ];
}

interface TcoStore {
  analyses: TcoAnalysis[];
  saveAnalysis: (analysis: TcoAnalysis) => void;
  deleteAnalysis: (id: string) => void;
}

export const useTcoStore = create<TcoStore>()(
  persist(
    (set) => ({
      analyses: seedAnalyses(),
      // Stored exactly as given: the caller stamps updatedAt, so a just-saved
      // draft compares equal to the stored copy and the dirty flag can clear.
      saveAnalysis: (analysis) =>
        set((state) => {
          const existing = state.analyses.findIndex(a => a.id === analysis.id);
          if (existing === -1) return { analyses: [...state.analyses, analysis] };
          const analyses = [...state.analyses];
          analyses[existing] = analysis;
          return { analyses };
        }),
      deleteAnalysis: (id) =>
        set((state) => ({ analyses: state.analyses.filter(a => a.id !== id) })),
    }),
    { name: 'qocent-tco', version: 1 }
  )
);

export function getAnalysesForCustomer(analyses: TcoAnalysis[], customerId: string | 'all'): TcoAnalysis[] {
  const scoped = customerId === 'all' ? analyses : analyses.filter(a => a.customerId === customerId);
  return [...scoped].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

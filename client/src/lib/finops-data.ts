import type {
  Resource,
  Recommendation,
  DashboardKPIs,
  CostTrendPoint,
  ServiceBreakdown,
  RegionBreakdown,
  OrgUnitSummary,
  DateRange,
} from '@shared/schema';
import type { CloudProvider, OrgUnit } from './provider-config';
import { getProviderConfig, getServiceInfo, getRegionNames } from './provider-config';
import { getCustomer, type Customer } from './customers';
import { useFinOpsStore } from './finops-store';

// Customer scope — AWS portal only. Every generator below is keyed on the active
// customer so switching customers re-derives the whole dataset, and each customer
// carries its share of portfolio spend.
interface CustomerScope {
  key: string;
  weight: number;
  customer?: Customer;
}

let scopeOverride: string | null = null;

/**
 * Run `fn` as if `customerId` were the active filter. Used to compare customers
 * side by side without disturbing the current selection.
 */
export function withCustomerScope<T>(customerId: string | 'all', fn: () => T): T {
  const previous = scopeOverride;
  scopeOverride = customerId;
  try {
    return fn();
  } finally {
    scopeOverride = previous;
  }
}

function getCustomerScope(): CustomerScope {
  const { selectedProvider, selectedCustomerId } = useFinOpsStore.getState();
  const activeId = scopeOverride ?? selectedCustomerId;
  if (selectedProvider !== 'aws' || activeId === 'all') {
    return { key: 'portfolio', weight: 1 };
  }
  const customer = getCustomer(activeId);
  if (!customer) return { key: 'portfolio', weight: 1 };
  return { key: customer.id, weight: customer.spendWeight, customer };
}

function customerWeight(): number {
  return getCustomerScope().weight;
}

// Deterministic seeded PRNG (mulberry32) — ensures same inputs always produce same data
function createSeededRandom(seed: string): () => number {
  const scopedSeed = `${getCustomerScope().key}::${seed}`;
  let h = 0;
  for (let i = 0; i < scopedSeed.length; i++) {
    h = Math.imul(31, h) + scopedSeed.charCodeAt(i) | 0;
  }
  return () => {
    h |= 0; h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getDaysFromDateRange(dateRange?: DateRange): number {
  if (!dateRange || !dateRange.startDate || !dateRange.endDate) return 30;
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

export function getOrgUnits(provider: CloudProvider): OrgUnit[] {
  return getProviderConfig(provider).orgUnits;
}

export function generateCostTrend(tenantId: string | 'all', provider: CloudProvider = 'huawei', dateRange?: DateRange): CostTrendPoint[] {
  const days = getDaysFromDateRange(dateRange);
  const rand = createSeededRandom(`costTrend-${tenantId}-${provider}-${days}`);
  const data: CostTrendPoint[] = [];
  const today = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();

  const providerMultiplier = provider === 'aws' ? 1.2 : provider === 'azure' ? 1.1 : provider === 'gcp' ? 1.0 : 0.9;
  const cw = customerWeight();
  const baseAmount = (tenantId === 'all' ? 45000 : 8000) * providerMultiplier * cw;
  const variance = (tenantId === 'all' ? 8000 : 1500) * providerMultiplier * cw;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1;

    const randomVariance = (rand() - 0.5) * variance;
    const trendGrowth = (days - i) * 50 * cw;

    const amount = Math.max(0, (baseAmount + randomVariance + trendGrowth) * weekendFactor);

    data.push({
      date: date.toISOString().split('T')[0],
      amount: Math.round(amount * 100) / 100,
    });
  }

  const lastAmount = data[data.length - 1].amount;
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const forecastGrowth = i * 80 * cw;
    const forecast = lastAmount + forecastGrowth + (rand() - 0.5) * 500 * cw;

    data.push({
      date: date.toISOString().split('T')[0],
      amount: 0,
      forecast: Math.round(forecast * 100) / 100,
    });
  }

  return data;
}

export function generateServiceBreakdown(tenantId: string | 'all', provider: CloudProvider = 'huawei', dateRange?: DateRange): ServiceBreakdown[] {
  const days = getDaysFromDateRange(dateRange);
  const dayScale = days / 30;
  const rand = createSeededRandom(`serviceBreakdown-${tenantId}-${provider}-${days}`);
  const config = getProviderConfig(provider);
  const services = config.services;

  const baseCosts: number[] = [45000, 28000, 15000, 12000, 8500, 5200, 9800, 3200, 4500, 6800, 7200, 11000, 2800, 3500, 18000, 14000, 9500, 4200];

  const multiplier = (tenantId === 'all' ? 1 : 0.15) * customerWeight();

  const breakdown = services.map((service, i) => {
    const baseCost = baseCosts[i % baseCosts.length];
    const variance = (rand() - 0.3) * baseCost * 0.4;
    const cost = Math.max(100, (baseCost + variance) * multiplier * dayScale);
    const trend = (rand() - 0.4) * 25;
    const resourceCount = Math.floor(cost / 500) + Math.floor(rand() * 10);

    return {
      service,
      cost: Math.round(cost * 100) / 100,
      percentage: 0,
      trend: Math.round(trend * 10) / 10,
      resourceCount,
    };
  });

  const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
  breakdown.forEach(item => {
    item.percentage = Math.round((item.cost / totalCost) * 1000) / 10;
  });

  return breakdown.sort((a, b) => b.cost - a.cost);
}

export function generateRegionBreakdown(tenantId: string | 'all', provider: CloudProvider = 'huawei', dateRange?: DateRange): RegionBreakdown[] {
  const days = getDaysFromDateRange(dateRange);
  const dayScale = days / 30;
  const rand = createSeededRandom(`regionBreakdown-${tenantId}-${provider}-${days}`);
  const config = getProviderConfig(provider);
  const regions = config.regions;

  const baseCosts: number[] = [65000, 42000, 35000, 28000, 18000, 15000, 8000, 5000];

  const multiplier = (tenantId === 'all' ? 1 : 0.15) * customerWeight();

  const breakdown = regions.map((region, i) => {
    const baseCost = baseCosts[i % baseCosts.length];
    const variance = (rand() - 0.3) * baseCost * 0.3;
    const cost = Math.max(500, (baseCost + variance) * multiplier * dayScale);
    const resourceCount = Math.floor(cost / 800) + Math.floor(rand() * 15);

    return {
      region,
      cost: Math.round(cost * 100) / 100,
      percentage: 0,
      resourceCount,
    };
  });

  const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
  breakdown.forEach(item => {
    item.percentage = Math.round((item.cost / totalCost) * 1000) / 10;
  });

  return breakdown.sort((a, b) => b.cost - a.cost);
}

export function generateKPIs(tenantId: string | 'all', provider: CloudProvider = 'huawei', dateRange?: DateRange): DashboardKPIs {
  const days = getDaysFromDateRange(dateRange);
  const dayScale = days / 30;
  const rand = createSeededRandom(`kpis-${tenantId}-${provider}-${days}`);
  const isAll = tenantId === 'all';
  const scope = getCustomerScope();
  const multiplier = (isAll ? 1 : 0.15) * scope.weight;
  const orgUnits = getOrgUnits(provider);

  const totalSpend = (185000 + rand() * 30000) * multiplier * dayScale;
  const previousSpend = totalSpend * (0.88 + rand() * 0.08);
  const spendGrowthRate = ((totalSpend - previousSpend) / previousSpend) * 100;

  const portfolioBudget = scope.customer ? scope.customer.budget : 2300000;
  const totalBudget = isAll
    ? portfolioBudget
    : Math.round((orgUnits.find(u => u.id === tenantId)?.budget || 200000) * scope.weight);
  const budgetUsed = (totalSpend / totalBudget) * 100;

  const activeResources = Math.max(1, Math.floor((isAll ? 847 : 120 + rand() * 50) * scope.weight));

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    previousSpend: Math.round(previousSpend * 100) / 100,
    spendGrowthRate: Math.round(spendGrowthRate * 10) / 10,
    budgetUsed: Math.round(budgetUsed * 10) / 10,
    totalBudget,
    activeResources,
    optimizationOpportunities: Math.max(1, Math.floor((isAll ? 156 : 18 + rand() * 12) * scope.weight)),
    potentialSavings: Math.round((totalSpend * (0.12 + rand() * 0.08)) * 100) / 100,
    averageEfficiency: Math.round((75 + rand() * 18) * 10) / 10,
    costPerResource: Math.round((totalSpend / activeResources) * 100) / 100,
  };
}

function getProviderRecommendations(tenantId: string | 'all', provider: CloudProvider): Recommendation[] {
  const orgUnits = getOrgUnits(provider);
  const getTid = (index: number) => tenantId === 'all' ? orgUnits[index % orgUnits.length].id : tenantId;
  const config = getProviderConfig(provider);

  if (provider === 'aws') {
    return [
      { id: 'rec-1', tenantId: getTid(0), type: 'rightsizing', title: 'Downsize EC2 Instance i-0abc123def', description: 'This instance has averaged 12% CPU utilization over the past 30 days. Consider downsizing from m5.xlarge to m5.large to save costs.', resourceId: 'i-0abc123def', resourceName: 'i-0abc123def', service: 'EC2', currentCost: 458.50, projectedSavings: 183.40, impact: 'high', effort: 'easy', status: 'new' },
      { id: 'rec-2', tenantId: getTid(1), type: 'idle_resource', title: 'Terminate Idle RDS Instance rds-staging', description: 'This RDS instance has had zero connections for 21 days. Consider terminating or snapshotting.', resourceId: 'rds-staging', resourceName: 'rds-staging', service: 'RDS', currentCost: 324.00, projectedSavings: 324.00, impact: 'high', effort: 'easy', status: 'new' },
      { id: 'rec-3', tenantId: getTid(2), type: 'savings_plans', title: 'Purchase Compute Savings Plan', description: 'Your EC2 usage has been consistent. Purchasing a Compute Savings Plan could save 38% on compute costs.', resourceId: 'ec2-fleet', resourceName: 'EC2 Fleet', service: 'EC2', currentCost: 2840.00, projectedSavings: 1079.20, impact: 'high', effort: 'moderate', status: 'new' },
      { id: 'rec-4', tenantId: getTid(3), type: 'reserved_instance', title: 'Convert On-Demand EC2 to Reserved', description: 'Convert 5 On-Demand EC2 instances to 1-Year All Upfront RI to save $12,400/yr.', resourceId: 'ec2-group', resourceName: 'Production EC2 Group', service: 'EC2', currentCost: 3200.00, projectedSavings: 1033.00, impact: 'high', effort: 'moderate', status: 'new' },
      { id: 'rec-5', tenantId: getTid(4), type: 'storage_optimization', title: 'Move S3 Data to Intelligent-Tiering', description: 'Move 3.2TB in S3 Standard to S3 Intelligent-Tiering: save 40%.', resourceId: 's3-archive', resourceName: 's3-data-archive', service: 'S3', currentCost: 156.00, projectedSavings: 62.40, impact: 'medium', effort: 'easy', status: 'in_progress' },
      { id: 'rec-6', tenantId: getTid(5), type: 'ebs_optimization', title: 'Delete Unattached EBS Volumes', description: '12 unattached EBS volumes (2.4TB total). Delete to eliminate waste.', resourceId: 'ebs-unattached', resourceName: 'Unattached EBS Volumes', service: 'EBS', currentCost: 128.00, projectedSavings: 128.00, impact: 'medium', effort: 'easy', status: 'new' },
      { id: 'rec-7', tenantId: getTid(6), type: 'idle_resource', title: 'Remove Unused Elastic IPs', description: '4 Elastic IPs not associated with running instances. Release them.', resourceId: 'eip-unused', resourceName: 'Unused Elastic IPs', service: 'VPC', currentCost: 14.40, projectedSavings: 14.40, impact: 'low', effort: 'easy', status: 'new' },
      { id: 'rec-8', tenantId: getTid(7), type: 'rightsizing', title: 'Downsize ElastiCache Node', description: 'Redis cache memory utilization averages 18%. Consider scaling from cache.r5.xlarge to cache.r5.large.', resourceId: 'elasticache-prod', resourceName: 'elasticache-prod-001', service: 'ElastiCache', currentCost: 385.00, projectedSavings: 192.50, impact: 'medium', effort: 'easy', status: 'new' },
      { id: 'rec-9', tenantId: getTid(0), type: 'savings_plans', title: 'SageMaker Savings Plan', description: 'Consistent SageMaker usage detected. Purchase Savings Plan for 20% discount.', resourceId: 'sagemaker-endpoint', resourceName: 'ml-inference-endpoint', service: 'SageMaker', currentCost: 2100.00, projectedSavings: 420.00, impact: 'high', effort: 'moderate', status: 'new' },
      { id: 'rec-10', tenantId: getTid(1), type: 'idle_resource', title: 'Clean Up Old Lambda Versions', description: 'Over 200 unused Lambda function versions consuming storage. Clean up old versions.', resourceId: 'lambda-versions', resourceName: 'Lambda Old Versions', service: 'Lambda', currentCost: 45.00, projectedSavings: 38.00, impact: 'low', effort: 'moderate', status: 'new' },
    ];
  } else if (provider === 'azure') {
    return [
      { id: 'rec-1', tenantId: getTid(0), type: 'rightsizing', title: 'Resize VM prod-web-01', description: 'Resize VM from Standard_D4s_v3 to Standard_D2s_v3 — avg CPU 15%.', resourceId: 'vm-prod-web-01', resourceName: 'prod-web-01', service: 'Virtual Machines', currentCost: 458.50, projectedSavings: 229.25, impact: 'high', effort: 'easy', status: 'new' },
      { id: 'rec-2', tenantId: getTid(1), type: 'idle_resource', title: 'Deallocate Stopped VM staging-api', description: 'VM is stopped but still incurring managed disk costs. Deallocate completely.', resourceId: 'vm-staging-api', resourceName: 'staging-api', service: 'Virtual Machines', currentCost: 324.00, projectedSavings: 280.00, impact: 'high', effort: 'easy', status: 'new' },
      { id: 'rec-3', tenantId: getTid(2), type: 'reserved_instance', title: 'Purchase 1-Year RI for VMs', description: 'Purchase 1-year RI for 8 Standard_D2s_v3 VMs: save 40%.', resourceId: 'vm-ri-group', resourceName: 'Production VM Group', service: 'Virtual Machines', currentCost: 2840.00, projectedSavings: 1136.00, impact: 'high', effort: 'moderate', status: 'new' },
      { id: 'rec-4', tenantId: getTid(3), type: 'hybrid_benefit', title: 'Apply Azure Hybrid Benefit', description: 'Apply Azure Hybrid Benefit to 15 Windows VMs: save $8,200/yr on licensing.', resourceId: 'vm-windows-group', resourceName: 'Windows VMs', service: 'Virtual Machines', currentCost: 1640.00, projectedSavings: 683.00, impact: 'high', effort: 'easy', status: 'new' },
      { id: 'rec-5', tenantId: getTid(4), type: 'storage_optimization', title: 'Move Blob Data to Cool Tier', description: 'Move 1.8TB from Hot to Cool tier in Blob Storage: save 50%.', resourceId: 'storage-hot', resourceName: 'prod-storage-account', service: 'Blob Storage', currentCost: 156.00, projectedSavings: 78.00, impact: 'medium', effort: 'easy', status: 'in_progress' },
      { id: 'rec-6', tenantId: getTid(5), type: 'spot_vms', title: 'Convert Dev/Test to Spot VMs', description: 'Convert dev/test workloads to Spot VMs: save up to 90%.', resourceId: 'vm-devtest', resourceName: 'Dev/Test VMs', service: 'Virtual Machines', currentCost: 890.00, projectedSavings: 712.00, impact: 'medium', effort: 'moderate', status: 'new' },
      { id: 'rec-7', tenantId: getTid(6), type: 'idle_resource', title: 'Delete Unattached Managed Disks', description: '10 managed disks (2TB total) not attached to any VM.', resourceId: 'disk-unattached', resourceName: 'Unattached Disks', service: 'Managed Disks', currentCost: 128.00, projectedSavings: 128.00, impact: 'medium', effort: 'easy', status: 'new' },
      { id: 'rec-8', tenantId: getTid(7), type: 'rightsizing', title: 'Scale Down Redis Cache', description: 'Redis Cache memory utilization averages 18%. Scale from C3 to C2.', resourceId: 'redis-prod', resourceName: 'redis-cache-prod', service: 'Redis Cache', currentCost: 385.00, projectedSavings: 192.50, impact: 'medium', effort: 'easy', status: 'new' },
      { id: 'rec-9', tenantId: getTid(0), type: 'reserved_instance', title: 'Cosmos DB Reserved Capacity', description: 'Consistent Cosmos DB usage. Reserved capacity could yield 25% savings.', resourceId: 'cosmos-prod', resourceName: 'cosmos-db-prod', service: 'Cosmos DB', currentCost: 2100.00, projectedSavings: 525.00, impact: 'high', effort: 'moderate', status: 'new' },
      { id: 'rec-10', tenantId: getTid(1), type: 'idle_resource', title: 'Remove Unused App Service Plans', description: 'Multiple App Service plans with no apps deployed. Remove them.', resourceId: 'asp-unused', resourceName: 'Unused App Service Plans', service: 'App Service', currentCost: 245.00, projectedSavings: 245.00, impact: 'low', effort: 'easy', status: 'new' },
    ];
  } else if (provider === 'gcp') {
    return [
      { id: 'rec-1', tenantId: getTid(0), type: 'rightsizing', title: 'Resize Instance prod-api-01', description: 'Resize from n1-standard-4 to e2-standard-2 — avg CPU 14%.', resourceId: 'prod-api-01', resourceName: 'prod-api-01', service: 'Compute Engine', currentCost: 458.50, projectedSavings: 275.10, impact: 'high', effort: 'easy', status: 'new' },
      { id: 'rec-2', tenantId: getTid(1), type: 'idle_resource', title: 'Delete Idle Cloud SQL Instance', description: 'Cloud SQL instance staging-db has had no connections for 30 days.', resourceId: 'staging-db', resourceName: 'staging-db', service: 'Cloud SQL', currentCost: 324.00, projectedSavings: 324.00, impact: 'high', effort: 'easy', status: 'new' },
      { id: 'rec-3', tenantId: getTid(2), type: 'committed_use', title: 'Purchase 1-Year CUD', description: 'Purchase 1-year CUD for 16 vCPUs + 64GB RAM: save 37%.', resourceId: 'compute-fleet', resourceName: 'Compute Fleet', service: 'Compute Engine', currentCost: 2840.00, projectedSavings: 1050.80, impact: 'high', effort: 'moderate', status: 'new' },
      { id: 'rec-4', tenantId: getTid(3), type: 'sustained_use', title: 'Sustained Use Discount Active', description: 'Current sustained use discount: 22% on Compute Engine this month.', resourceId: 'compute-sustained', resourceName: 'Compute Engine Fleet', service: 'Compute Engine', currentCost: 1640.00, projectedSavings: 360.80, impact: 'medium', effort: 'easy', status: 'implemented' },
      { id: 'rec-5', tenantId: getTid(4), type: 'storage_optimization', title: 'Move to Nearline Storage', description: 'Move 4.1TB from Standard to Nearline in Cloud Storage: save 50%.', resourceId: 'gcs-archive', resourceName: 'gcs-data-archive', service: 'Cloud Storage', currentCost: 156.00, projectedSavings: 78.00, impact: 'medium', effort: 'easy', status: 'in_progress' },
      { id: 'rec-6', tenantId: getTid(5), type: 'spot_vms', title: 'Convert Batch to Spot VMs', description: 'Convert batch processing to Spot VMs: save 60-91%.', resourceId: 'batch-vms', resourceName: 'Batch Processing VMs', service: 'Compute Engine', currentCost: 890.00, projectedSavings: 623.00, impact: 'medium', effort: 'moderate', status: 'new' },
      { id: 'rec-7', tenantId: getTid(6), type: 'idle_resource', title: 'Delete Unused Persistent Disks', description: '8 persistent disks (1.6TB) not attached to any instance.', resourceId: 'pd-unattached', resourceName: 'Unattached Disks', service: 'Persistent Disk', currentCost: 128.00, projectedSavings: 128.00, impact: 'medium', effort: 'easy', status: 'new' },
      { id: 'rec-8', tenantId: getTid(7), type: 'rightsizing', title: 'Scale Down Memorystore', description: 'Redis instance memory utilization averages 18%. Scale from M2 to M1.', resourceId: 'memorystore-prod', resourceName: 'memorystore-prod-001', service: 'Memorystore', currentCost: 385.00, projectedSavings: 192.50, impact: 'medium', effort: 'easy', status: 'new' },
      { id: 'rec-9', tenantId: getTid(0), type: 'committed_use', title: 'BigQuery Flat-Rate Commitment', description: 'Consistent BigQuery usage. Flat-rate commitment could yield 30% savings.', resourceId: 'bq-slots', resourceName: 'BigQuery Slots', service: 'BigQuery', currentCost: 2100.00, projectedSavings: 630.00, impact: 'high', effort: 'moderate', status: 'new' },
      { id: 'rec-10', tenantId: getTid(1), type: 'idle_resource', title: 'Clean Up Unused GKE Clusters', description: 'Development GKE cluster with no workloads running for 14 days.', resourceId: 'gke-dev', resourceName: 'gke-dev-cluster', service: 'GKE', currentCost: 245.00, projectedSavings: 245.00, impact: 'low', effort: 'moderate', status: 'new' },
    ];
  }

  return [
    { id: 'rec-1', tenantId: getTid(0), type: 'rightsizing', title: 'Downsize ECS Instance ecs-prod-web-01', description: 'This instance has averaged 12% CPU utilization over the past 30 days. Consider downsizing from s6.xlarge.4 to s6.large.2 to save costs.', resourceId: 'ecs-prod-web-01', resourceName: 'ecs-prod-web-01', service: 'ECS', currentCost: 458.50, projectedSavings: 183.40, impact: 'high', effort: 'easy', status: 'new' },
    { id: 'rec-2', tenantId: getTid(1), type: 'idle_resource', title: 'Terminate Idle RDS Instance rds-staging-db', description: 'This RDS instance has had zero connections for 21 days. Consider terminating or snapshotting and removing.', resourceId: 'rds-staging-db', resourceName: 'rds-staging-db', service: 'RDS', currentCost: 324.00, projectedSavings: 324.00, impact: 'high', effort: 'easy', status: 'new' },
    { id: 'rec-3', tenantId: getTid(2), type: 'reserved_instance', title: 'Purchase Reserved Instance for ECS Cluster', description: 'Your ECS cluster has stable usage patterns. Purchasing 1-year reserved instances could save 35% on compute costs.', resourceId: 'ecs-cluster-prod', resourceName: 'Production ECS Cluster', service: 'ECS', currentCost: 2840.00, projectedSavings: 994.00, impact: 'high', effort: 'moderate', status: 'new' },
    { id: 'rec-4', tenantId: getTid(3), type: 'storage_optimization', title: 'Move Cold Data to OBS Standard-IA', description: 'Analysis shows 2.4TB of data in OBS Standard that hasn\'t been accessed in 90+ days. Moving to Standard-IA could reduce costs by 40%.', resourceId: 'obs-bucket-archive', resourceName: 'obs-bucket-archive', service: 'OBS', currentCost: 156.00, projectedSavings: 62.40, impact: 'medium', effort: 'easy', status: 'in_progress' },
    { id: 'rec-5', tenantId: getTid(4), type: 'network_optimization', title: 'Optimize CDN Cache Rules', description: 'Your CDN has a 45% cache hit ratio. Optimizing cache rules could improve this to 85% and reduce origin traffic costs.', resourceId: 'cdn-domain-main', resourceName: 'cdn-domain-main', service: 'CDN', currentCost: 890.00, projectedSavings: 356.00, impact: 'medium', effort: 'moderate', status: 'new' },
    { id: 'rec-6', tenantId: getTid(5), type: 'database_tuning', title: 'Enable RDS Read Replicas', description: 'High read workload detected on primary RDS. Adding read replicas would improve performance and enable smaller primary instance.', resourceId: 'rds-prod-primary', resourceName: 'rds-prod-primary', service: 'RDS', currentCost: 1240.00, projectedSavings: 372.00, impact: 'high', effort: 'complex', status: 'new' },
    { id: 'rec-7', tenantId: getTid(6), type: 'idle_resource', title: 'Delete Unattached EVS Volumes', description: '8 EVS volumes totaling 1.6TB are not attached to any instance. Delete or snapshot these to eliminate waste.', resourceId: 'evs-unattached-group', resourceName: 'Unattached EVS Volumes', service: 'EVS', currentCost: 128.00, projectedSavings: 128.00, impact: 'medium', effort: 'easy', status: 'new' },
    { id: 'rec-8', tenantId: getTid(7), type: 'rightsizing', title: 'Scale Down DCS Instance', description: 'Redis cache memory utilization averages 18%. Consider scaling from 16GB to 8GB instance.', resourceId: 'dcs-redis-prod', resourceName: 'dcs-redis-prod', service: 'DCS', currentCost: 385.00, projectedSavings: 192.50, impact: 'medium', effort: 'easy', status: 'new' },
    { id: 'rec-9', tenantId: getTid(0), type: 'reserved_instance', title: 'GaussDB Reserved Capacity', description: 'Your GaussDB usage has been consistent. Reserved capacity purchase could yield 25% savings.', resourceId: 'gaussdb-cluster', resourceName: 'gaussdb-cluster', service: 'GaussDB', currentCost: 2100.00, projectedSavings: 525.00, impact: 'high', effort: 'moderate', status: 'new' },
    { id: 'rec-10', tenantId: getTid(1), type: 'network_optimization', title: 'Consolidate NAT Gateways', description: 'Multiple NAT gateways detected in same VPC. Consolidating to single gateway could reduce costs.', resourceId: 'nat-gateway-group', resourceName: 'VPC NAT Gateways', service: 'NAT', currentCost: 245.00, projectedSavings: 122.50, impact: 'low', effort: 'moderate', status: 'new' },
  ];
}

export function generateRecommendations(tenantId: string | 'all', provider: CloudProvider = 'huawei'): Recommendation[] {
  const weight = customerWeight();
  const scale = (value: number) => Math.round(value * weight * 100) / 100;
  const recommendations = getProviderRecommendations(tenantId, provider).map(r =>
    weight === 1 ? r : { ...r, currentCost: scale(r.currentCost), projectedSavings: scale(r.projectedSavings) }
  );

  if (tenantId !== 'all') {
    return recommendations.filter(r => r.tenantId === tenantId).slice(0, 5);
  }

  return recommendations;
}

function getResourceNamePrefix(provider: CloudProvider, service: string): string {
  if (provider === 'aws') {
    const prefixes: Record<string, string> = { 'EC2': 'i-0', 'S3': 's3-', 'RDS': 'rds-', 'Lambda': 'lambda-', 'EKS': 'eks-', 'DynamoDB': 'ddb-', 'ELB': 'elb-', 'ElastiCache': 'cache-', 'EBS': 'vol-' };
    return prefixes[service] || 'res-';
  } else if (provider === 'azure') {
    const prefixes: Record<string, string> = { 'Virtual Machines': 'vm-', 'Blob Storage': 'st-', 'SQL Database': 'sql-', 'App Service': 'app-', 'AKS': 'aks-', 'Cosmos DB': 'cosmos-', 'Redis Cache': 'redis-', 'Managed Disks': 'disk-' };
    return prefixes[service] || 'res-';
  } else if (provider === 'gcp') {
    const prefixes: Record<string, string> = { 'Compute Engine': 'gce-', 'Cloud Storage': 'gcs-', 'Cloud SQL': 'csql-', 'Cloud Functions': 'gcf-', 'GKE': 'gke-', 'BigQuery': 'bq-', 'Memorystore': 'mem-', 'Persistent Disk': 'pd-' };
    return prefixes[service] || 'res-';
  }
  const huaweiPrefixes: Record<string, string> = { 'ECS': 'ecs-', 'RDS': 'rds-', 'OBS': 'obs-', 'EVS': 'evs-', 'ELB': 'elb-', 'VPC': 'vpc-', 'CDN': 'cdn-', 'DCS': 'dcs-' };
  return huaweiPrefixes[service] || `${service.toLowerCase()}-`;
}

function getResourceType(provider: CloudProvider, service: string): string {
  if (provider === 'aws') {
    const types: Record<string, string> = { 'EC2': 'm5.xlarge', 'RDS': 'db.r5.large', 'S3': 'Standard', 'EKS': 'managed-node', 'ElastiCache': 'cache.r5.large' };
    return types[service] || 'standard';
  } else if (provider === 'azure') {
    const types: Record<string, string> = { 'Virtual Machines': 'Standard_D4s_v3', 'SQL Database': 'S3', 'AKS': 'Standard_DS2_v2', 'Redis Cache': 'C2' };
    return types[service] || 'standard';
  } else if (provider === 'gcp') {
    const types: Record<string, string> = { 'Compute Engine': 'n1-standard-4', 'Cloud SQL': 'db-custom-4-15360', 'GKE': 'e2-standard-4', 'Memorystore': 'M1' };
    return types[service] || 'standard';
  }
  const huaweiTypes: Record<string, string> = { 'ECS': 's6.xlarge.4', 'RDS': 'mysql.x1.large.4', 'OBS': 'Standard', 'EVS': 'SAS', 'DCS': 'master-standby' };
  return huaweiTypes[service] || 'standard';
}

export function generateResources(tenantId: string | 'all', provider: CloudProvider = 'huawei'): Resource[] {
  const rand = createSeededRandom(`resources-${tenantId}-${provider}`);
  const config = getProviderConfig(provider);
  const services = config.services.slice(0, 8);
  const regions = config.regions.slice(0, 4);
  const orgUnits = getOrgUnits(provider);

  const resources: Resource[] = [];
  const resourceCount = Math.max(6, Math.round((tenantId === 'all' ? 50 : 15) * customerWeight()));

  for (let i = 0; i < resourceCount; i++) {
    const service = services[Math.floor(rand() * services.length)];
    const region = regions[Math.floor(rand() * regions.length)];
    const tId = tenantId === 'all' ? orgUnits[Math.floor(rand() * orgUnits.length)].id : tenantId;
    const prefix = getResourceNamePrefix(provider, service);
    const envSuffix = ['prod', 'staging', 'dev'][Math.floor(rand() * 3)];

    let name: string;
    if (provider === 'aws' && (service === 'EC2' || service === 'EBS')) {
      name = `${prefix}${Math.floor(rand() * 0xFFFFFFFF).toString(16).padStart(8, '0')}`;
    } else {
      name = `${prefix}${envSuffix}-${String(i + 1).padStart(2, '0')}`;
    }

    resources.push({
      id: `resource-${i + 1}`,
      tenantId: tId,
      name,
      service,
      region,
      type: getResourceType(provider, service),
      status: rand() > 0.1 ? 'running' : 'stopped',
      cpuUtilization: Math.round(rand() * 100),
      memoryUtilization: Math.round(rand() * 100),
      networkUtilization: Math.round(rand() * 100),
      diskUtilization: Math.round(rand() * 100),
      monthlyCost: Math.round((50 + rand() * 500) * 100) / 100,
      createdAt: new Date(Date.now() - rand() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return resources;
}

// ==================== ANOMALY DETECTION ====================

export interface CostAnomaly {
  id: string;
  date: string;
  service: string;
  region: string;
  expectedCost: number;
  actualCost: number;
  deviation: number;
  severity: 'critical' | 'warning' | 'info';
  status: 'new' | 'investigating' | 'resolved';
  description: string;
  orgUnitId: string;
}

export function generateAnomalies(orgUnitId: string | 'all', provider: CloudProvider = 'huawei'): CostAnomaly[] {
  const rand = createSeededRandom(`anomalies-${orgUnitId}-${provider}`);
  const cw = customerWeight();
  const config = getProviderConfig(provider);
  const services = config.services.slice(0, 8);
  const regions = config.regions.slice(0, 5);
  const orgUnits = getOrgUnits(provider);
  const today = new Date();

  const anomalyTemplates: { deviation: number; severity: 'critical' | 'warning' | 'info'; descTemplate: string }[] = [
    { deviation: 340, severity: 'critical', descTemplate: 'Sudden spike in {service} costs — possible misconfigured auto-scaling or runaway process.' },
    { deviation: 185, severity: 'critical', descTemplate: 'Unusual {service} activity detected in {region}. Costs nearly tripled compared to baseline.' },
    { deviation: 95, severity: 'warning', descTemplate: '{service} spending in {region} is significantly above the 30-day moving average.' },
    { deviation: 72, severity: 'warning', descTemplate: 'Gradual cost increase in {service} over the past week exceeds normal variance.' },
    { deviation: 58, severity: 'warning', descTemplate: '{service} data transfer costs spiked — possible large data migration or backup job.' },
    { deviation: 45, severity: 'info', descTemplate: '{service} costs slightly elevated. May be related to end-of-month batch processing.' },
    { deviation: 38, severity: 'info', descTemplate: 'Minor cost increase in {service} — within seasonal variance but worth monitoring.' },
    { deviation: 280, severity: 'critical', descTemplate: 'Critical: {service} in {region} showing 3x normal spend. Immediate investigation recommended.' },
    { deviation: 120, severity: 'warning', descTemplate: '{service} storage costs growing faster than expected — review data retention policies.' },
    { deviation: 25, severity: 'info', descTemplate: '{service} compute costs slightly above forecast. No action required yet.' },
    { deviation: 210, severity: 'critical', descTemplate: 'Anomalous network egress from {service} in {region} — possible data exfiltration or misconfiguration.' },
    { deviation: 65, severity: 'warning', descTemplate: '{service} API call volume and associated costs are 65% above baseline.' },
  ];

  const statuses: ('new' | 'investigating' | 'resolved')[] = ['new', 'new', 'new', 'investigating', 'investigating', 'resolved'];

  return anomalyTemplates.map((template, i) => {
    const service = services[i % services.length];
    const region = regions[i % regions.length];
    const oId = orgUnitId === 'all' ? orgUnits[i % orgUnits.length].id : orgUnitId;
    const daysAgo = Math.floor(rand() * 14);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const expectedCost = (500 + rand() * 3000) * cw;
    const actualCost = expectedCost * (1 + template.deviation / 100);

    return {
      id: `anomaly-${i + 1}`,
      date: date.toISOString().split('T')[0],
      service,
      region,
      expectedCost: Math.round(expectedCost * 100) / 100,
      actualCost: Math.round(actualCost * 100) / 100,
      deviation: template.deviation,
      severity: template.severity,
      status: statuses[i % statuses.length],
      description: template.descTemplate.replace('{service}', service).replace('{region}', getRegionNames(provider)[region] || region),
      orgUnitId: oId,
    };
  });
}

// ==================== SAVINGS PLANS / RI COVERAGE ====================

export interface Commitment {
  id: string;
  type: string;
  service: string;
  term: '1-year' | '3-year';
  monthlyCommitment: number;
  monthlyOnDemand: number;
  utilization: number;
  coverage: number;
  expirationDate: string;
  status: 'active' | 'expiring' | 'expired';
}

export interface SavingsPlanData {
  commitments: Commitment[];
  summary: {
    totalCommitment: number;
    totalOnDemand: number;
    coveragePercent: number;
    utilizationPercent: number;
    totalSavings: number;
    expiringIn30Days: number;
  };
}

export function generateSavingsPlans(orgUnitId: string | 'all', provider: CloudProvider = 'huawei'): SavingsPlanData {
  const rand = createSeededRandom(`savingsPlans-${orgUnitId}-${provider}`);
  const cw = customerWeight();
  const config = getProviderConfig(provider);
  const services = config.services.slice(0, 6);
  const today = new Date();

  const typesByProvider: Record<CloudProvider, string[]> = {
    aws: ['Reserved Instance', 'Savings Plan', 'Reserved Instance', 'Savings Plan', 'Reserved Instance', 'Savings Plan', 'Reserved Instance'],
    azure: ['Reserved Instance', 'Reserved Instance', 'Hybrid Benefit', 'Reserved Instance', 'Hybrid Benefit', 'Reserved Instance', 'Reserved Instance'],
    gcp: ['Committed Use Discount', 'Committed Use Discount', 'Sustained Use', 'Committed Use Discount', 'Sustained Use', 'Committed Use Discount', 'Committed Use Discount'],
    huawei: ['Reserved Instance', 'Reserved Instance', 'Reserved Instance', 'Reserved Instance', 'Reserved Instance', 'Reserved Instance', 'Reserved Instance'],
  };

  const types = typesByProvider[provider];

  const commitments: Commitment[] = types.map((type, i) => {
    const term = i % 3 === 0 ? '3-year' : '1-year' as const;
    const monthlyCommitment = (800 + rand() * 4000) * cw;
    const monthlyOnDemand = monthlyCommitment * (1.3 + rand() * 0.5);
    const utilization = 60 + rand() * 38;
    const coverage = 50 + rand() * 45;

    const expirationDays = i < 2 ? Math.floor(rand() * 25) + 5 : Math.floor(rand() * 300) + 30;
    const expDate = new Date(today);
    expDate.setDate(expDate.getDate() + expirationDays);

    let status: 'active' | 'expiring' | 'expired' = 'active';
    if (expirationDays <= 30) status = 'expiring';
    if (i === types.length - 1) { status = 'expired'; expDate.setDate(today.getDate() - 15); }

    return {
      id: `commitment-${i + 1}`,
      type,
      service: services[i % services.length],
      term,
      monthlyCommitment: Math.round(monthlyCommitment * 100) / 100,
      monthlyOnDemand: Math.round(monthlyOnDemand * 100) / 100,
      utilization: Math.round(utilization * 10) / 10,
      coverage: Math.round(coverage * 10) / 10,
      expirationDate: expDate.toISOString().split('T')[0],
      status,
    };
  });

  const activeCommitments = commitments.filter(c => c.status !== 'expired');
  const totalCommitment = activeCommitments.reduce((s, c) => s + c.monthlyCommitment, 0);
  const totalOnDemand = activeCommitments.reduce((s, c) => s + c.monthlyOnDemand, 0);
  const avgUtil = activeCommitments.reduce((s, c) => s + c.utilization, 0) / (activeCommitments.length || 1);
  const avgCoverage = activeCommitments.reduce((s, c) => s + c.coverage, 0) / (activeCommitments.length || 1);

  return {
    commitments,
    summary: {
      totalCommitment: Math.round(totalCommitment * 100) / 100,
      totalOnDemand: Math.round(totalOnDemand * 100) / 100,
      coveragePercent: Math.round(avgCoverage * 10) / 10,
      utilizationPercent: Math.round(avgUtil * 10) / 10,
      totalSavings: Math.round((totalOnDemand - totalCommitment) * 100) / 100,
      expiringIn30Days: commitments.filter(c => c.status === 'expiring').length,
    },
  };
}

// ==================== COST FORECASTING ====================

export interface ForecastPoint {
  date: string;
  amount: number;
  upperBound?: number;
  lowerBound?: number;
  isHistorical: boolean;
}

export interface ForecastScenario {
  name: string;
  label: string;
  monthlyProjection: number;
  quarterlyProjection: number;
  color: string;
}

export interface ForecastData {
  dataPoints: ForecastPoint[];
  projectedMonthEnd: number;
  projectedQuarterEnd: number;
  budgetBreachDate: string | null;
  confidenceLevel: number;
  scenarios: ForecastScenario[];
}

export function generateForecast(orgUnitId: string | 'all', provider: CloudProvider = 'huawei'): ForecastData {
  const rand = createSeededRandom(`forecast-${orgUnitId}-${provider}`);
  const multiplier = (orgUnitId === 'all' ? 1 : 0.15) * customerWeight();
  const providerMult = provider === 'aws' ? 1.2 : provider === 'azure' ? 1.1 : provider === 'gcp' ? 1.0 : 0.9;
  const baseAmount = 45000 * multiplier * providerMult;
  const today = new Date();
  const dataPoints: ForecastPoint[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1;
    const amount = baseAmount * weekendFactor + (rand() - 0.5) * baseAmount * 0.2 + (30 - i) * 60 * multiplier;

    dataPoints.push({
      date: date.toISOString().split('T')[0],
      amount: Math.round(amount * 100) / 100,
      isHistorical: true,
    });
  }

  const lastAmount = dataPoints[dataPoints.length - 1].amount;
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const growth = i * 40 * multiplier;
    const base = lastAmount + growth + (rand() - 0.5) * 2000 * multiplier;
    const spread = 1000 + i * 80 * multiplier;

    dataPoints.push({
      date: date.toISOString().split('T')[0],
      amount: Math.round(base * 100) / 100,
      upperBound: Math.round((base + spread) * 100) / 100,
      lowerBound: Math.round(Math.max(0, base - spread) * 100) / 100,
      isHistorical: false,
    });
  }

  const monthlyBase = lastAmount * 30;
  const quarterlyBase = lastAmount * 90;

  return {
    dataPoints,
    projectedMonthEnd: Math.round(monthlyBase * 1.05 * 100) / 100,
    projectedQuarterEnd: Math.round(quarterlyBase * 1.12 * 100) / 100,
    budgetBreachDate: rand() > 0.4 ? (() => { const d = new Date(today); d.setDate(d.getDate() + 45 + Math.floor(rand() * 30)); return d.toISOString().split('T')[0]; })() : null,
    confidenceLevel: Math.round((82 + rand() * 12) * 10) / 10,
    scenarios: [
      { name: 'optimistic', label: 'Optimistic', monthlyProjection: Math.round(monthlyBase * 0.9), quarterlyProjection: Math.round(quarterlyBase * 0.88), color: '#10b981' },
      { name: 'baseline', label: 'Baseline', monthlyProjection: Math.round(monthlyBase * 1.05), quarterlyProjection: Math.round(quarterlyBase * 1.12), color: '#3b82f6' },
      { name: 'pessimistic', label: 'Pessimistic', monthlyProjection: Math.round(monthlyBase * 1.2), quarterlyProjection: Math.round(quarterlyBase * 1.35), color: '#ef4444' },
      { name: 'with_recommendations', label: 'With Optimizations', monthlyProjection: Math.round(monthlyBase * 0.82), quarterlyProjection: Math.round(quarterlyBase * 0.78), color: '#8b5cf6' },
    ],
  };
}

// ==================== TAG COMPLIANCE ====================

export interface TagRule {
  tag: string;
  compliant: number;
  nonCompliant: number;
  percentage: number;
}

export interface OrgUnitCompliance {
  orgUnitId: string;
  orgUnitName: string;
  compliance: number;
  untaggedCost: number;
}

export interface TagViolation {
  resourceId: string;
  resourceName: string;
  service: string;
  missingTags: string[];
  monthlyCost: number;
}

export interface TagComplianceData {
  overall: {
    totalResources: number;
    taggedResources: number;
    compliancePercent: number;
    untaggedCost: number;
  };
  requiredTags: TagRule[];
  byOrgUnit: OrgUnitCompliance[];
  topViolations: TagViolation[];
}

export function generateTagCompliance(orgUnitId: string | 'all', provider: CloudProvider = 'huawei'): TagComplianceData {
  const rand = createSeededRandom(`tagCompliance-${orgUnitId}-${provider}`);
  const config = getProviderConfig(provider);
  const orgUnits = getOrgUnits(provider);
  const services = config.services.slice(0, 8);

  const tagsByProvider: Record<CloudProvider, string[]> = {
    aws: ['Environment', 'CostCenter', 'Owner', 'Project', 'Team'],
    azure: ['environment', 'cost-center', 'owner', 'department', 'application'],
    gcp: ['env', 'cost-center', 'team', 'project', 'managed-by'],
    huawei: ['environment', 'cost_center', 'owner', 'project', 'department'],
  };

  const tags = tagsByProvider[provider];
  const cw = customerWeight();
  const totalResources = Math.max(20, Math.round((orgUnitId === 'all' ? 847 : 120) * cw));
  const complianceBase = 65 + rand() * 20;

  const requiredTags: TagRule[] = tags.map(tag => {
    const pct = complianceBase + (rand() - 0.5) * 30;
    const compliant = Math.round(totalResources * pct / 100);
    return {
      tag,
      compliant,
      nonCompliant: totalResources - compliant,
      percentage: Math.round(Math.min(100, pct) * 10) / 10,
    };
  });

  const taggedResources = Math.round(totalResources * complianceBase / 100);
  const untaggedCost = (totalResources - taggedResources) * (80 + rand() * 200);

  const byOrgUnit: OrgUnitCompliance[] = orgUnits.map((ou, i) => {
    const ouRand = createSeededRandom(`tagOu-${ou.id}-${provider}`);
    return {
      orgUnitId: ou.id,
      orgUnitName: ou.name,
      compliance: Math.round((55 + ouRand() * 40) * 10) / 10,
      untaggedCost: Math.round((2000 + ouRand() * 15000) * cw * 100) / 100,
    };
  });

  const topViolations: TagViolation[] = Array.from({ length: 10 }, (_, i) => {
    const service = services[i % services.length];
    const missingCount = 1 + Math.floor(rand() * 3);
    const missingTags = tags.slice(0, missingCount);
    return {
      resourceId: `res-untagged-${i + 1}`,
      resourceName: `${service.toLowerCase()}-untagged-${String(i + 1).padStart(2, '0')}`,
      service,
      missingTags,
      monthlyCost: Math.round((50 + rand() * 800) * 100) / 100,
    };
  });

  return {
    overall: {
      totalResources,
      taggedResources,
      compliancePercent: Math.round(complianceBase * 10) / 10,
      untaggedCost: Math.round(untaggedCost * 100) / 100,
    },
    requiredTags,
    byOrgUnit,
    topViolations,
  };
}

// ==================== UNIT ECONOMICS ====================

export interface UnitMetric {
  name: string;
  value: number;
  unit: string;
  trend: number;
  description: string;
}

export interface UnitEconomicsTrend {
  date: string;
  costPerUnit: number;
  transactions: number;
}

export interface ServiceUnitCost {
  service: string;
  costPerUnit: number;
  totalCost: number;
  units: number;
}

export interface UnitEconomicsData {
  metrics: UnitMetric[];
  trend: UnitEconomicsTrend[];
  topServices: ServiceUnitCost[];
}

export function generateUnitEconomics(orgUnitId: string | 'all', provider: CloudProvider = 'huawei', dateRange?: DateRange): UnitEconomicsData {
  const days = getDaysFromDateRange(dateRange);
  const rand = createSeededRandom(`unitEconomics-${orgUnitId}-${provider}-${days}`);
  const config = getProviderConfig(provider);
  const services = config.services.slice(0, 8);
  const multiplier = (orgUnitId === 'all' ? 1 : 0.3) * customerWeight();

  const metrics: UnitMetric[] = [
    { name: 'Cost per API Call', value: Math.round((0.0012 + rand() * 0.0008) * 10000) / 10000, unit: 'per call', trend: -(2 + rand() * 8), description: 'Average cost per API request across all endpoints' },
    { name: 'Cost per Active User', value: Math.round((2.4 + rand() * 1.8) * 100) / 100, unit: 'per user/mo', trend: -(1 + rand() * 5), description: 'Monthly cloud cost per active platform user' },
    { name: 'Cost per GB Stored', value: Math.round((0.023 + rand() * 0.015) * 1000) / 1000, unit: 'per GB/mo', trend: rand() > 0.5 ? -(rand() * 3) : rand() * 2, description: 'Average storage cost across all tiers and services' },
    { name: 'Cost per Transaction', value: Math.round((0.045 + rand() * 0.03) * 1000) / 1000, unit: 'per txn', trend: -(3 + rand() * 6), description: 'Average infrastructure cost per business transaction' },
  ];

  const today = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();
  const trend: UnitEconomicsTrend[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const baseCPU = 0.05 - (days - 1 - i) * (0.009 / Math.max(1, days - 1));
    trend.push({
      date: date.toISOString().split('T')[0],
      costPerUnit: Math.round((baseCPU + (rand() - 0.5) * 0.01) * 10000) / 10000,
      transactions: Math.round((150000 + rand() * 50000) * multiplier),
    });
  }

  const topServices: ServiceUnitCost[] = services.map(service => {
    const totalCost = (3000 + rand() * 12000) * multiplier;
    const units = Math.round(50000 + rand() * 200000);
    return {
      service,
      costPerUnit: Math.round((totalCost / units) * 10000) / 10000,
      totalCost: Math.round(totalCost * 100) / 100,
      units,
    };
  }).sort((a, b) => b.costPerUnit - a.costPerUnit);

  return { metrics, trend, topServices };
}

// ==================== WASTE DETECTION ====================

export interface WasteCategory {
  name: string;
  count: number;
  monthlyCost: number;
}

export interface WastedResource {
  id: string;
  name: string;
  service: string;
  type: string;
  region: string;
  monthlyCost: number;
  reason: string;
  lastActive: string;
  orgUnitId: string;
}

export interface WasteAnalysisData {
  summary: {
    totalWaste: number;
    wastePercentage: number;
    idleResources: number;
    orphanedVolumes: number;
    oversizedInstances: number;
    unattachedIPs: number;
  };
  categories: WasteCategory[];
  resources: WastedResource[];
}

export function generateWasteAnalysis(orgUnitId: string | 'all', provider: CloudProvider = 'huawei'): WasteAnalysisData {
  const rand = createSeededRandom(`waste-${orgUnitId}-${provider}`);
  const config = getProviderConfig(provider);
  const services = config.services.slice(0, 6);
  const regions = config.regions.slice(0, 4);
  const orgUnits = getOrgUnits(provider);

  const reasons = [
    'Idle for 30+ days',
    'CPU utilization < 5%',
    'No network traffic for 14 days',
    'Unattached volume',
    'Orphaned snapshot',
    'Unused reserved IP',
    'Oversized — using < 10% capacity',
    'Stopped instance still incurring storage costs',
    'Unused load balancer',
    'Empty container registry',
    'Expired SSL certificate resource',
    'Development resource left running',
    'Test environment not cleaned up',
    'Duplicate backup',
    'Oversized database instance',
    'Unused NAT gateway',
    'Idle serverless function with reserved capacity',
    'Unattached network interface',
  ];

  const resourceCount = Math.max(4, Math.round((orgUnitId === 'all' ? 18 : 8) * customerWeight()));
  const resources: WastedResource[] = Array.from({ length: resourceCount }, (_, i) => {
    const service = services[i % services.length];
    const region = regions[i % regions.length];
    const oId = orgUnitId === 'all' ? orgUnits[i % orgUnits.length].id : orgUnitId;
    const prefix = getResourceNamePrefix(provider, service);
    const daysAgo = 7 + Math.floor(rand() * 60);
    const lastActive = new Date();
    lastActive.setDate(lastActive.getDate() - daysAgo);

    return {
      id: `waste-${i + 1}`,
      name: `${prefix}waste-${String(i + 1).padStart(2, '0')}`,
      service,
      type: getResourceType(provider, service),
      region,
      monthlyCost: Math.round((20 + rand() * 450) * 100) / 100,
      reason: reasons[i % reasons.length],
      lastActive: lastActive.toISOString().split('T')[0],
      orgUnitId: oId,
    };
  });

  const totalWaste = resources.reduce((s, r) => s + r.monthlyCost, 0);
  const idleResources = resources.filter(r => r.reason.includes('Idle') || r.reason.includes('idle') || r.reason.includes('CPU')).length;
  const orphanedVolumes = resources.filter(r => r.reason.includes('Unattached') || r.reason.includes('Orphaned')).length;
  const oversized = resources.filter(r => r.reason.includes('Oversized') || r.reason.includes('oversized')).length;
  const unattachedIPs = resources.filter(r => r.reason.includes('reserved IP') || r.reason.includes('Unused')).length;

  const categories: WasteCategory[] = [
    { name: 'Idle Resources', count: idleResources || 4, monthlyCost: Math.round(totalWaste * 0.35 * 100) / 100 },
    { name: 'Orphaned Volumes', count: orphanedVolumes || 3, monthlyCost: Math.round(totalWaste * 0.25 * 100) / 100 },
    { name: 'Oversized Instances', count: oversized || 3, monthlyCost: Math.round(totalWaste * 0.28 * 100) / 100 },
    { name: 'Unattached IPs/NICs', count: unattachedIPs || 2, monthlyCost: Math.round(totalWaste * 0.12 * 100) / 100 },
  ];

  return {
    summary: {
      totalWaste: Math.round(totalWaste * 100) / 100,
      wastePercentage: Math.round((8 + rand() * 12) * 10) / 10,
      idleResources: idleResources || 4,
      orphanedVolumes: orphanedVolumes || 3,
      oversizedInstances: oversized || 3,
      unattachedIPs: unattachedIPs || 2,
    },
    categories,
    resources,
  };
}

// ==================== ORG UNIT SUMMARIES ====================

export function generateOrgUnitSummaries(provider: CloudProvider, dateRange?: DateRange): OrgUnitSummary[] {
  const orgUnits = getOrgUnits(provider);
  return orgUnits.map(orgUnit => {
    const kpis = generateKPIs(orgUnit.id, provider, dateRange);
    const services = generateServiceBreakdown(orgUnit.id, provider, dateRange);
    const recommendations = generateRecommendations(orgUnit.id, provider);

    return {
      orgUnit: {
        id: orgUnit.id,
        name: orgUnit.name,
        description: orgUnit.description,
        environment: orgUnit.environment,
        budget: orgUnit.budget,
        efficiencyScore: orgUnit.efficiencyScore,
        status: orgUnit.status,
      },
      totalSpend: kpis.totalSpend,
      budgetUsage: kpis.budgetUsed,
      efficiencyScore: orgUnit.efficiencyScore,
      topService: services[0]?.service || (provider === 'huawei' ? 'ECS' : 'Compute'),
      recommendationCount: recommendations.length,
    };
  });
}

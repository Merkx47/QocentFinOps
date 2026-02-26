import type {
  Tenant,
  Resource,
  Recommendation,
  DashboardKPIs,
  CostTrendPoint,
  ServiceBreakdown,
  RegionBreakdown,
  TenantSummary,
  OrgUnitSummary,
} from '@shared/schema';
import type { CloudProvider, OrgUnit } from './provider-config';
import { getProviderConfig, getServiceInfo, getRegionNames } from './provider-config';

export const mockTenants: Tenant[] = [
  { id: 'tenant-1', name: 'Dangote Industries', industry: 'Manufacturing', country: 'Nigeria', contactName: 'Chidi Okonkwo', contactEmail: 'chidi.okonkwo@dangote.com', budget: 250000, efficiencyScore: 78, status: 'active' },
  { id: 'tenant-2', name: 'MTN Nigeria', industry: 'Telecommunications', country: 'Nigeria', contactName: 'Amaka Eze', contactEmail: 'amaka.eze@mtn.ng', budget: 500000, efficiencyScore: 85, status: 'active' },
  { id: 'tenant-3', name: 'Flutterwave', industry: 'Fintech', country: 'Nigeria', contactName: 'Oluwaseun Adeyemi', contactEmail: 'oluwaseun@flutterwave.com', budget: 180000, efficiencyScore: 92, status: 'active' },
  { id: 'tenant-4', name: 'Safaricom Kenya', industry: 'Telecommunications', country: 'Kenya', contactName: 'Wanjiku Kamau', contactEmail: 'wanjiku.kamau@safaricom.co.ke', budget: 320000, efficiencyScore: 81, status: 'active' },
  { id: 'tenant-5', name: 'Standard Bank SA', industry: 'Banking', country: 'South Africa', contactName: 'Thabo Molefe', contactEmail: 'thabo.molefe@standardbank.co.za', budget: 420000, efficiencyScore: 75, status: 'active' },
  { id: 'tenant-6', name: 'Andela', industry: 'Technology', country: 'Nigeria', contactName: 'Ngozi Obi', contactEmail: 'ngozi.obi@andela.com', budget: 150000, efficiencyScore: 88, status: 'active' },
  { id: 'tenant-7', name: 'Jumia Group', industry: 'E-commerce', country: 'Nigeria', contactName: 'Emmanuel Nwosu', contactEmail: 'emmanuel.nwosu@jumia.com', budget: 280000, efficiencyScore: 72, status: 'active' },
  { id: 'tenant-8', name: 'Interswitch', industry: 'Fintech', country: 'Nigeria', contactName: 'Chioma Ikenna', contactEmail: 'chioma.ikenna@interswitch.com', budget: 200000, efficiencyScore: 84, status: 'active' },
];

export function getOrgUnits(provider: CloudProvider): OrgUnit[] {
  return getProviderConfig(provider).orgUnits;
}

export function generateCostTrend(tenantId: string | 'all', provider: CloudProvider = 'huawei'): CostTrendPoint[] {
  const data: CostTrendPoint[] = [];
  const today = new Date();

  let baseAmount = tenantId === 'all' ? 45000 : 8000;
  const variance = tenantId === 'all' ? 8000 : 1500;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1;

    const randomVariance = (Math.random() - 0.5) * variance;
    const trendGrowth = (30 - i) * 50;

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

    const forecastGrowth = i * 80;
    const forecast = lastAmount + forecastGrowth + (Math.random() - 0.5) * 500;

    data.push({
      date: date.toISOString().split('T')[0],
      amount: 0,
      forecast: Math.round(forecast * 100) / 100,
    });
  }

  return data;
}

export function generateServiceBreakdown(tenantId: string | 'all', provider: CloudProvider = 'huawei'): ServiceBreakdown[] {
  const config = getProviderConfig(provider);
  const services = config.services;

  const baseCosts: number[] = [45000, 28000, 15000, 12000, 8500, 5200, 9800, 3200, 4500, 6800, 7200, 11000, 2800, 3500, 18000, 14000, 9500, 4200];

  const multiplier = tenantId === 'all' ? 1 : 0.15;

  const breakdown = services.map((service, i) => {
    const baseCost = baseCosts[i % baseCosts.length];
    const variance = (Math.random() - 0.3) * baseCost * 0.4;
    const cost = Math.max(100, (baseCost + variance) * multiplier);
    const trend = (Math.random() - 0.4) * 25;
    const resourceCount = Math.floor(cost / 500) + Math.floor(Math.random() * 10);

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

export function generateRegionBreakdown(tenantId: string | 'all', provider: CloudProvider = 'huawei'): RegionBreakdown[] {
  const config = getProviderConfig(provider);
  const regions = config.regions;

  const baseCosts: number[] = [65000, 42000, 35000, 28000, 18000, 15000, 8000, 5000];

  const multiplier = tenantId === 'all' ? 1 : 0.15;

  const breakdown = regions.map((region, i) => {
    const baseCost = baseCosts[i % baseCosts.length];
    const variance = (Math.random() - 0.3) * baseCost * 0.3;
    const cost = Math.max(500, (baseCost + variance) * multiplier);
    const resourceCount = Math.floor(cost / 800) + Math.floor(Math.random() * 15);

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

export function generateKPIs(tenantId: string | 'all', provider: CloudProvider = 'huawei'): DashboardKPIs {
  const isAll = tenantId === 'all';
  const multiplier = isAll ? 1 : 0.15;
  const orgUnits = getOrgUnits(provider);

  const totalSpend = (185000 + Math.random() * 30000) * multiplier;
  const previousSpend = totalSpend * (0.88 + Math.random() * 0.08);
  const spendGrowthRate = ((totalSpend - previousSpend) / previousSpend) * 100;

  const totalBudget = isAll ? 2300000 : orgUnits.find(u => u.id === tenantId)?.budget || 200000;
  const budgetUsed = (totalSpend / totalBudget) * 100;

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    previousSpend: Math.round(previousSpend * 100) / 100,
    spendGrowthRate: Math.round(spendGrowthRate * 10) / 10,
    budgetUsed: Math.round(budgetUsed * 10) / 10,
    totalBudget,
    activeResources: Math.floor(isAll ? 847 : 120 + Math.random() * 50),
    optimizationOpportunities: Math.floor(isAll ? 156 : 18 + Math.random() * 12),
    potentialSavings: Math.round((totalSpend * (0.12 + Math.random() * 0.08)) * 100) / 100,
    averageEfficiency: Math.round((75 + Math.random() * 18) * 10) / 10,
    costPerResource: Math.round((totalSpend / (isAll ? 847 : 150)) * 100) / 100,
  };
}

function getProviderRecommendations(tenantId: string | 'all', provider: CloudProvider): Recommendation[] {
  const orgUnits = getOrgUnits(provider);
  const getTid = (index: number) => tenantId === 'all' ? orgUnits[index % orgUnits.length].id : tenantId;
  const config = getProviderConfig(provider);
  const services = config.services;

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
  const recommendations = getProviderRecommendations(tenantId, provider);

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
  return `${service.toLowerCase()}-`;
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
  const huaweiTypes: Record<string, string> = { 'ECS': 's6.xlarge.4', 'RDS': 'mysql.x1.large.4' };
  return huaweiTypes[service] || 'standard';
}

export function generateResources(tenantId: string | 'all', provider: CloudProvider = 'huawei'): Resource[] {
  const config = getProviderConfig(provider);
  const services = config.services.slice(0, 8);
  const regions = config.regions.slice(0, 4);
  const orgUnits = getOrgUnits(provider);

  const resources: Resource[] = [];
  const resourceCount = tenantId === 'all' ? 50 : 15;

  for (let i = 0; i < resourceCount; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const tId = tenantId === 'all' ? orgUnits[Math.floor(Math.random() * orgUnits.length)].id : tenantId;
    const prefix = getResourceNamePrefix(provider, service);
    const envSuffix = ['prod', 'staging', 'dev'][Math.floor(Math.random() * 3)];

    let name: string;
    if (provider === 'aws' && (service === 'EC2' || service === 'EBS')) {
      name = `${prefix}${Math.random().toString(16).substr(2, 8)}`;
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
      status: Math.random() > 0.1 ? 'running' : 'stopped',
      cpuUtilization: Math.round(Math.random() * 100),
      memoryUtilization: Math.round(Math.random() * 100),
      networkUtilization: Math.round(Math.random() * 100),
      diskUtilization: Math.round(Math.random() * 100),
      monthlyCost: Math.round((50 + Math.random() * 500) * 100) / 100,
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return resources;
}

export function generateTenantSummaries(): TenantSummary[] {
  return mockTenants.map(tenant => {
    const kpis = generateKPIs(tenant.id, 'huawei');
    const services = generateServiceBreakdown(tenant.id, 'huawei');
    const recommendations = generateRecommendations(tenant.id, 'huawei');

    return {
      tenant,
      totalSpend: kpis.totalSpend,
      budgetUsage: kpis.budgetUsed,
      efficiencyScore: tenant.efficiencyScore,
      topService: services[0]?.service || 'ECS',
      recommendationCount: recommendations.length,
    };
  });
}

export function generateOrgUnitSummaries(provider: CloudProvider): OrgUnitSummary[] {
  const orgUnits = getOrgUnits(provider);
  return orgUnits.map(orgUnit => {
    const kpis = generateKPIs(orgUnit.id, provider);
    const services = generateServiceBreakdown(orgUnit.id, provider);
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
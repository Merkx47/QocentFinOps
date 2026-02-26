import type {
  Tenant,
  CostRecord,
  Resource,
  Recommendation,
  DashboardKPIs,
  CostTrendPoint,
  ServiceBreakdown,
  RegionBreakdown,
  TenantSummary,
  HuaweiService,
  HuaweiRegion,
  RecommendationType,
  RecommendationImpact,
} from '@shared/schema';

// Nigerian/African context tenant names
export const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Dangote Industries',
    industry: 'Manufacturing',
    country: 'Nigeria',
    contactName: 'Chidi Okonkwo',
    contactEmail: 'chidi.okonkwo@dangote.com',
    budget: 250000,
    efficiencyScore: 78,
    status: 'active',
  },
  {
    id: 'tenant-2',
    name: 'MTN Nigeria',
    industry: 'Telecommunications',
    country: 'Nigeria',
    contactName: 'Amaka Eze',
    contactEmail: 'amaka.eze@mtn.ng',
    budget: 500000,
    efficiencyScore: 85,
    status: 'active',
  },
  {
    id: 'tenant-3',
    name: 'Flutterwave',
    industry: 'Fintech',
    country: 'Nigeria',
    contactName: 'Oluwaseun Adeyemi',
    contactEmail: 'oluwaseun@flutterwave.com',
    budget: 180000,
    efficiencyScore: 92,
    status: 'active',
  },
  {
    id: 'tenant-4',
    name: 'Safaricom Kenya',
    industry: 'Telecommunications',
    country: 'Kenya',
    contactName: 'Wanjiku Kamau',
    contactEmail: 'wanjiku.kamau@safaricom.co.ke',
    budget: 320000,
    efficiencyScore: 81,
    status: 'active',
  },
  {
    id: 'tenant-5',
    name: 'Standard Bank SA',
    industry: 'Banking',
    country: 'South Africa',
    contactName: 'Thabo Molefe',
    contactEmail: 'thabo.molefe@standardbank.co.za',
    budget: 420000,
    efficiencyScore: 75,
    status: 'active',
  },
  {
    id: 'tenant-6',
    name: 'Andela',
    industry: 'Technology',
    country: 'Nigeria',
    contactName: 'Ngozi Obi',
    contactEmail: 'ngozi.obi@andela.com',
    budget: 150000,
    efficiencyScore: 88,
    status: 'active',
  },
  {
    id: 'tenant-7',
    name: 'Jumia Group',
    industry: 'E-commerce',
    country: 'Nigeria',
    contactName: 'Emmanuel Nwosu',
    contactEmail: 'emmanuel.nwosu@jumia.com',
    budget: 280000,
    efficiencyScore: 72,
    status: 'active',
  },
  {
    id: 'tenant-8',
    name: 'Interswitch',
    industry: 'Fintech',
    country: 'Nigeria',
    contactName: 'Chioma Ikenna',
    contactEmail: 'chioma.ikenna@interswitch.com',
    budget: 200000,
    efficiencyScore: 84,
    status: 'active',
  },
];

// Generate cost trend data (last 30 days)
export function generateCostTrend(tenantId: string | 'all'): CostTrendPoint[] {
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
  
  // Add forecast for next 7 days
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

// Service breakdown data
export function generateServiceBreakdown(tenantId: string | 'all'): ServiceBreakdown[] {
  const services: { service: HuaweiService; baseCost: number }[] = [
    { service: 'ECS', baseCost: 45000 },
    { service: 'RDS', baseCost: 28000 },
    { service: 'OBS', baseCost: 15000 },
    { service: 'EVS', baseCost: 12000 },
    { service: 'ELB', baseCost: 8500 },
    { service: 'VPC', baseCost: 5200 },
    { service: 'CDN', baseCost: 9800 },
    { service: 'NAT', baseCost: 3200 },
    { service: 'WAF', baseCost: 4500 },
    { service: 'DCS', baseCost: 6800 },
    { service: 'DDS', baseCost: 7200 },
    { service: 'GaussDB', baseCost: 11000 },
    { service: 'FunctionGraph', baseCost: 2800 },
    { service: 'APIG', baseCost: 3500 },
    { service: 'CCE', baseCost: 18000 },
    { service: 'ModelArts', baseCost: 14000 },
    { service: 'DWS', baseCost: 9500 },
    { service: 'CSS', baseCost: 4200 },
  ];
  
  const multiplier = tenantId === 'all' ? 1 : 0.15;
  
  const breakdown = services.map(({ service, baseCost }) => {
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

// Region breakdown data
export function generateRegionBreakdown(tenantId: string | 'all'): RegionBreakdown[] {
  const regions: { region: HuaweiRegion; baseCost: number }[] = [
    { region: 'af-south-1', baseCost: 65000 },
    { region: 'eu-west-0', baseCost: 42000 },
    { region: 'ap-southeast-1', baseCost: 35000 },
    { region: 'ap-southeast-3', baseCost: 28000 },
    { region: 'me-east-1', baseCost: 18000 },
    { region: 'cn-north-4', baseCost: 15000 },
    { region: 'na-mexico-1', baseCost: 8000 },
    { region: 'la-south-2', baseCost: 5000 },
  ];
  
  const multiplier = tenantId === 'all' ? 1 : 0.15;
  
  const breakdown = regions.map(({ region, baseCost }) => {
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

// Generate KPIs
export function generateKPIs(tenantId: string | 'all'): DashboardKPIs {
  const isAll = tenantId === 'all';
  const multiplier = isAll ? 1 : 0.15;
  
  const totalSpend = (185000 + Math.random() * 30000) * multiplier;
  const previousSpend = totalSpend * (0.88 + Math.random() * 0.08);
  const spendGrowthRate = ((totalSpend - previousSpend) / previousSpend) * 100;
  
  const totalBudget = isAll ? 2300000 : mockTenants.find(t => t.id === tenantId)?.budget || 200000;
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

// Generate recommendations
export function generateRecommendations(tenantId: string | 'all'): Recommendation[] {
  const types: RecommendationType[] = [
    'rightsizing', 'idle_resource', 'reserved_instance', 
    'storage_optimization', 'network_optimization', 'database_tuning'
  ];
  
  const impacts: RecommendationImpact[] = ['high', 'medium', 'low'];
  const efforts: ('easy' | 'moderate' | 'complex')[] = ['easy', 'moderate', 'complex'];
  
  const recommendations: Recommendation[] = [
    {
      id: 'rec-1',
      tenantId: tenantId === 'all' ? 'tenant-1' : tenantId,
      type: 'rightsizing',
      title: 'Downsize ECS Instance ecs-prod-web-01',
      description: 'This instance has averaged 12% CPU utilization over the past 30 days. Consider downsizing from s6.xlarge.4 to s6.large.2 to save costs.',
      resourceId: 'ecs-prod-web-01',
      resourceName: 'ecs-prod-web-01',
      service: 'ECS',
      currentCost: 458.50,
      projectedSavings: 183.40,
      impact: 'high',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-2',
      tenantId: tenantId === 'all' ? 'tenant-2' : tenantId,
      type: 'idle_resource',
      title: 'Terminate Idle RDS Instance rds-staging-db',
      description: 'This RDS instance has had zero connections for 21 days. Consider terminating or snapshotting and removing.',
      resourceId: 'rds-staging-db',
      resourceName: 'rds-staging-db',
      service: 'RDS',
      currentCost: 324.00,
      projectedSavings: 324.00,
      impact: 'high',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-3',
      tenantId: tenantId === 'all' ? 'tenant-3' : tenantId,
      type: 'reserved_instance',
      title: 'Purchase Reserved Instance for ECS Cluster',
      description: 'Your ECS cluster has stable usage patterns. Purchasing 1-year reserved instances could save 35% on compute costs.',
      resourceId: 'ecs-cluster-prod',
      resourceName: 'Production ECS Cluster',
      service: 'ECS',
      currentCost: 2840.00,
      projectedSavings: 994.00,
      impact: 'high',
      effort: 'moderate',
      status: 'new',
    },
    {
      id: 'rec-4',
      tenantId: tenantId === 'all' ? 'tenant-4' : tenantId,
      type: 'storage_optimization',
      title: 'Move Cold Data to OBS Standard-IA',
      description: 'Analysis shows 2.4TB of data in OBS Standard that hasn\'t been accessed in 90+ days. Moving to Standard-IA could reduce costs by 40%.',
      resourceId: 'obs-bucket-archive',
      resourceName: 'obs-bucket-archive',
      service: 'OBS',
      currentCost: 156.00,
      projectedSavings: 62.40,
      impact: 'medium',
      effort: 'easy',
      status: 'in_progress',
    },
    {
      id: 'rec-5',
      tenantId: tenantId === 'all' ? 'tenant-5' : tenantId,
      type: 'network_optimization',
      title: 'Optimize CDN Cache Rules',
      description: 'Your CDN has a 45% cache hit ratio. Optimizing cache rules could improve this to 85% and reduce origin traffic costs.',
      resourceId: 'cdn-domain-main',
      resourceName: 'cdn-domain-main',
      service: 'CDN',
      currentCost: 890.00,
      projectedSavings: 356.00,
      impact: 'medium',
      effort: 'moderate',
      status: 'new',
    },
    {
      id: 'rec-6',
      tenantId: tenantId === 'all' ? 'tenant-6' : tenantId,
      type: 'database_tuning',
      title: 'Enable RDS Read Replicas',
      description: 'High read workload detected on primary RDS. Adding read replicas would improve performance and enable smaller primary instance.',
      resourceId: 'rds-prod-primary',
      resourceName: 'rds-prod-primary',
      service: 'RDS',
      currentCost: 1240.00,
      projectedSavings: 372.00,
      impact: 'high',
      effort: 'complex',
      status: 'new',
    },
    {
      id: 'rec-7',
      tenantId: tenantId === 'all' ? 'tenant-7' : tenantId,
      type: 'idle_resource',
      title: 'Delete Unattached EVS Volumes',
      description: '8 EVS volumes totaling 1.6TB are not attached to any instance. Delete or snapshot these to eliminate waste.',
      resourceId: 'evs-unattached-group',
      resourceName: 'Unattached EVS Volumes',
      service: 'EVS',
      currentCost: 128.00,
      projectedSavings: 128.00,
      impact: 'medium',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-8',
      tenantId: tenantId === 'all' ? 'tenant-8' : tenantId,
      type: 'rightsizing',
      title: 'Scale Down DCS Instance',
      description: 'Redis cache memory utilization averages 18%. Consider scaling from 16GB to 8GB instance.',
      resourceId: 'dcs-redis-prod',
      resourceName: 'dcs-redis-prod',
      service: 'DCS',
      currentCost: 385.00,
      projectedSavings: 192.50,
      impact: 'medium',
      effort: 'easy',
      status: 'new',
    },
    {
      id: 'rec-9',
      tenantId: tenantId === 'all' ? 'tenant-1' : tenantId,
      type: 'reserved_instance',
      title: 'GaussDB Reserved Capacity',
      description: 'Your GaussDB usage has been consistent. Reserved capacity purchase could yield 25% savings.',
      resourceId: 'gaussdb-cluster',
      resourceName: 'gaussdb-cluster',
      service: 'GaussDB',
      currentCost: 2100.00,
      projectedSavings: 525.00,
      impact: 'high',
      effort: 'moderate',
      status: 'new',
    },
    {
      id: 'rec-10',
      tenantId: tenantId === 'all' ? 'tenant-2' : tenantId,
      type: 'network_optimization',
      title: 'Consolidate NAT Gateways',
      description: 'Multiple NAT gateways detected in same VPC. Consolidating to single gateway could reduce costs.',
      resourceId: 'nat-gateway-group',
      resourceName: 'VPC NAT Gateways',
      service: 'NAT',
      currentCost: 245.00,
      projectedSavings: 122.50,
      impact: 'low',
      effort: 'moderate',
      status: 'new',
    },
  ];
  
  if (tenantId !== 'all') {
    return recommendations.filter(r => r.tenantId === tenantId).slice(0, 5);
  }
  
  return recommendations;
}

// Generate resources with utilization data
export function generateResources(tenantId: string | 'all'): Resource[] {
  const services: HuaweiService[] = ['ECS', 'RDS', 'OBS', 'EVS', 'ELB', 'DCS', 'GaussDB', 'CCE'];
  const regions: HuaweiRegion[] = ['af-south-1', 'eu-west-0', 'ap-southeast-1', 'ap-southeast-3'];
  
  const resources: Resource[] = [];
  const resourceCount = tenantId === 'all' ? 50 : 15;
  
  for (let i = 0; i < resourceCount; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const tId = tenantId === 'all' ? mockTenants[Math.floor(Math.random() * mockTenants.length)].id : tenantId;
    
    resources.push({
      id: `resource-${i + 1}`,
      tenantId: tId,
      name: `${service.toLowerCase()}-${['prod', 'staging', 'dev'][Math.floor(Math.random() * 3)]}-${String(i + 1).padStart(2, '0')}`,
      service,
      region,
      type: service === 'ECS' ? 's6.xlarge.4' : service === 'RDS' ? 'mysql.x1.large.4' : 'standard',
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

// Tenant summaries for comparison view
export function generateTenantSummaries(): TenantSummary[] {
  return mockTenants.map(tenant => {
    const kpis = generateKPIs(tenant.id);
    const services = generateServiceBreakdown(tenant.id);
    const recommendations = generateRecommendations(tenant.id);
    
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

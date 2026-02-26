export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'huawei';

export interface OrgUnit {
  id: string;
  name: string;
  description: string;
  environment: string;
  primaryRegion: string;
  contactName: string;
  contactEmail: string;
  budget: number;
  efficiencyScore: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ProviderConfig {
  id: CloudProvider;
  name: string;
  shortName: string;
  tagline: string;
  colors: {
    primary: string;
    primaryHSL: string;
    accent: string;
    gradient: string;
    chartPrimary: string;
    chartPalette: string[];
  };
  services: string[];
  regions: string[];
  hierarchy: {
    orgUnitLabel: string;
    orgUnitLabelPlural: string;
    allUnitsLabel: string;
    selectorLabel: string;
    managementPageTitle: string;
    managementPageSubtitle: string;
    comparisonTitle: string;
    addButtonLabel: string;
  };
  terminology: {
    computeUnit: string;
    storageUnit: string;
    costTool: string;
    savingsMechanism: string;
    recommendationSource: string;
    ssoName: string;
    ssoButtonLabel: string;
    monitoring: string;
  };
  orgUnits: OrgUnit[];
  recommendationTypes: { type: string; label: string }[];
}

const awsConfig: ProviderConfig = {
  id: 'aws',
  name: 'Amazon Web Services',
  shortName: 'AWS',
  tagline: 'Cloud Computing Services',
  colors: {
    primary: '#FF9900',
    primaryHSL: '36 100% 50%',
    accent: '#232F3E',
    gradient: 'linear-gradient(135deg, #FF9900, #FF6600)',
    chartPrimary: '#FF9900',
    chartPalette: ['#FF9900', '#232F3E', '#569A31', '#3B48CC', '#8C4FFF', '#DD344C', '#01A88D', '#FF6600'],
  },
  services: ['EC2', 'S3', 'RDS', 'Lambda', 'EKS', 'DynamoDB', 'CloudFront', 'ELB', 'ElastiCache', 'Redshift', 'SageMaker', 'EBS', 'VPC', 'Route53', 'SNS', 'SQS', 'ECS', 'EMR'],
  regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1', 'sa-east-1', 'ca-central-1'],
  hierarchy: {
    orgUnitLabel: 'Account',
    orgUnitLabelPlural: 'Accounts',
    allUnitsLabel: 'All Accounts',
    selectorLabel: 'Select Account',
    managementPageTitle: 'Account Management',
    managementPageSubtitle: 'Manage and monitor your AWS member accounts',
    comparisonTitle: 'Account Comparison',
    addButtonLabel: 'Add Account',
  },
  terminology: {
    computeUnit: 'EC2 Instance',
    storageUnit: 'S3 Bucket',
    costTool: 'Cost Explorer',
    savingsMechanism: 'Savings Plans',
    recommendationSource: 'Trusted Advisor',
    ssoName: 'AWS IAM Identity Center',
    ssoButtonLabel: 'Sign in with AWS IAM Identity Center',
    monitoring: 'CloudWatch',
  },
  orgUnits: [
    { id: 'acct-001', name: 'Production Workloads', description: 'Primary production environment', environment: 'Prod', primaryRegion: 'us-east-1', contactName: 'Sarah Chen', contactEmail: 'sarah.chen@company.com', budget: 350000, efficiencyScore: 82, status: 'active' },
    { id: 'acct-002', name: 'Development & Testing', description: 'Dev/Test environments', environment: 'Dev/Test', primaryRegion: 'us-west-2', contactName: 'James Wilson', contactEmail: 'james.wilson@company.com', budget: 120000, efficiencyScore: 71, status: 'active' },
    { id: 'acct-003', name: 'Data Analytics', description: 'Analytics and data pipelines', environment: 'Analytics', primaryRegion: 'us-east-1', contactName: 'Priya Patel', contactEmail: 'priya.patel@company.com', budget: 280000, efficiencyScore: 88, status: 'active' },
    { id: 'acct-004', name: 'Machine Learning', description: 'ML training and inference', environment: 'ML/AI', primaryRegion: 'us-west-2', contactName: 'David Kim', contactEmail: 'david.kim@company.com', budget: 400000, efficiencyScore: 76, status: 'active' },
    { id: 'acct-005', name: 'Security & Compliance', description: 'Security tools and logging', environment: 'Security', primaryRegion: 'us-east-1', contactName: 'Maria Garcia', contactEmail: 'maria.garcia@company.com', budget: 95000, efficiencyScore: 91, status: 'active' },
    { id: 'acct-006', name: 'Shared Services', description: 'Shared platform infrastructure', environment: 'Platform', primaryRegion: 'eu-west-1', contactName: 'Tom Brown', contactEmail: 'tom.brown@company.com', budget: 200000, efficiencyScore: 84, status: 'active' },
    { id: 'acct-007', name: 'Mobile Backend', description: 'Mobile app backend services', environment: 'App', primaryRegion: 'ap-southeast-1', contactName: 'Lisa Wang', contactEmail: 'lisa.wang@company.com', budget: 150000, efficiencyScore: 79, status: 'active' },
    { id: 'acct-008', name: 'Disaster Recovery', description: 'DR and backup systems', environment: 'DR', primaryRegion: 'eu-central-1', contactName: 'Robert Taylor', contactEmail: 'robert.taylor@company.com', budget: 80000, efficiencyScore: 87, status: 'active' },
  ],
  recommendationTypes: [
    { type: 'rightsizing', label: 'Rightsizing' },
    { type: 'idle_resource', label: 'Idle Resources' },
    { type: 'savings_plans', label: 'Savings Plans' },
    { type: 'reserved_instance', label: 'Reserved Instances' },
    { type: 'storage_optimization', label: 'S3 Storage Class' },
    { type: 'ebs_optimization', label: 'EBS Optimization' },
  ],
};

const azureConfig: ProviderConfig = {
  id: 'azure',
  name: 'Microsoft Azure',
  shortName: 'Azure',
  tagline: 'Cloud Computing Platform',
  colors: {
    primary: '#0078D4',
    primaryHSL: '206 100% 42%',
    accent: '#50E6FF',
    gradient: 'linear-gradient(135deg, #0078D4, #50E6FF)',
    chartPrimary: '#0078D4',
    chartPalette: ['#0078D4', '#50E6FF', '#E8731A', '#3999C6', '#326DE6', '#F2C811', '#A4262C', '#10A37F'],
  },
  services: ['Virtual Machines', 'Blob Storage', 'SQL Database', 'App Service', 'AKS', 'Cosmos DB', 'Azure CDN', 'Load Balancer', 'Redis Cache', 'Synapse', 'Azure ML', 'Managed Disks', 'Virtual Network', 'Azure DNS', 'Service Bus', 'Functions', 'Container Instances', 'HDInsight'],
  regions: ['eastus', 'westeurope', 'uksouth', 'northeurope', 'eastus2', 'southeastasia', 'japaneast', 'australiaeast'],
  hierarchy: {
    orgUnitLabel: 'Subscription',
    orgUnitLabelPlural: 'Subscriptions',
    allUnitsLabel: 'All Subscriptions',
    selectorLabel: 'Select Subscription',
    managementPageTitle: 'Subscription Management',
    managementPageSubtitle: 'Manage and monitor your Azure subscriptions',
    comparisonTitle: 'Subscription Comparison',
    addButtonLabel: 'Add Subscription',
  },
  terminology: {
    computeUnit: 'Virtual Machine',
    storageUnit: 'Storage Account',
    costTool: 'Cost Management',
    savingsMechanism: 'Reserved Instances',
    recommendationSource: 'Azure Advisor',
    ssoName: 'Microsoft Entra ID',
    ssoButtonLabel: 'Sign in with Microsoft Entra ID',
    monitoring: 'Azure Monitor',
  },
  orgUnits: [
    { id: 'sub-001', name: 'Production - Europe', description: 'European production workloads', environment: 'Prod', primaryRegion: 'westeurope', contactName: 'Emma Schmidt', contactEmail: 'emma.schmidt@company.com', budget: 300000, efficiencyScore: 80, status: 'active' },
    { id: 'sub-002', name: 'Production - US', description: 'US production workloads', environment: 'Prod', primaryRegion: 'eastus', contactName: 'Michael Johnson', contactEmail: 'michael.johnson@company.com', budget: 380000, efficiencyScore: 83, status: 'active' },
    { id: 'sub-003', name: 'Development', description: 'Development environment', environment: 'Dev', primaryRegion: 'westeurope', contactName: 'Sophie Martin', contactEmail: 'sophie.martin@company.com', budget: 100000, efficiencyScore: 69, status: 'active' },
    { id: 'sub-004', name: 'Testing & QA', description: 'QA and testing environment', environment: 'QA', primaryRegion: 'uksouth', contactName: 'Daniel Lee', contactEmail: 'daniel.lee@company.com', budget: 85000, efficiencyScore: 74, status: 'active' },
    { id: 'sub-005', name: 'Data Platform', description: 'Analytics and data platform', environment: 'Analytics', primaryRegion: 'northeurope', contactName: 'Anna Kowalski', contactEmail: 'anna.kowalski@company.com', budget: 250000, efficiencyScore: 86, status: 'active' },
    { id: 'sub-006', name: 'AI & Machine Learning', description: 'ML training and AI services', environment: 'AI/ML', primaryRegion: 'eastus2', contactName: 'Chris Park', contactEmail: 'chris.park@company.com', budget: 320000, efficiencyScore: 77, status: 'active' },
    { id: 'sub-007', name: 'Shared Infrastructure', description: 'Shared platform services', environment: 'Platform', primaryRegion: 'westeurope', contactName: 'Laura Rossi', contactEmail: 'laura.rossi@company.com', budget: 180000, efficiencyScore: 85, status: 'active' },
    { id: 'sub-008', name: 'Disaster Recovery', description: 'DR and business continuity', environment: 'DR', primaryRegion: 'southeastasia', contactName: 'Kevin Tan', contactEmail: 'kevin.tan@company.com', budget: 70000, efficiencyScore: 90, status: 'active' },
  ],
  recommendationTypes: [
    { type: 'rightsizing', label: 'Rightsizing' },
    { type: 'idle_resource', label: 'Idle Resources' },
    { type: 'reserved_instance', label: 'Reserved Instances' },
    { type: 'hybrid_benefit', label: 'Hybrid Benefit' },
    { type: 'storage_optimization', label: 'Storage Tier' },
    { type: 'spot_vms', label: 'Spot VMs' },
  ],
};

const gcpConfig: ProviderConfig = {
  id: 'gcp',
  name: 'Google Cloud Platform',
  shortName: 'GCP',
  tagline: 'Cloud Computing Services',
  colors: {
    primary: '#4285F4',
    primaryHSL: '217 89% 61%',
    accent: '#34A853',
    gradient: 'linear-gradient(135deg, #4285F4, #669DF6)',
    chartPrimary: '#4285F4',
    chartPalette: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#669DF6', '#F4B400', '#0F9D58', '#AB47BC'],
  },
  services: ['Compute Engine', 'Cloud Storage', 'Cloud SQL', 'Cloud Functions', 'GKE', 'BigQuery', 'Cloud CDN', 'Cloud Load Balancing', 'Memorystore', 'Dataflow', 'Vertex AI', 'Persistent Disk', 'VPC', 'Cloud DNS', 'Pub/Sub', 'Cloud Run', 'Anthos', 'Dataproc'],
  regions: ['us-central1', 'us-east1', 'europe-west1', 'europe-west2', 'asia-southeast1', 'asia-northeast1', 'southamerica-east1', 'us-west1'],
  hierarchy: {
    orgUnitLabel: 'Project',
    orgUnitLabelPlural: 'Projects',
    allUnitsLabel: 'All Projects',
    selectorLabel: 'Select Project',
    managementPageTitle: 'Project Management',
    managementPageSubtitle: 'Manage and monitor your GCP projects',
    comparisonTitle: 'Project Comparison',
    addButtonLabel: 'Add Project',
  },
  terminology: {
    computeUnit: 'VM Instance',
    storageUnit: 'Cloud Storage Bucket',
    costTool: 'Billing Reports',
    savingsMechanism: 'Committed Use Discounts',
    recommendationSource: 'Recommender API',
    ssoName: 'Google Cloud Identity',
    ssoButtonLabel: 'Sign in with Google Cloud Identity',
    monitoring: 'Cloud Monitoring',
  },
  orgUnits: [
    { id: 'proj-001', name: 'production-web-app', description: 'Production web application', environment: 'Prod Web', primaryRegion: 'us-central1', contactName: 'Alex Rivera', contactEmail: 'alex.rivera@company.com', budget: 280000, efficiencyScore: 85, status: 'active' },
    { id: 'proj-002', name: 'production-api', description: 'Production API services', environment: 'Prod API', primaryRegion: 'us-east1', contactName: 'Nina Sharma', contactEmail: 'nina.sharma@company.com', budget: 220000, efficiencyScore: 81, status: 'active' },
    { id: 'proj-003', name: 'data-analytics-prod', description: 'Analytics and BigQuery', environment: 'Analytics', primaryRegion: 'us-central1', contactName: 'Marcus Chen', contactEmail: 'marcus.chen@company.com', budget: 350000, efficiencyScore: 89, status: 'active' },
    { id: 'proj-004', name: 'ml-training-platform', description: 'ML training pipelines', environment: 'ML/AI', primaryRegion: 'us-west1', contactName: 'Yuki Tanaka', contactEmail: 'yuki.tanaka@company.com', budget: 420000, efficiencyScore: 73, status: 'active' },
    { id: 'proj-005', name: 'dev-environment', description: 'Development workspace', environment: 'Dev', primaryRegion: 'europe-west1', contactName: 'Luca Bianchi', contactEmail: 'luca.bianchi@company.com', budget: 90000, efficiencyScore: 68, status: 'active' },
    { id: 'proj-006', name: 'staging-environment', description: 'Staging and pre-prod', environment: 'Staging', primaryRegion: 'europe-west2', contactName: 'Fatima Al-Hassan', contactEmail: 'fatima.alhassan@company.com', budget: 75000, efficiencyScore: 72, status: 'active' },
    { id: 'proj-007', name: 'shared-infrastructure', description: 'Shared platform services', environment: 'Platform', primaryRegion: 'us-central1', contactName: 'Ryan Murphy', contactEmail: 'ryan.murphy@company.com', budget: 160000, efficiencyScore: 86, status: 'active' },
    { id: 'proj-008', name: 'mobile-backend', description: 'Mobile app backend', environment: 'Mobile', primaryRegion: 'asia-southeast1', contactName: 'Wei Zhang', contactEmail: 'wei.zhang@company.com', budget: 130000, efficiencyScore: 78, status: 'active' },
  ],
  recommendationTypes: [
    { type: 'rightsizing', label: 'Rightsizing' },
    { type: 'idle_resource', label: 'Idle Resources' },
    { type: 'committed_use', label: 'Committed Use Discounts' },
    { type: 'sustained_use', label: 'Sustained Use Discounts' },
    { type: 'spot_vms', label: 'Spot VMs' },
    { type: 'storage_optimization', label: 'Storage Class' },
  ],
};

const huaweiConfig: ProviderConfig = {
  id: 'huawei',
  name: 'Huawei Cloud',
  shortName: 'Huawei',
  tagline: 'Huawei Cloud',
  colors: {
    primary: '#C8102E',
    primaryHSL: '350 85% 42%',
    accent: '#FF0000',
    gradient: 'linear-gradient(135deg, #FF0000, #C8102E)',
    chartPrimary: '#C8102E',
    chartPalette: ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#D81B60', '#5E35B1'],
  },
  services: ['ECS', 'RDS', 'OBS', 'EVS', 'ELB', 'VPC', 'CDN', 'NAT', 'WAF', 'DCS', 'DDS', 'GaussDB', 'FunctionGraph', 'APIG', 'SMN', 'CTS', 'CCE', 'SWR', 'ModelArts', 'DWS', 'CSS', 'MRS', 'DLI'],
  regions: ['af-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'cn-north-4', 'cn-east-3', 'eu-west-0', 'la-south-2', 'me-east-1', 'na-mexico-1'],
  hierarchy: {
    orgUnitLabel: 'Tenant',
    orgUnitLabelPlural: 'Tenants',
    allUnitsLabel: 'All Tenants',
    selectorLabel: 'Select Tenant',
    managementPageTitle: 'Tenant Management',
    managementPageSubtitle: 'Manage and monitor your enterprise project tenants',
    comparisonTitle: 'Tenant Comparison',
    addButtonLabel: 'Add Tenant',
  },
  terminology: {
    computeUnit: 'ECS Instance',
    storageUnit: 'OBS Bucket',
    costTool: 'Cost Center',
    savingsMechanism: 'Reserved Instances',
    recommendationSource: 'BSS Optimization',
    ssoName: 'Huawei Cloud IAM Identity Center',
    ssoButtonLabel: 'Sign in with Huawei Cloud IAM Identity Center',
    monitoring: 'Cloud Eye (CES)',
  },
  orgUnits: [
    { id: 'tenant-1', name: 'Dangote Industries', description: 'Manufacturing', environment: 'Manufacturing', primaryRegion: 'af-south-1', contactName: 'Chidi Okonkwo', contactEmail: 'chidi.okonkwo@dangote.com', budget: 250000, efficiencyScore: 78, status: 'active' },
    { id: 'tenant-2', name: 'MTN Nigeria', description: 'Telecommunications', environment: 'Telecommunications', primaryRegion: 'af-south-1', contactName: 'Amaka Eze', contactEmail: 'amaka.eze@mtn.ng', budget: 500000, efficiencyScore: 85, status: 'active' },
    { id: 'tenant-3', name: 'Flutterwave', description: 'Fintech', environment: 'Fintech', primaryRegion: 'eu-west-0', contactName: 'Oluwaseun Adeyemi', contactEmail: 'oluwaseun@flutterwave.com', budget: 180000, efficiencyScore: 92, status: 'active' },
    { id: 'tenant-4', name: 'Safaricom Kenya', description: 'Telecommunications', environment: 'Telecommunications', primaryRegion: 'af-south-1', contactName: 'Wanjiku Kamau', contactEmail: 'wanjiku.kamau@safaricom.co.ke', budget: 320000, efficiencyScore: 81, status: 'active' },
    { id: 'tenant-5', name: 'Standard Bank SA', description: 'Banking', environment: 'Banking', primaryRegion: 'af-south-1', contactName: 'Thabo Molefe', contactEmail: 'thabo.molefe@standardbank.co.za', budget: 420000, efficiencyScore: 75, status: 'active' },
    { id: 'tenant-6', name: 'Andela', description: 'Technology', environment: 'Technology', primaryRegion: 'eu-west-0', contactName: 'Ngozi Obi', contactEmail: 'ngozi.obi@andela.com', budget: 150000, efficiencyScore: 88, status: 'active' },
    { id: 'tenant-7', name: 'Jumia Group', description: 'E-commerce', environment: 'E-commerce', primaryRegion: 'eu-west-0', contactName: 'Emmanuel Nwosu', contactEmail: 'emmanuel.nwosu@jumia.com', budget: 280000, efficiencyScore: 72, status: 'active' },
    { id: 'tenant-8', name: 'Interswitch', description: 'Fintech', environment: 'Fintech', primaryRegion: 'af-south-1', contactName: 'Chioma Ikenna', contactEmail: 'chioma.ikenna@interswitch.com', budget: 200000, efficiencyScore: 84, status: 'active' },
  ],
  recommendationTypes: [
    { type: 'rightsizing', label: 'Rightsizing' },
    { type: 'idle_resource', label: 'Idle Resources' },
    { type: 'reserved_instance', label: 'Reserved Instances' },
    { type: 'storage_optimization', label: 'Storage Optimization' },
    { type: 'network_optimization', label: 'Network Optimization' },
    { type: 'database_tuning', label: 'Database Tuning' },
  ],
};

const providerConfigs: Record<CloudProvider, ProviderConfig> = {
  aws: awsConfig,
  azure: azureConfig,
  gcp: gcpConfig,
  huawei: huaweiConfig,
};

export function getProviderConfig(provider: CloudProvider): ProviderConfig {
  return providerConfigs[provider];
}

export const allProviders: CloudProvider[] = ['aws', 'azure', 'gcp', 'huawei'];

export function getServiceInfo(provider: CloudProvider): Record<string, { name: string; category: string; color: string }> {
  const config = getProviderConfig(provider);
  const palette = config.colors.chartPalette;
  const categories: Record<string, string> = {};

  if (provider === 'aws') {
    Object.assign(categories, {
      'EC2': 'Compute', 'S3': 'Storage', 'RDS': 'Database', 'Lambda': 'Compute',
      'EKS': 'Compute', 'DynamoDB': 'Database', 'CloudFront': 'Network', 'ELB': 'Network',
      'ElastiCache': 'Database', 'Redshift': 'Analytics', 'SageMaker': 'AI',
      'EBS': 'Storage', 'VPC': 'Network', 'Route53': 'Network', 'SNS': 'Application',
      'SQS': 'Application', 'ECS': 'Compute', 'EMR': 'Analytics',
    });
  } else if (provider === 'azure') {
    Object.assign(categories, {
      'Virtual Machines': 'Compute', 'Blob Storage': 'Storage', 'SQL Database': 'Database',
      'App Service': 'Compute', 'AKS': 'Compute', 'Cosmos DB': 'Database',
      'Azure CDN': 'Network', 'Load Balancer': 'Network', 'Redis Cache': 'Database',
      'Synapse': 'Analytics', 'Azure ML': 'AI', 'Managed Disks': 'Storage',
      'Virtual Network': 'Network', 'Azure DNS': 'Network', 'Service Bus': 'Application',
      'Functions': 'Compute', 'Container Instances': 'Compute', 'HDInsight': 'Analytics',
    });
  } else if (provider === 'gcp') {
    Object.assign(categories, {
      'Compute Engine': 'Compute', 'Cloud Storage': 'Storage', 'Cloud SQL': 'Database',
      'Cloud Functions': 'Compute', 'GKE': 'Compute', 'BigQuery': 'Analytics',
      'Cloud CDN': 'Network', 'Cloud Load Balancing': 'Network', 'Memorystore': 'Database',
      'Dataflow': 'Analytics', 'Vertex AI': 'AI', 'Persistent Disk': 'Storage',
      'VPC': 'Network', 'Cloud DNS': 'Network', 'Pub/Sub': 'Application',
      'Cloud Run': 'Compute', 'Anthos': 'Compute', 'Dataproc': 'Analytics',
    });
  }

  const result: Record<string, { name: string; category: string; color: string }> = {};
  config.services.forEach((svc, i) => {
    result[svc] = {
      name: svc,
      category: categories[svc] || 'Other',
      color: palette[i % palette.length],
    };
  });
  return result;
}

export function getRegionNames(provider: CloudProvider): Record<string, string> {
  if (provider === 'aws') {
    return {
      'us-east-1': 'US East (N. Virginia)',
      'us-west-2': 'US West (Oregon)',
      'eu-west-1': 'EU (Ireland)',
      'eu-central-1': 'EU (Frankfurt)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'sa-east-1': 'South America (Sao Paulo)',
      'ca-central-1': 'Canada (Central)',
    };
  } else if (provider === 'azure') {
    return {
      'eastus': 'East US',
      'westeurope': 'West Europe',
      'uksouth': 'UK South',
      'northeurope': 'North Europe',
      'eastus2': 'East US 2',
      'southeastasia': 'Southeast Asia',
      'japaneast': 'Japan East',
      'australiaeast': 'Australia East',
    };
  } else if (provider === 'gcp') {
    return {
      'us-central1': 'US Central (Iowa)',
      'us-east1': 'US East (S. Carolina)',
      'europe-west1': 'Europe West (Belgium)',
      'europe-west2': 'Europe West (London)',
      'asia-southeast1': 'Asia SE (Singapore)',
      'asia-northeast1': 'Asia NE (Tokyo)',
      'southamerica-east1': 'S. America (Sao Paulo)',
      'us-west1': 'US West (Oregon)',
    };
  }
  return {
    'af-south-1': 'Africa-Johannesburg',
    'ap-southeast-1': 'AP-Singapore',
    'ap-southeast-2': 'AP-Bangkok',
    'ap-southeast-3': 'AP-Hong Kong',
    'cn-north-4': 'China-Beijing',
    'cn-east-3': 'China-Shanghai',
    'eu-west-0': 'EU-Paris',
    'la-south-2': 'LA-Santiago',
    'me-east-1': 'ME-Riyadh',
    'na-mexico-1': 'NA-Mexico City',
  };
}
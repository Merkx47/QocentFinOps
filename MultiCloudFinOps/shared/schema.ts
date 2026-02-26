import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ==================== FINOPS TYPES ====================

// Currency types
export type Currency = 'USD' | 'GBP' | 'EUR' | 'JPY';

export const currencyInfo: Record<Currency, { symbol: string; name: string; flag: string; rate: number }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1 },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79 },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92 },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 149.50 },
};

// Huawei Cloud Regions
export type HuaweiRegion = 
  | 'af-south-1'      // Johannesburg, South Africa
  | 'ap-southeast-1'  // Singapore
  | 'ap-southeast-2'  // Bangkok, Thailand
  | 'ap-southeast-3'  // Hong Kong
  | 'cn-north-4'      // Beijing, China
  | 'cn-east-3'       // Shanghai, China
  | 'eu-west-0'       // Paris, France
  | 'la-south-2'      // Santiago, Chile
  | 'me-east-1'       // Riyadh, Saudi Arabia
  | 'na-mexico-1';    // Mexico City

export const regionNames: Record<HuaweiRegion, string> = {
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

// Huawei Cloud Services
export type HuaweiService = 
  | 'ECS'           // Elastic Cloud Server
  | 'RDS'           // Relational Database Service
  | 'OBS'           // Object Storage Service
  | 'EVS'           // Elastic Volume Service
  | 'ELB'           // Elastic Load Balance
  | 'VPC'           // Virtual Private Cloud
  | 'CDN'           // Content Delivery Network
  | 'NAT'           // NAT Gateway
  | 'WAF'           // Web Application Firewall
  | 'DCS'           // Distributed Cache Service
  | 'DDS'           // Document Database Service
  | 'GaussDB'       // GaussDB Database
  | 'FunctionGraph' // Serverless Functions
  | 'APIG'          // API Gateway
  | 'SMN'           // Simple Message Notification
  | 'CTS'           // Cloud Trace Service
  | 'CCE'           // Cloud Container Engine
  | 'SWR'           // Software Repository
  | 'ModelArts'     // AI Development Platform
  | 'DWS'           // Data Warehouse Service
  | 'CSS'           // Cloud Search Service
  | 'MRS'           // MapReduce Service
  | 'DLI';          // Data Lake Insight

export const serviceInfo: Record<HuaweiService, { name: string; category: string; color: string }> = {
  ECS: { name: 'Elastic Cloud Server', category: 'Compute', color: '#E53935' },
  RDS: { name: 'Relational Database', category: 'Database', color: '#1E88E5' },
  OBS: { name: 'Object Storage', category: 'Storage', color: '#43A047' },
  EVS: { name: 'Elastic Volume', category: 'Storage', color: '#00897B' },
  ELB: { name: 'Elastic Load Balance', category: 'Network', color: '#8E24AA' },
  VPC: { name: 'Virtual Private Cloud', category: 'Network', color: '#5E35B1' },
  CDN: { name: 'Content Delivery', category: 'Network', color: '#3949AB' },
  NAT: { name: 'NAT Gateway', category: 'Network', color: '#1E88E5' },
  WAF: { name: 'Web App Firewall', category: 'Security', color: '#D81B60' },
  DCS: { name: 'Distributed Cache', category: 'Database', color: '#FB8C00' },
  DDS: { name: 'Document Database', category: 'Database', color: '#F4511E' },
  GaussDB: { name: 'GaussDB', category: 'Database', color: '#6D4C41' },
  FunctionGraph: { name: 'Serverless Functions', category: 'Compute', color: '#00ACC1' },
  APIG: { name: 'API Gateway', category: 'Application', color: '#7CB342' },
  SMN: { name: 'Message Notification', category: 'Application', color: '#C0CA33' },
  CTS: { name: 'Cloud Trace', category: 'Management', color: '#546E7A' },
  CCE: { name: 'Container Engine', category: 'Compute', color: '#0097A7' },
  SWR: { name: 'Software Repository', category: 'Application', color: '#00838F' },
  ModelArts: { name: 'AI Platform', category: 'AI', color: '#6A1B9A' },
  DWS: { name: 'Data Warehouse', category: 'Analytics', color: '#AD1457' },
  CSS: { name: 'Cloud Search', category: 'Analytics', color: '#4527A0' },
  MRS: { name: 'MapReduce', category: 'Analytics', color: '#283593' },
  DLI: { name: 'Data Lake Insight', category: 'Analytics', color: '#1565C0' },
};

// Tenant type
export interface Tenant {
  id: string;
  name: string;
  industry: string;
  country: string;
  contactName: string;
  contactEmail: string;
  budget: number;
  efficiencyScore: number;
  status: 'active' | 'inactive' | 'suspended';
}

// Cost record type
export interface CostRecord {
  id: string;
  tenantId: string;
  service: HuaweiService;
  region: HuaweiRegion;
  date: string;
  amount: number;
  resourceCount: number;
  usageHours: number;
}

// Resource type
export interface Resource {
  id: string;
  tenantId: string;
  name: string;
  service: HuaweiService;
  region: HuaweiRegion;
  type: string;
  status: 'running' | 'stopped' | 'terminated';
  cpuUtilization: number;
  memoryUtilization: number;
  networkUtilization: number;
  diskUtilization: number;
  monthlyCost: number;
  createdAt: string;
}

// Recommendation type
export type RecommendationType = 
  | 'rightsizing'
  | 'idle_resource'
  | 'reserved_instance'
  | 'storage_optimization'
  | 'network_optimization'
  | 'database_tuning';

export type RecommendationImpact = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  tenantId: string;
  type: RecommendationType;
  title: string;
  description: string;
  resourceId: string;
  resourceName: string;
  service: HuaweiService;
  currentCost: number;
  projectedSavings: number;
  impact: RecommendationImpact;
  effort: 'easy' | 'moderate' | 'complex';
  status: 'new' | 'in_progress' | 'implemented' | 'dismissed';
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalSpend: number;
  previousSpend: number;
  spendGrowthRate: number;
  budgetUsed: number;
  totalBudget: number;
  activeResources: number;
  optimizationOpportunities: number;
  potentialSavings: number;
  averageEfficiency: number;
  costPerResource: number;
}

// Cost trend data point
export interface CostTrendPoint {
  date: string;
  amount: number;
  forecast?: number;
}

// Service breakdown
export interface ServiceBreakdown {
  service: HuaweiService;
  cost: number;
  percentage: number;
  trend: number;
  resourceCount: number;
}

// Region breakdown
export interface RegionBreakdown {
  region: HuaweiRegion;
  cost: number;
  percentage: number;
  resourceCount: number;
}

// Tenant summary for comparison
export interface TenantSummary {
  tenant: Tenant;
  totalSpend: number;
  budgetUsage: number;
  efficiencyScore: number;
  topService: HuaweiService;
  recommendationCount: number;
}

// Date range type
export type DateRangePreset = 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
}

// Filter state
export interface FilterState {
  tenantId: string | 'all';
  dateRange: DateRange;
  services: HuaweiService[];
  regions: HuaweiRegion[];
  currency: Currency;
}

// API Response types
export interface FinOpsOverview {
  kpis: DashboardKPIs;
  costTrend: CostTrendPoint[];
  serviceBreakdown: ServiceBreakdown[];
  regionBreakdown: RegionBreakdown[];
  topRecommendations: Recommendation[];
  tenantSummaries: TenantSummary[];
}

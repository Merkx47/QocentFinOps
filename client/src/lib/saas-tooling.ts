import type { CloudProvider } from './provider-config';
import { getCustomer, getCustomers } from './customers';

export type ToolCategory =
  | 'Observability'
  | 'Cloud Security'
  | 'Data & Analytics'
  | 'IT Service Management'
  | 'Backup & Recovery'
  | 'Platform Operations';

export type AccessType = 'Read-only' | 'Read & remediate';

export interface SaasTool {
  id: string;
  name: string;
  vendor: string;
  /** Set when the tool is operated by us rather than by a third party. */
  partnerOperated?: boolean;
  category: ToolCategory;
  purpose: string;
  /** AWS account the vendor calls sts:AssumeRole from. */
  vendorAccountId: string;
  roleName: string;
  accessType: AccessType;
  permissions: string[];
  owner: string;
}

export interface ToolConnection {
  id: string;
  toolId: string;
  customerId: string;
  /** Management account the role is deployed into; member accounts inherit it via StackSets. */
  managementAccountId: string;
  externalId: string;
  accountsCovered: number;
  lastVerified: string;
  verifiedBy: string;
  status: 'verified' | 'review-due';
}

const tools: SaasTool[] = [
  {
    id: 'tool-qocent-collector',
    name: 'Qocent Cost Collector',
    vendor: 'Qocent',
    partnerOperated: true,
    category: 'Platform Operations',
    purpose: 'Pulls Cost and Usage Reports, Compute Optimizer findings and tag metadata into this platform.',
    vendorAccountId: '905418273641',
    roleName: 'QocentCostCollectorRole',
    accessType: 'Read-only',
    permissions: ['ReadOnlyAccess', 'AWSBillingReadOnlyAccess', 'ComputeOptimizerReadOnlyAccess'],
    owner: 'Cloud Platform Team',
  },
  {
    id: 'tool-datadog',
    name: 'Datadog',
    vendor: 'Datadog, Inc.',
    category: 'Observability',
    purpose: 'Infrastructure metrics, log ingestion and APM traces across customer workloads.',
    vendorAccountId: '417248063411',
    roleName: 'DatadogIntegrationRole',
    accessType: 'Read-only',
    permissions: ['DatadogAWSIntegrationPolicy (customer managed)', 'SecurityAudit'],
    owner: 'Observability Guild',
  },
  {
    id: 'tool-wiz',
    name: 'Wiz',
    vendor: 'Wiz, Inc.',
    category: 'Cloud Security',
    purpose: 'Agentless posture scanning, vulnerability detection and misconfiguration reporting.',
    vendorAccountId: '752019438265',
    roleName: 'WizAccessRole',
    accessType: 'Read-only',
    permissions: ['SecurityAudit', 'WizScannerPolicy (customer managed)'],
    owner: 'Security Operations',
  },
  {
    id: 'tool-splunk',
    name: 'Splunk Cloud',
    vendor: 'Splunk LLC',
    category: 'Observability',
    purpose: 'Centralised log analytics and SIEM correlation for regulated workloads.',
    vendorAccountId: '638501927744',
    roleName: 'SplunkCloudIngestRole',
    accessType: 'Read-only',
    permissions: ['SplunkS3IngestPolicy (customer managed)', 'CloudWatchLogsReadOnlyAccess'],
    owner: 'Security Operations',
  },
  {
    id: 'tool-snowflake',
    name: 'Snowflake',
    vendor: 'Snowflake Inc.',
    category: 'Data & Analytics',
    purpose: 'External stages reading curated S3 data sets for the analytics warehouse.',
    vendorAccountId: '281945603172',
    roleName: 'SnowflakeExternalStageRole',
    accessType: 'Read-only',
    permissions: ['SnowflakeStageAccessPolicy (customer managed)'],
    owner: 'Data Engineering',
  },
  {
    id: 'tool-servicenow',
    name: 'ServiceNow ITOM',
    vendor: 'ServiceNow, Inc.',
    category: 'IT Service Management',
    purpose: 'Service mapping and CMDB discovery of AWS resources feeding change management.',
    vendorAccountId: '594730268115',
    roleName: 'ServiceNowDiscoveryRole',
    accessType: 'Read-only',
    permissions: ['ReadOnlyAccess'],
    owner: 'Service Management',
  },
  {
    id: 'tool-prisma',
    name: 'Prisma Cloud',
    vendor: 'Palo Alto Networks',
    category: 'Cloud Security',
    purpose: 'Compliance benchmarking and guardrail enforcement across member accounts.',
    vendorAccountId: '866214095730',
    roleName: 'PrismaCloudRole',
    accessType: 'Read & remediate',
    permissions: ['SecurityAudit', 'PrismaCloudRemediationPolicy (customer managed)'],
    owner: 'Security Operations',
  },
  {
    id: 'tool-druva',
    name: 'Druva',
    vendor: 'Druva, Inc.',
    category: 'Backup & Recovery',
    purpose: 'Cross-region backup orchestration and restore testing for production data stores.',
    vendorAccountId: '430187265904',
    roleName: 'DruvaBackupRole',
    accessType: 'Read & remediate',
    permissions: ['DruvaBackupPolicy (customer managed)', 'AWSBackupOperatorAccess'],
    owner: 'Infrastructure Team',
  },
];

/** Which tools each customer has connected, and how many accounts the role reaches. */
const connectionMatrix: Record<string, { toolId: string; accounts: number; days: number; status: ToolConnection['status'] }[]> = {
  'cust-nibss': [
    { toolId: 'tool-qocent-collector', accounts: 12, days: 9, status: 'verified' },
    { toolId: 'tool-datadog', accounts: 12, days: 21, status: 'verified' },
    { toolId: 'tool-wiz', accounts: 12, days: 14, status: 'verified' },
    { toolId: 'tool-splunk', accounts: 8, days: 33, status: 'verified' },
    { toolId: 'tool-prisma', accounts: 12, days: 96, status: 'review-due' },
    { toolId: 'tool-druva', accounts: 6, days: 27, status: 'verified' },
  ],
  'cust-pencom': [
    { toolId: 'tool-qocent-collector', accounts: 5, days: 11, status: 'verified' },
    { toolId: 'tool-datadog', accounts: 5, days: 40, status: 'verified' },
    { toolId: 'tool-servicenow', accounts: 5, days: 18, status: 'verified' },
    { toolId: 'tool-wiz', accounts: 5, days: 102, status: 'review-due' },
  ],
  'cust-firstbank': [
    { toolId: 'tool-qocent-collector', accounts: 18, days: 6, status: 'verified' },
    { toolId: 'tool-datadog', accounts: 18, days: 16, status: 'verified' },
    { toolId: 'tool-splunk', accounts: 18, days: 12, status: 'verified' },
    { toolId: 'tool-snowflake', accounts: 4, days: 44, status: 'verified' },
    { toolId: 'tool-servicenow', accounts: 18, days: 29, status: 'verified' },
    { toolId: 'tool-prisma', accounts: 18, days: 23, status: 'verified' },
    { toolId: 'tool-druva', accounts: 11, days: 51, status: 'verified' },
  ],
  'cust-fidelity': [
    { toolId: 'tool-qocent-collector', accounts: 9, days: 8, status: 'verified' },
    { toolId: 'tool-wiz', accounts: 9, days: 19, status: 'verified' },
    { toolId: 'tool-snowflake', accounts: 3, days: 37, status: 'verified' },
    { toolId: 'tool-druva', accounts: 9, days: 88, status: 'review-due' },
  ],
};

const managementAccounts: Record<string, string> = {
  'cust-nibss': '284619037521',
  'cust-pencom': '739105482630',
  'cust-firstbank': '410398276154',
  'cust-fidelity': '628714509382',
};

const reviewers: Record<string, string> = {
  'cust-nibss': 'Adaeze Okonkwo',
  'cust-pencom': 'Ibrahim Musa',
  'cust-firstbank': 'Folake Adeyemi',
  'cust-fidelity': 'Chuka Nwankwo',
};

/** Stable pseudo-random suffix so an external ID looks unguessable but stays put between renders. */
function externalIdSuffix(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  let out = '';
  for (let i = 0; i < 4; i++) {
    h |= 0; h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    out += ((t ^ t >>> 14) >>> 0).toString(16).padStart(8, '0').slice(0, 8);
  }
  return `${out.slice(0, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}-${out.slice(16, 20)}-${out.slice(20, 32)}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function getSaasTools(): SaasTool[] {
  return tools;
}

export function getSaasTool(toolId: string): SaasTool | undefined {
  return tools.find(t => t.id === toolId);
}

/**
 * Cross-account connections for a customer, or for every customer when 'all'.
 * Third-party tooling is an AWS-portal concept, so other providers return nothing.
 */
export function getToolConnections(provider: CloudProvider, customerId: string | 'all'): ToolConnection[] {
  if (provider !== 'aws') return [];

  const customerIds =
    customerId === 'all' ? getCustomers(provider).map(c => c.id) : [customerId];

  return customerIds.flatMap(cid =>
    (connectionMatrix[cid] ?? []).map(entry => ({
      id: `${cid}-${entry.toolId}`,
      toolId: entry.toolId,
      customerId: cid,
      managementAccountId: managementAccounts[cid] ?? '000000000000',
      externalId: `qocent-${cid.replace('cust-', '')}-${externalIdSuffix(`${cid}:${entry.toolId}`)}`,
      accountsCovered: entry.accounts,
      lastVerified: daysAgo(entry.days),
      verifiedBy: reviewers[cid] ?? 'Cloud Platform Team',
      status: entry.status,
    }))
  );
}

export function getCustomerName(customerId: string): string {
  return getCustomer(customerId)?.name ?? customerId;
}

/** The trust policy deployed on the customer side of a connection. */
export function buildTrustPolicy(tool: SaasTool, connection: ToolConnection): string {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: `${tool.name.replace(/[^A-Za-z0-9]/g, '')}CrossAccountAccess`,
        Effect: 'Allow',
        Principal: {
          AWS: `arn:aws:iam::${tool.vendorAccountId}:root`,
        },
        Action: 'sts:AssumeRole',
        Condition: {
          StringEquals: {
            'sts:ExternalId': connection.externalId,
          },
        },
      },
      {
        Sid: 'DenyAssumeRoleWithoutExternalId',
        Effect: 'Deny',
        Principal: { AWS: '*' },
        Action: 'sts:AssumeRole',
        Condition: {
          Null: {
            'sts:ExternalId': 'true',
          },
        },
      },
    ],
  };

  return JSON.stringify(policy, null, 2);
}

export function roleArn(tool: SaasTool, connection: ToolConnection): string {
  return `arn:aws:iam::${connection.managementAccountId}:role/${tool.roleName}`;
}

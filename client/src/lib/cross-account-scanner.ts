import type { CloudProvider } from './provider-config';
import { getCustomer, getCustomers } from './customers';
import { buildTrustPolicy, getCustomerAwsOrg, getExternalId } from './cross-account-policies';
import type { TrustPolicyDocument } from '@shared/trust-policy';

/**
 * Cross-account role inventory.
 *
 * `runCrossAccountScan` is the seam a live read plugs into: swapping the body for
 * an sts:AssumeRole into each account followed by iam:GetRole and reading back
 * AssumeRolePolicyDocument leaves every consumer of a ScanRecord unchanged.
 */

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

/** One IAM role as it came back from a scan. */
export interface ScannedRole {
  connectionId: string;
  toolId: string;
  customerId: string;
  accountId: string;
  roleName: string;
  roleArn: string;
  roleId: string;
  createdDate: string;
  roleLastUsed: string;
  accountsCovered: number;
  attachedPolicies: string[];
  trustPolicy: TrustPolicyDocument;
  lastVerified: string;
  verifiedBy: string;
}

export interface ScanRecord {
  scanId: string;
  completedAt: string;
  accountsScanned: string[];
  roles: ScannedRole[];
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
const connectionMatrix: Record<string, { toolId: string; accounts: number; verifiedDaysAgo: number; ageDays: number; lastUsedDaysAgo: number }[]> = {
  'cust-nibss': [
    { toolId: 'tool-qocent-collector', accounts: 12, verifiedDaysAgo: 9, ageDays: 486, lastUsedDaysAgo: 0 },
    { toolId: 'tool-datadog', accounts: 12, verifiedDaysAgo: 21, ageDays: 412, lastUsedDaysAgo: 0 },
    { toolId: 'tool-wiz', accounts: 12, verifiedDaysAgo: 14, ageDays: 298, lastUsedDaysAgo: 1 },
    { toolId: 'tool-splunk', accounts: 8, verifiedDaysAgo: 33, ageDays: 355, lastUsedDaysAgo: 0 },
    { toolId: 'tool-prisma', accounts: 12, verifiedDaysAgo: 96, ageDays: 204, lastUsedDaysAgo: 2 },
    { toolId: 'tool-druva', accounts: 6, verifiedDaysAgo: 27, ageDays: 178, lastUsedDaysAgo: 1 },
  ],
  'cust-pencom': [
    { toolId: 'tool-qocent-collector', accounts: 5, verifiedDaysAgo: 11, ageDays: 201, lastUsedDaysAgo: 0 },
    { toolId: 'tool-datadog', accounts: 5, verifiedDaysAgo: 40, ageDays: 188, lastUsedDaysAgo: 0 },
    { toolId: 'tool-servicenow', accounts: 5, verifiedDaysAgo: 18, ageDays: 141, lastUsedDaysAgo: 3 },
    { toolId: 'tool-wiz', accounts: 5, verifiedDaysAgo: 102, ageDays: 132, lastUsedDaysAgo: 1 },
  ],
  'cust-firstbank': [
    { toolId: 'tool-qocent-collector', accounts: 18, verifiedDaysAgo: 6, ageDays: 903, lastUsedDaysAgo: 0 },
    { toolId: 'tool-datadog', accounts: 18, verifiedDaysAgo: 16, ageDays: 764, lastUsedDaysAgo: 0 },
    { toolId: 'tool-splunk', accounts: 18, verifiedDaysAgo: 12, ageDays: 690, lastUsedDaysAgo: 0 },
    { toolId: 'tool-snowflake', accounts: 4, verifiedDaysAgo: 44, ageDays: 421, lastUsedDaysAgo: 1 },
    { toolId: 'tool-servicenow', accounts: 18, verifiedDaysAgo: 29, ageDays: 380, lastUsedDaysAgo: 2 },
    { toolId: 'tool-prisma', accounts: 18, verifiedDaysAgo: 23, ageDays: 344, lastUsedDaysAgo: 1 },
    { toolId: 'tool-druva', accounts: 11, verifiedDaysAgo: 51, ageDays: 265, lastUsedDaysAgo: 4 },
  ],
  'cust-fidelity': [
    { toolId: 'tool-qocent-collector', accounts: 9, verifiedDaysAgo: 8, ageDays: 337, lastUsedDaysAgo: 0 },
    { toolId: 'tool-wiz', accounts: 9, verifiedDaysAgo: 19, ageDays: 289, lastUsedDaysAgo: 0 },
    { toolId: 'tool-snowflake', accounts: 3, verifiedDaysAgo: 37, ageDays: 233, lastUsedDaysAgo: 2 },
    { toolId: 'tool-druva', accounts: 9, verifiedDaysAgo: 88, ageDays: 190, lastUsedDaysAgo: 1 },
  ],
};

/** Stable digest so a role ID stays put between renders. */
function digest(seed: string): string {
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

function roleIdSuffix(seed: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const hex = digest(seed).replace(/-/g, '');
  let out = '';
  for (let i = 0; i < 17; i++) {
    out += alphabet[parseInt(hex[i % hex.length], 16) % alphabet.length];
  }
  return `AROA${out}`;
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

export function getCustomerName(customerId: string): string {
  return getCustomer(customerId)?.name ?? customerId;
}

/**
 * Enumerate the cross-account roles held in customer accounts.
 * Third-party tooling is an AWS-portal concept, so other providers return nothing.
 */
export function runCrossAccountScan(provider: CloudProvider, customerId: string | 'all'): ScanRecord {
  if (provider !== 'aws') {
    return { scanId: '', completedAt: daysAgo(0), accountsScanned: [], roles: [] };
  }

  const customerIds = customerId === 'all' ? getCustomers(provider).map(c => c.id) : [customerId];
  const accountsScanned = customerIds
    .map(cid => getCustomerAwsOrg(cid)?.managementAccountId)
    .filter((id): id is string => Boolean(id));

  const roles = customerIds.flatMap(cid =>
    (connectionMatrix[cid] ?? []).flatMap(entry => {
      const tool = getSaasTool(entry.toolId);
      if (!tool) return [];
      const org = getCustomerAwsOrg(cid);
      const accountId = org?.managementAccountId ?? '000000000000';
      const sid = `${tool.name.replace(/[^A-Za-z0-9]/g, '')}CrossAccountAccess`;
      const issued = getExternalId(cid, entry.toolId);

      // No issued value means nothing gates the role, and the policy read back says so.
      const trustPolicy: TrustPolicyDocument = issued
        ? buildTrustPolicy({ sid, vendorAccountId: tool.vendorAccountId, externalId: issued.value })
        : {
            Version: '2012-10-17',
            Statement: [{
              Sid: sid,
              Effect: 'Allow',
              Principal: { AWS: `arn:aws:iam::${tool.vendorAccountId}:root` },
              Action: 'sts:AssumeRole',
            }],
          };

      return [{
        connectionId: `${cid}-${entry.toolId}`,
        toolId: entry.toolId,
        customerId: cid,
        accountId,
        roleName: tool.roleName,
        roleArn: `arn:aws:iam::${accountId}:role/${tool.roleName}`,
        roleId: roleIdSuffix(`${cid}:${entry.toolId}:role`),
        createdDate: daysAgo(entry.ageDays),
        roleLastUsed: daysAgo(entry.lastUsedDaysAgo),
        accountsCovered: entry.accounts,
        attachedPolicies: tool.permissions,
        trustPolicy,
        lastVerified: daysAgo(entry.verifiedDaysAgo),
        verifiedBy: org?.reviewer ?? 'Cloud Platform Team',
      }];
    })
  );

  return {
    scanId: `scan-${daysAgo(0).replace(/-/g, '')}-01`,
    completedAt: new Date().toISOString(),
    accountsScanned,
    roles,
  };
}


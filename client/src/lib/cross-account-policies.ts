import type { TrustPolicyDocument } from '@shared/trust-policy';
import { getCustomer } from './customers';

/**
 * Cross-account policy register.
 *
 * Holds what we issue and control per customer — the AWS organization a role is
 * deployed into, the external ID issued for each tool, its rotation schedule, and
 * the findings raised against a trust policy. The scanner reads roles back from
 * accounts; this module is the record of what should be there.
 */

export const EXTERNAL_ID_STANDARD = {
  prefix: 'qucoon',
  /** Characters in the random portion, on top of the prefix and customer slug. */
  randomLength: 32,
  issuer: 'Qucoon Cloud Platform Team',
  rotationMonths: 12,
  transport: 'Handed to the vendor through their own credential channel. Never sent by email and never reused between customers.',
  note: 'Issued by us rather than chosen by the vendor, so one vendor cannot present another customer\'s identifier.',
} as const;

export interface CustomerAwsOrg {
  customerId: string;
  organizationId: string;
  managementAccountId: string;
  homeRegion: string;
  /** How the role lands in member accounts. */
  deployedBy: string;
  stackSetName: string;
  /** Our engineer accountable for the roles in this organization. */
  reviewer: string;
  reviewerEmail: string;
}

export type ExternalIdStatus = 'active' | 'retired';

export interface ExternalIdRecord {
  id: string;
  customerId: string;
  toolId: string;
  value: string;
  status: ExternalIdStatus;
  issuedOn: string;
  issuedBy: string;
  rotatesOn: string;
  retiredOn?: string;
  retiredReason?: string;
}

export interface PolicyFinding {
  id: string;
  customerId: string;
  toolId: string;
  raisedOn: string;
  closedOn: string;
  summary: string;
  action: string;
}

const customerOrgs: CustomerAwsOrg[] = [
  {
    customerId: 'cust-nibss',
    organizationId: 'o-h4k2p9wm3x',
    managementAccountId: '284619037521',
    homeRegion: 'eu-west-1',
    deployedBy: 'CloudFormation StackSet',
    stackSetName: 'qucoon-cross-account-access',
    reviewer: 'Tunde Bakare',
    reviewerEmail: 'tunde.bakare@qucoon.com',
  },
  {
    customerId: 'cust-pencom',
    organizationId: 'o-r7d5t1nb8q',
    managementAccountId: '739105482630',
    homeRegion: 'eu-central-1',
    deployedBy: 'CloudFormation StackSet',
    stackSetName: 'qucoon-cross-account-access',
    reviewer: 'Ngozi Eze',
    reviewerEmail: 'ngozi.eze@qucoon.com',
  },
  {
    customerId: 'cust-firstbank',
    organizationId: 'o-c3v6y8ju2s',
    managementAccountId: '410398276154',
    homeRegion: 'us-east-1',
    deployedBy: 'CloudFormation StackSet',
    stackSetName: 'qucoon-cross-account-access',
    reviewer: 'Segun Adigun',
    reviewerEmail: 'segun.adigun@qucoon.com',
  },
  {
    customerId: 'cust-fidelity',
    organizationId: 'o-m9z4x7fk6e',
    managementAccountId: '628714509382',
    homeRegion: 'eu-west-1',
    deployedBy: 'Terraform',
    stackSetName: 'qucoon-cross-account-access',
    reviewer: 'Amara Obi',
    reviewerEmail: 'amara.obi@qucoon.com',
  },
];

/** [customerId, toolId, issuedOn] — one issued external ID per connection. */
const issuedExternalIds: [string, string, string][] = [
  ['cust-nibss', 'tool-qocent-collector', '2025-04-25'],
  ['cust-nibss', 'tool-datadog', '2026-01-23'],
  ['cust-nibss', 'tool-wiz', '2025-10-30'],
  ['cust-nibss', 'tool-splunk', '2025-09-03'],
  ['cust-nibss', 'tool-prisma', '2026-02-01'],
  ['cust-nibss', 'tool-druva', '2026-02-27'],
  ['cust-pencom', 'tool-qocent-collector', '2026-02-04'],
  ['cust-pencom', 'tool-datadog', '2026-02-17'],
  ['cust-pencom', 'tool-servicenow', '2026-06-16'],
  ['cust-pencom', 'tool-wiz', '2026-04-14'],
  ['cust-firstbank', 'tool-qocent-collector', '2024-03-04'],
  ['cust-firstbank', 'tool-datadog', '2024-07-21'],
  ['cust-firstbank', 'tool-splunk', '2024-10-03'],
  ['cust-firstbank', 'tool-snowflake', '2026-04-09'],
  ['cust-firstbank', 'tool-servicenow', '2025-08-09'],
  ['cust-firstbank', 'tool-prisma', '2025-09-14'],
  ['cust-firstbank', 'tool-druva', '2025-12-02'],
  ['cust-fidelity', 'tool-qocent-collector', '2025-09-21'],
  ['cust-fidelity', 'tool-wiz', '2025-11-08'],
  ['cust-fidelity', 'tool-snowflake', '2026-01-03'],
  ['cust-fidelity', 'tool-druva', '2026-02-15'],
];

/** Values withdrawn from service. Kept so a rotation can be evidenced, never reissued. */
const retiredExternalIds: [string, string, string, string, string][] = [
  ['cust-pencom', 'tool-servicenow', '2026-04-05', '2026-06-16', 'Reissued after the trust policy was found to carry no sts:ExternalId condition.'],
  ['cust-firstbank', 'tool-snowflake', '2025-06-29', '2026-04-09', 'Reissued when the condition was tightened from StringLike to StringEquals.'],
  ['cust-nibss', 'tool-datadog', '2025-07-08', '2026-01-23', 'Replaced a short, guessable value with a full length identifier.'],
];

const policyFindings: PolicyFinding[] = [
  {
    id: 'finding-001',
    customerId: 'cust-pencom',
    toolId: 'tool-servicenow',
    raisedOn: '2026-06-14',
    closedOn: '2026-06-16',
    summary: 'ServiceNowDiscoveryRole trusted the vendor account with no sts:ExternalId condition.',
    action: 'Condition added, external ID reissued and shared with the vendor out of band, role redeployed by StackSet.',
  },
  {
    id: 'finding-002',
    customerId: 'cust-firstbank',
    toolId: 'tool-snowflake',
    raisedOn: '2026-04-02',
    closedOn: '2026-04-09',
    summary: 'SnowflakeExternalStageRole used a StringLike condition, so any external ID satisfied it.',
    action: 'Switched to StringEquals against a single issued value.',
  },
  {
    id: 'finding-003',
    customerId: 'cust-nibss',
    toolId: 'tool-datadog',
    raisedOn: '2026-01-21',
    closedOn: '2026-01-23',
    summary: 'External ID was the customer short name, which is guessable.',
    action: 'Replaced with a 36 character issued value and rotated at the vendor.',
  },
];

/** Deterministic stand-in for the entropy source that mints a value at issue time. */
function mintValue(seed: string): string {
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

function customerSlug(customerId: string): string {
  return customerId.replace('cust-', '');
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function formatValue(customerId: string, toolId: string, issuedOn: string): string {
  return `${EXTERNAL_ID_STANDARD.prefix}-${customerSlug(customerId)}-${mintValue(`${customerId}:${toolId}:${issuedOn}`)}`;
}

const activeRegister: ExternalIdRecord[] = issuedExternalIds.map(([customerId, toolId, issuedOn]) => ({
  id: `extid-${customerSlug(customerId)}-${toolId.replace('tool-', '')}`,
  customerId,
  toolId,
  value: formatValue(customerId, toolId, issuedOn),
  status: 'active',
  issuedOn,
  issuedBy: EXTERNAL_ID_STANDARD.issuer,
  rotatesOn: addMonths(issuedOn, EXTERNAL_ID_STANDARD.rotationMonths),
}));

const retiredRegister: ExternalIdRecord[] = retiredExternalIds.map(
  ([customerId, toolId, issuedOn, retiredOn, retiredReason]) => ({
    id: `extid-${customerSlug(customerId)}-${toolId.replace('tool-', '')}-${issuedOn}`,
    customerId,
    toolId,
    value: formatValue(customerId, toolId, issuedOn),
    status: 'retired',
    issuedOn,
    issuedBy: EXTERNAL_ID_STANDARD.issuer,
    rotatesOn: addMonths(issuedOn, EXTERNAL_ID_STANDARD.rotationMonths),
    retiredOn,
    retiredReason,
  })
);

export function getCustomerAwsOrg(customerId: string): CustomerAwsOrg | undefined {
  return customerOrgs.find(o => o.customerId === customerId);
}

export function listCustomerAwsOrgs(customerId: string | 'all'): CustomerAwsOrg[] {
  return customerId === 'all' ? customerOrgs : customerOrgs.filter(o => o.customerId === customerId);
}

/** The value currently in force for a connection. */
export function getExternalId(customerId: string, toolId: string): ExternalIdRecord | undefined {
  return activeRegister.find(r => r.customerId === customerId && r.toolId === toolId);
}

export function listExternalIds(customerId: string | 'all'): ExternalIdRecord[] {
  return customerId === 'all'
    ? activeRegister
    : activeRegister.filter(r => r.customerId === customerId);
}

export function listRetiredExternalIds(customerId: string | 'all'): ExternalIdRecord[] {
  return customerId === 'all'
    ? retiredRegister
    : retiredRegister.filter(r => r.customerId === customerId);
}

export function getPolicyFindings(customerId: string | 'all'): PolicyFinding[] {
  return customerId === 'all'
    ? policyFindings
    : policyFindings.filter(f => f.customerId === customerId);
}

/** True once a value is inside the rotation window. */
export function isRotationDue(record: ExternalIdRecord, asOf: Date = new Date()): boolean {
  return new Date(record.rotatesOn).getTime() <= asOf.getTime();
}

export function getCustomerLabel(customerId: string): string {
  return getCustomer(customerId)?.name ?? customerId;
}

/** The document a role should carry for a given vendor and issued value. */
export function buildTrustPolicy(options: {
  sid: string;
  vendorAccountId: string;
  externalId: string;
}): TrustPolicyDocument {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: options.sid,
        Effect: 'Allow',
        Principal: { AWS: `arn:aws:iam::${options.vendorAccountId}:root` },
        Action: 'sts:AssumeRole',
        Condition: { StringEquals: { 'sts:ExternalId': options.externalId } },
      },
      {
        Sid: 'DenyAssumeRoleWithoutExternalId',
        Effect: 'Deny',
        Principal: { AWS: '*' },
        Action: 'sts:AssumeRole',
        Condition: { Null: { 'sts:ExternalId': 'true' } },
      },
    ],
  };
}

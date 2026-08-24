/**
 * Trust policy evaluation.
 *
 * Reads an IAM AssumeRolePolicyDocument and decides whether cross-account access
 * through it is gated on an external ID. Used both to grade the roles returned by
 * a scan and to grade a policy pasted into the validator, so a role and a draft are
 * held to exactly the same rules.
 */

export interface TrustPolicyPrincipal {
  AWS?: string | string[];
  Service?: string | string[];
  Federated?: string | string[];
  CanonicalUser?: string | string[];
}

export interface TrustPolicyStatement {
  Sid?: string;
  Effect: 'Allow' | 'Deny';
  Principal?: TrustPolicyPrincipal | '*';
  NotPrincipal?: TrustPolicyPrincipal | '*';
  Action: string | string[];
  Condition?: Record<string, Record<string, string | string[]>>;
}

export interface TrustPolicyDocument {
  Version: string;
  Statement: TrustPolicyStatement[];
}

export type CheckSeverity = 'required' | 'hardening';

export interface PolicyCheck {
  id: string;
  label: string;
  severity: CheckSeverity;
  passed: boolean;
  detail: string;
}

export interface PolicyVerdict {
  /** True when every `required` check passes. */
  compliant: boolean;
  checks: PolicyCheck[];
  externalIds: string[];
  trustedPrincipals: string[];
}

const ASSUME_ROLE_ACTIONS = ['sts:assumerole', 'sts:*', '*'];
const EXTERNAL_ID_KEY = 'sts:externalid';

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function grantsAssumeRole(statement: TrustPolicyStatement): boolean {
  return toArray(statement.Action).some(action =>
    ASSUME_ROLE_ACTIONS.includes(String(action).toLowerCase())
  );
}

function principalsOf(statement: TrustPolicyStatement): string[] {
  const principal = statement.Principal;
  if (!principal) return [];
  if (principal === '*') return ['*'];
  return [
    ...toArray(principal.AWS),
    ...toArray(principal.Service),
    ...toArray(principal.Federated),
    ...toArray(principal.CanonicalUser),
  ].map(String);
}

/** Condition values keyed on sts:ExternalId, whatever the casing of the key. */
function externalIdConditions(statement: TrustPolicyStatement): { operator: string; values: string[] }[] {
  const found: { operator: string; values: string[] }[] = [];
  for (const [operator, entries] of Object.entries(statement.Condition ?? {})) {
    for (const [key, value] of Object.entries(entries ?? {})) {
      if (key.toLowerCase() === EXTERNAL_ID_KEY) {
        found.push({ operator, values: toArray(value).map(String) });
      }
    }
  }
  return found;
}

/** Parse and shape-check a policy document. Throws with a readable message. */
export function parseTrustPolicy(input: string): TrustPolicyDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('That is not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('A trust policy must be a JSON object.');
  }

  const doc = parsed as Partial<TrustPolicyDocument>;
  const statements = toArray(doc.Statement as TrustPolicyStatement | TrustPolicyStatement[]);

  if (statements.length === 0) {
    throw new Error('The policy has no Statement entries.');
  }

  for (const statement of statements) {
    if (statement.Effect !== 'Allow' && statement.Effect !== 'Deny') {
      throw new Error('Every statement needs an Effect of Allow or Deny.');
    }
    if (statement.Action === undefined) {
      throw new Error('Every statement needs an Action.');
    }
  }

  return { Version: doc.Version ?? '2012-10-17', Statement: statements };
}

export function evaluateTrustPolicy(doc: TrustPolicyDocument): PolicyVerdict {
  const statements = toArray(doc.Statement);
  const allows = statements.filter(s => s.Effect === 'Allow' && grantsAssumeRole(s));
  const denies = statements.filter(s => s.Effect === 'Deny' && grantsAssumeRole(s));

  const checks: PolicyCheck[] = [];
  const externalIds: string[] = [];
  const trustedPrincipals: string[] = [];

  // 1. The role has to be assumable at all, or there is nothing to assess.
  if (allows.length === 0) {
    checks.push({
      id: 'grants-assume-role',
      label: 'Grants sts:AssumeRole',
      severity: 'required',
      passed: false,
      detail: 'No Allow statement grants sts:AssumeRole, so this policy does not establish cross-account access.',
    });
    return { compliant: false, checks, externalIds, trustedPrincipals };
  }

  checks.push({
    id: 'grants-assume-role',
    label: 'Grants sts:AssumeRole',
    severity: 'required',
    passed: true,
    detail: `${allows.length} Allow statement${allows.length === 1 ? '' : 's'} grant${allows.length === 1 ? 's' : ''} sts:AssumeRole.`,
  });

  // 2. Every one of those grants must be conditioned on an external ID.
  const ungated = allows.filter(s => externalIdConditions(s).length === 0);
  for (const statement of allows) {
    for (const condition of externalIdConditions(statement)) {
      externalIds.push(...condition.values);
    }
  }

  checks.push({
    id: 'external-id-required',
    label: 'External ID required on every grant',
    severity: 'required',
    passed: ungated.length === 0,
    detail: ungated.length === 0
      ? 'Each Allow statement conditions sts:AssumeRole on sts:ExternalId.'
      : `${ungated.length} Allow statement${ungated.length === 1 ? '' : 's'} (${ungated.map(s => s.Sid ?? 'unnamed').join(', ')}) grant sts:AssumeRole with no sts:ExternalId condition.`,
  });

  // 3. A condition that matches any value is the same as no condition.
  const wildcardMatched = allows.some(statement =>
    externalIdConditions(statement).some(condition =>
      condition.operator.toLowerCase().startsWith('stringlike') &&
      condition.values.some(value => value.includes('*') || value.includes('?'))
    )
  );

  checks.push({
    id: 'external-id-exact-match',
    label: 'External ID matched exactly',
    severity: 'required',
    passed: !wildcardMatched,
    detail: wildcardMatched
      ? 'A StringLike condition accepts wildcards, so any external ID would satisfy it.'
      : 'External IDs are compared with an exact match.',
  });

  // 4. A wildcard principal widens the door even with a condition on it.
  for (const statement of allows) {
    trustedPrincipals.push(...principalsOf(statement));
  }
  const wildcardPrincipal = trustedPrincipals.some(p => p === '*' || p.includes('::*'));

  checks.push({
    id: 'principal-scoped',
    label: 'Trusted principal is a named account',
    severity: 'required',
    passed: !wildcardPrincipal && trustedPrincipals.length > 0,
    detail: trustedPrincipals.length === 0
      ? 'No Principal is named, so the grant is unscoped.'
      : wildcardPrincipal
        ? 'The Principal is a wildcard, so any AWS account holding the external ID could assume the role.'
        : `Limited to ${trustedPrincipals.join(', ')}.`,
  });

  // 5. Guidance rather than a gate: the value should not be guessable.
  const weak = externalIds.filter(id => id.length < 16);
  checks.push({
    id: 'external-id-unpredictable',
    label: 'External ID is unpredictable',
    severity: 'hardening',
    passed: externalIds.length > 0 && weak.length === 0,
    detail: externalIds.length === 0
      ? 'No external ID value to assess.'
      : weak.length > 0
        ? `${weak.length} external ID${weak.length === 1 ? ' is' : 's are'} shorter than 16 characters and may be guessable.`
        : 'External IDs are long enough to resist guessing.',
  });

  // 6. Also guidance: an explicit Deny survives a careless edit to the Allow.
  const hasNullDeny = denies.some(statement =>
    Object.entries(statement.Condition ?? {}).some(([operator, entries]) =>
      operator.toLowerCase() === 'null' &&
      Object.entries(entries ?? {}).some(
        ([key, value]) => key.toLowerCase() === EXTERNAL_ID_KEY && String(value) === 'true'
      )
    )
  );

  checks.push({
    id: 'deny-without-external-id',
    label: 'Explicit deny when the external ID is absent',
    severity: 'hardening',
    passed: hasNullDeny,
    detail: hasNullDeny
      ? 'A Deny statement blocks sts:AssumeRole when sts:ExternalId is missing.'
      : 'No Deny statement backs up the condition, so removing it from the Allow would open the role.',
  });

  return {
    compliant: checks.filter(c => c.severity === 'required').every(c => c.passed),
    checks,
    externalIds: Array.from(new Set(externalIds)),
    trustedPrincipals: Array.from(new Set(trustedPrincipals)),
  };
}

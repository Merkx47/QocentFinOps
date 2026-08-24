import type { CloudProvider } from './provider-config';

export interface Customer {
  id: string;
  name: string;
  shortName: string;
  industry: string;
  primaryRegion: string;
  accountCount: number;
  contactName: string;
  contactEmail: string;
  budget: number;
  efficiencyScore: number;
  /** Share of the portfolio's AWS spend. Weights across all customers sum to 1. */
  spendWeight: number;
  status: 'active' | 'inactive';
  onboardedAt: string;
}

const awsCustomers: Customer[] = [
  {
    id: 'cust-nibss',
    name: 'NIBSS',
    shortName: 'NIBSS',
    industry: 'Payments Infrastructure',
    primaryRegion: 'eu-west-1',
    accountCount: 12,
    contactName: 'Adaeze Okonkwo',
    contactEmail: 'adaeze.okonkwo@nibss-plc.com.ng',
    budget: 780000,
    efficiencyScore: 86,
    spendWeight: 0.34,
    status: 'active',
    onboardedAt: '2023-04-18',
  },
  {
    id: 'cust-pencom',
    name: 'PenCom',
    shortName: 'PenCom',
    industry: 'Pension Regulation',
    primaryRegion: 'eu-central-1',
    accountCount: 5,
    contactName: 'Ibrahim Musa',
    contactEmail: 'ibrahim.musa@pencom.gov.ng',
    budget: 360000,
    efficiencyScore: 79,
    spendWeight: 0.16,
    status: 'active',
    onboardedAt: '2024-02-05',
  },
  {
    id: 'cust-firstbank',
    name: 'First Bank',
    shortName: 'First Bank',
    industry: 'Commercial Banking',
    primaryRegion: 'us-east-1',
    accountCount: 18,
    contactName: 'Folake Adeyemi',
    contactEmail: 'folake.adeyemi@firstbanknigeria.com',
    budget: 640000,
    efficiencyScore: 81,
    spendWeight: 0.28,
    status: 'active',
    onboardedAt: '2022-11-30',
  },
  {
    id: 'cust-fidelity',
    name: 'Fidelity',
    shortName: 'Fidelity',
    industry: 'Commercial Banking',
    primaryRegion: 'eu-west-1',
    accountCount: 9,
    contactName: 'Chuka Nwankwo',
    contactEmail: 'chuka.nwankwo@fidelitybank.ng',
    budget: 505000,
    efficiencyScore: 74,
    spendWeight: 0.22,
    status: 'active',
    onboardedAt: '2023-09-12',
  },
];

/** Customers are an AWS-portal concept only. */
export function getCustomers(provider: CloudProvider): Customer[] {
  return provider === 'aws' ? awsCustomers : [];
}

export function getCustomer(customerId: string): Customer | undefined {
  return awsCustomers.find(c => c.id === customerId);
}

export function supportsCustomers(provider: CloudProvider): boolean {
  return provider === 'aws';
}

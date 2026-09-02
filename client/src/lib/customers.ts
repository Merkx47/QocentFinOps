import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemo } from 'react';
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
  /**
   * Share of the portfolio's AWS spend. The shipped customers sum to 1; an
   * onboarded customer adds its own share on top, so the total can exceed 1.
   */
  spendWeight: number;
  status: 'active' | 'inactive';
  onboardedAt: string;
}

const shippedCustomers: Customer[] = [
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

/**
 * Customers onboarded through the portal, kept alongside the ones the platform
 * ships with so a new customer can be added without editing code.
 */
interface CustomerStore {
  customCustomers: Customer[];
  addCustomer: (customer: Customer) => void;
  removeCustomer: (customerId: string) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      customCustomers: [],
      addCustomer: (customer) =>
        set((state) => ({ customCustomers: [...state.customCustomers, customer] })),
      removeCustomer: (customerId) =>
        set((state) => ({ customCustomers: state.customCustomers.filter(c => c.id !== customerId) })),
    }),
    { name: 'qocent-customers', version: 1 }
  )
);

/** Customers are an AWS-portal concept only. */
export function getCustomers(provider: CloudProvider): Customer[] {
  if (provider !== 'aws') return [];
  return [...shippedCustomers, ...useCustomerStore.getState().customCustomers];
}

/** Reactive form, so a customer added during the session appears straight away. */
export function useCustomers(provider: CloudProvider): Customer[] {
  const customCustomers = useCustomerStore(state => state.customCustomers);
  return useMemo(
    () => (provider === 'aws' ? [...shippedCustomers, ...customCustomers] : []),
    [provider, customCustomers]
  );
}

export function getCustomer(customerId: string): Customer | undefined {
  return getCustomers('aws').find(c => c.id === customerId);
}

export function isShippedCustomer(customerId: string): boolean {
  return shippedCustomers.some(c => c.id === customerId);
}

export function supportsCustomers(provider: CloudProvider): boolean {
  return provider === 'aws';
}

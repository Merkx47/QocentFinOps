import { create } from 'zustand';
import type { Currency, DateRange } from '@shared/schema';
import type { CloudProvider } from './provider-config';
import { getProviderConfig } from './provider-config';

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface FinOpsStore {
  selectedProvider: CloudProvider;
  setSelectedProvider: (provider: CloudProvider) => void;

  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (provider: CloudProvider, user: UserInfo) => void;
  logout: () => void;

  currency: Currency;
  setCurrency: (currency: Currency) => void;

  selectedOrgUnitId: string | 'all';
  setSelectedOrgUnitId: (orgUnitId: string | 'all') => void;

  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;

  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;

  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

export const useFinOpsStore = create<FinOpsStore>((set) => ({
  selectedProvider: 'huawei',
  setSelectedProvider: (selectedProvider) => {
    set({ selectedProvider, selectedOrgUnitId: 'all', selectedServices: [], selectedRegions: [] });
    applyProviderTheme(selectedProvider);
  },

  user: null,
  isAuthenticated: false,
  login: (provider, user) => {
    set({ selectedProvider: provider, user, isAuthenticated: true, selectedOrgUnitId: 'all', selectedServices: [], selectedRegions: [] });
    applyProviderTheme(provider);
  },
  logout: () => set({ user: null, isAuthenticated: false, selectedProvider: 'huawei', selectedOrgUnitId: 'all', selectedServices: [], selectedRegions: [] }),

  currency: 'USD',
  setCurrency: (currency) => set({ currency }),

  selectedOrgUnitId: 'all',
  setSelectedOrgUnitId: (selectedOrgUnitId) => set({ selectedOrgUnitId }),

  dateRange: {
    preset: 'last30days',
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  },
  setDateRange: (dateRange) => set({ dateRange }),

  selectedServices: [],
  setSelectedServices: (selectedServices) => set({ selectedServices }),

  selectedRegions: [],
  setSelectedRegions: (selectedRegions) => set({ selectedRegions }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));

export function applyProviderTheme(provider: CloudProvider) {
  const config = getProviderConfig(provider);
  const root = document.documentElement;
  root.style.setProperty('--primary', config.colors.primaryHSL);
  root.style.setProperty('--provider-primary', config.colors.primary);
}

export function convertCurrency(amount: number, toCurrency: Currency): number {
  const rates: Record<Currency, number> = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
    JPY: 149.50,
    NGN: 1550.00,
    CNY: 7.24,
  };
  return amount * rates[toCurrency];
}

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  NGN: '₦',
  CNY: '¥',
};

const noDecimalCurrencies: Currency[] = ['JPY', 'NGN'];

export function formatCurrency(amount: number, currency: Currency): string {
  const converted = convertCurrency(amount, currency);

  if (noDecimalCurrencies.includes(currency)) {
    return `${currencySymbols[currency]}${Math.round(converted).toLocaleString()}`;
  }

  return `${currencySymbols[currency]}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatCompactCurrency(amount: number, currency: Currency): string {
  const converted = convertCurrency(amount, currency);

  if (converted >= 1000000) {
    return `${currencySymbols[currency]}${(converted / 1000000).toFixed(1)}M`;
  }
  if (converted >= 1000) {
    return `${currencySymbols[currency]}${(converted / 1000).toFixed(1)}K`;
  }

  if (noDecimalCurrencies.includes(currency)) {
    return `${currencySymbols[currency]}${Math.round(converted).toLocaleString()}`;
  }

  return `${currencySymbols[currency]}${converted.toFixed(2)}`;
}
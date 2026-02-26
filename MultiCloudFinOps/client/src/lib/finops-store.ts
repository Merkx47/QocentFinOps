import { create } from 'zustand';
import type { Currency, FilterState, DateRange, HuaweiService, HuaweiRegion } from '@shared/schema';

interface FinOpsStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  
  selectedTenantId: string | 'all';
  setSelectedTenantId: (tenantId: string | 'all') => void;
  
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  
  selectedServices: HuaweiService[];
  setSelectedServices: (services: HuaweiService[]) => void;
  
  selectedRegions: HuaweiRegion[];
  setSelectedRegions: (regions: HuaweiRegion[]) => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

export const useFinOpsStore = create<FinOpsStore>((set) => ({
  currency: 'USD',
  setCurrency: (currency) => set({ currency }),
  
  selectedTenantId: 'all',
  setSelectedTenantId: (selectedTenantId) => set({ selectedTenantId }),
  
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

// Currency conversion utility
export function convertCurrency(amount: number, toCurrency: Currency): number {
  const rates: Record<Currency, number> = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
    JPY: 149.50,
  };
  return amount * rates[toCurrency];
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    JPY: '¥',
  };
  
  const converted = convertCurrency(amount, currency);
  
  if (currency === 'JPY') {
    return `${symbols[currency]}${Math.round(converted).toLocaleString()}`;
  }
  
  return `${symbols[currency]}${converted.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

export function formatCompactCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    JPY: '¥',
  };
  
  const converted = convertCurrency(amount, currency);
  
  if (converted >= 1000000) {
    return `${symbols[currency]}${(converted / 1000000).toFixed(1)}M`;
  }
  if (converted >= 1000) {
    return `${symbols[currency]}${(converted / 1000).toFixed(1)}K`;
  }
  
  if (currency === 'JPY') {
    return `${symbols[currency]}${Math.round(converted).toLocaleString()}`;
  }
  
  return `${symbols[currency]}${converted.toFixed(2)}`;
}

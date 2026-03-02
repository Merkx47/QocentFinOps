import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency, DateRange, Language } from '@shared/schema';
import type { CloudProvider } from './provider-config';
import { getProviderConfig } from './provider-config';

export const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  GBP: 0.79,
  EUR: 0.92,
  JPY: 149.50,
  NGN: 1550.00,
  CNY: 7.24,
};

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

  language: Language;
  setLanguage: (lang: Language) => void;

  selectedOrgUnitId: string | 'all';
  setSelectedOrgUnitId: (orgUnitId: string | 'all') => void;

  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;

  exchangeRates: Record<Currency, number>;
  setExchangeRates: (rates: Record<Currency, number>) => void;
  resetExchangeRates: () => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

export const useFinOpsStore = create<FinOpsStore>()(
  persist(
    (set) => ({
  selectedProvider: 'huawei',
  setSelectedProvider: (selectedProvider) => {
    set({ selectedProvider, selectedOrgUnitId: 'all' });
    applyProviderTheme(selectedProvider);
  },

  user: null,
  isAuthenticated: false,
  login: (provider, user) => {
    set({ selectedProvider: provider, user, isAuthenticated: true, selectedOrgUnitId: 'all' });
    applyProviderTheme(provider);
  },
  logout: () => set({ user: null, isAuthenticated: false, selectedProvider: 'huawei', selectedOrgUnitId: 'all' }),

  currency: 'USD',
  setCurrency: (currency) => set({ currency }),

  language: 'en',
  setLanguage: (language) => {
    set({ language });
    triggerGoogleTranslate(language);
  },

  selectedOrgUnitId: 'all',
  setSelectedOrgUnitId: (selectedOrgUnitId) => set({ selectedOrgUnitId }),

  dateRange: {
    preset: 'last30days',
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  },
  setDateRange: (dateRange) => set({ dateRange }),

  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  setExchangeRates: (exchangeRates) => set({ exchangeRates }),
  resetExchangeRates: () => set({ exchangeRates: { ...DEFAULT_EXCHANGE_RATES } }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    {
      name: 'finops-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedProvider: state.selectedProvider,
        language: state.language,
        currency: state.currency,
        exchangeRates: state.exchangeRates,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.selectedProvider) {
          applyProviderTheme(state.selectedProvider);
        }
      },
    }
  )
);

const languageToGoogleCode: Record<string, string> = {
  en: 'en',
  fr: 'fr',
  es: 'es',
  zh: 'zh-CN',
  ar: 'ar',
  pt: 'pt',
};

let reloadAttempted = false;

function waitForGoogleTranslate(maxWait = 3000): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const el = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (el) { resolve(el); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo) { clearInterval(interval); resolve(combo); return; }
      if (Date.now() - start > maxWait) { clearInterval(interval); resolve(null); }
    }, 200);
  });
}

function fadeTranslate(callback: () => void) {
  const root = document.getElementById('root');
  if (!root) { callback(); return; }
  root.style.transition = 'opacity 0.15s ease';
  root.style.opacity = '0.4';
  setTimeout(() => {
    callback();
    setTimeout(() => {
      root.style.opacity = '1';
      setTimeout(() => { root.style.transition = ''; }, 200);
    }, 150);
  }, 150);
}

function triggerGoogleTranslate(lang: Language) {
  const code = languageToGoogleCode[lang] || 'en';

  if (code === 'en') {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectEl) {
      fadeTranslate(() => {
        selectEl.value = 'en';
        selectEl.dispatchEvent(new Event('change'));
      });
    } else if (!reloadAttempted) {
      reloadAttempted = true;
      window.location.reload();
    }
    return;
  }

  document.cookie = `googtrans=/en/${code}; path=/;`;
  document.cookie = `googtrans=/en/${code}; path=/; domain=.${window.location.hostname}`;

  waitForGoogleTranslate().then((selectEl) => {
    if (selectEl) {
      fadeTranslate(() => {
        selectEl.value = code;
        selectEl.dispatchEvent(new Event('change'));
      });
      reloadAttempted = false;
    } else if (!reloadAttempted) {
      reloadAttempted = true;
      window.location.reload();
    }
  });
}

export function applyProviderTheme(provider: CloudProvider) {
  const config = getProviderConfig(provider);
  const root = document.documentElement;
  root.style.setProperty('--primary', config.colors.primaryHSL);
  root.style.setProperty('--provider-primary', config.colors.primary);
}

export function convertCurrency(amount: number, toCurrency: Currency): number {
  const { exchangeRates } = useFinOpsStore.getState();
  return amount * exchangeRates[toCurrency];
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
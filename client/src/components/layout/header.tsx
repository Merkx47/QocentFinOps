import { useFinOpsStore, formatCompactCurrency, applyProviderTheme } from '@/lib/finops-store';
import { getOrgUnits, generateKPIs } from '@/lib/mock-data';
import { getProviderConfig } from '@/lib/provider-config';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  IconBuildingSkyscraper,
  IconCalendarEvent,
  IconBell,
  IconSettings,
  IconUserCircle,
  IconLogout,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import type { Currency, DateRangePreset } from '@shared/schema';
import { AWSLogo, AzureLogo, GCPIcon } from '@/components/provider-logos';
import huaweiLogo from '@assets/image_1764758201045.png';

import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import type { CloudProvider } from '@/lib/provider-config';

const currencyOptions: { value: Currency; label: string; flag: string }[] = [
  { value: 'USD', label: 'USD', flag: '\u{1F1FA}\u{1F1F8}' },
  { value: 'GBP', label: 'GBP', flag: '\u{1F1EC}\u{1F1E7}' },
  { value: 'EUR', label: 'EUR', flag: '\u{1F1EA}\u{1F1FA}' },
  { value: 'JPY', label: 'JPY', flag: '\u{1F1EF}\u{1F1F5}' },
];

const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

function ProviderLogo({ provider }: { provider: CloudProvider }) {
  if (provider === 'aws') return <AWSLogo className="h-6 w-auto" />;
  if (provider === 'azure') return <AzureLogo className="h-6 w-auto" />;
  if (provider === 'gcp') return <GCPIcon className="h-6 w-auto" />;
  return <img src={huaweiLogo} alt="Huawei Cloud" className="h-6 w-auto object-contain" />;
}

export function Header() {
  const {
    currency,
    setCurrency,
    selectedOrgUnitId,
    setSelectedOrgUnitId,
    selectedProvider,
    dateRange,
    setDateRange,
    logout,
    user,
  } = useFinOpsStore();

  const [, navigate] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const config = getProviderConfig(selectedProvider);
  const orgUnits = useMemo(() => getOrgUnits(selectedProvider), [selectedProvider]);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    applyProviderTheme(selectedProvider);
  }, [selectedProvider]);

  const selectedUnit = useMemo(() => {
    if (selectedOrgUnitId === 'all') return null;
    return orgUnits.find(u => u.id === selectedOrgUnitId);
  }, [selectedOrgUnitId, orgUnits]);

  const kpis = useMemo(() => generateKPIs(selectedOrgUnitId, selectedProvider), [selectedOrgUnitId, selectedProvider]);

  const handleDateRangeChange = (preset: DateRangePreset) => {
    const today = new Date();
    let startDate = new Date();

    switch (preset) {
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateRange({
          preset,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0],
        });
        return;
    }

    setDateRange({
      preset,
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full px-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <ProviderLogo provider={selectedProvider} />
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-slate-800">{config.shortName} FinOps</span>
            </div>
          </div>

          <Select
            value={selectedOrgUnitId}
            onValueChange={setSelectedOrgUnitId}
          >
            <SelectTrigger className="w-[200px] bg-slate-50/80 border-slate-200 rounded-xl h-9 text-sm">
              <div className="flex items-center gap-2">
                <IconBuildingSkyscraper className="h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder={config.hierarchy.selectorLabel} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.hierarchy.allUnitsLabel}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {orgUnits.length}
                  </Badge>
                </div>
              </SelectItem>
              {orgUnits.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{unit.name}</span>
                    <span className="text-xs text-muted-foreground">{unit.environment}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium">MTD</span>
            <span className="text-sm font-mono font-semibold text-slate-900">
              {formatCompactCurrency(kpis.totalSpend, currency)}
            </span>
            <Badge
              variant={kpis.spendGrowthRate > 0 ? "destructive" : "secondary"}
              className="text-[10px] h-5 px-1.5"
            >
              {kpis.spendGrowthRate > 0 ? '+' : ''}{kpis.spendGrowthRate}%
            </Badge>
          </div>

          <Select
            value={dateRange.preset}
            onValueChange={(value) => handleDateRangeChange(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[140px] bg-slate-50/80 border-slate-200 rounded-xl h-9 text-sm">
              <div className="flex items-center gap-2">
                <IconCalendarEvent className="h-3.5 w-3.5 text-slate-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currency}
            onValueChange={(value) => setCurrency(value as Currency)}
          >
            <SelectTrigger className="w-[90px] bg-slate-50/80 border-slate-200 rounded-xl h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.flag}</span>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? (
              <IconSun className="h-4 w-4" />
            ) : (
              <IconMoon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600"
          >
            <IconBell className="h-4 w-4" />
            <span
              className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ background: config.colors.primary }}
            >
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <IconUserCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user && (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>
                <IconUserCircle className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconSettings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleLogout}
              >
                <IconLogout className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

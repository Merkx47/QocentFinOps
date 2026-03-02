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
  IconLanguage,
  IconCheck,
} from '@tabler/icons-react';
import type { Currency, DateRangePreset, Language } from '@shared/schema';
import { AWSLogo, AzureLogo, GCPIcon } from '@/components/provider-logos';
import huaweiLogo from '@assets/image_1764758201045.png';

import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import type { CloudProvider } from '@/lib/provider-config';

const currencyOptions: { value: Currency; label: string; flag: string }[] = [
  { value: 'USD', label: 'USD', flag: '🇺🇸' },
  { value: 'GBP', label: 'GBP', flag: '🇬🇧' },
  { value: 'EUR', label: 'EUR', flag: '🇪🇺' },
  { value: 'JPY', label: 'JPY', flag: '🇯🇵' },
  { value: 'NGN', label: 'NGN', flag: '🇳🇬' },
  { value: 'CNY', label: 'CNY', flag: '🇨🇳' },
];

const languageOptions: { value: Language; nativeName: string; englishName: string }[] = [
  { value: 'en', nativeName: 'English', englishName: 'English' },
  { value: 'fr', nativeName: 'Fran\u00e7ais', englishName: 'French' },
  { value: 'es', nativeName: 'Espa\u00f1ol', englishName: 'Spanish' },
  { value: 'pt', nativeName: 'Portugu\u00eas', englishName: 'Portuguese' },
  { value: 'zh', nativeName: '\u7b80\u4f53\u4e2d\u6587', englishName: 'Chinese (Simplified)' },
  { value: 'ar', nativeName: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', englishName: 'Arabic' },
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
    language,
    setLanguage,
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

  const kpis = useMemo(() => generateKPIs(selectedOrgUnitId, selectedProvider, dateRange), [selectedOrgUnitId, selectedProvider, dateRange]);

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
    <header className="h-16 border-b [border-bottom-color:var(--button-outline)] bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full px-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <ProviderLogo provider={selectedProvider} />
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-foreground">{config.shortName} FinOps</span>
            </div>
          </div>

          <Select
            value={selectedOrgUnitId}
            onValueChange={setSelectedOrgUnitId}
          >
            <SelectTrigger className="w-auto min-w-[160px] max-w-[240px] bg-muted/50 [border-color:var(--button-outline)] shadow-xs rounded-xl h-9 text-sm">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <IconBuildingSkyscraper className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
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
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border [border-color:var(--button-outline)] shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium">MTD</span>
            <span className="text-sm font-mono font-semibold text-foreground">
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
            <SelectTrigger className="w-auto min-w-[130px] max-w-[200px] bg-muted/50 [border-color:var(--button-outline)] shadow-xs rounded-xl h-9 text-sm">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <IconCalendarEvent className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
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
            <SelectTrigger className="w-[110px] bg-muted/50 [border-color:var(--button-outline)] shadow-xs rounded-xl h-9 text-sm">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 rounded-xl bg-muted/50 border-border text-sm font-medium text-foreground hover:bg-muted gap-2 notranslate"
              >
                <IconLanguage className="h-4 w-4 text-muted-foreground" />
                <span>{languageOptions.find(l => l.value === language)?.nativeName || 'English'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] p-0 notranslate">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Select Language</p>
              </div>
              {languageOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setLanguage(option.value)}
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between ${
                    language === option.value ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span className={`text-sm font-medium ${language === option.value ? 'text-primary' : 'text-foreground'}`}>
                    {option.nativeName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{option.englishName}</span>
                    {language === option.value && (
                      <IconCheck className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <div className="px-4 py-2.5 border-t border-border flex items-center gap-2">
                <span className="text-muted-foreground text-xs">文A</span>
                <span className="text-[11px] text-muted-foreground">Powered by Google Translate</span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? (
              <IconSun className="h-4 w-4" />
            ) : (
              <IconMoon className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <IconBell className="h-4 w-4" />
                <span
                  className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: config.colors.primary }}
                >
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">3 new</Badge>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem className="px-4 py-3 cursor-pointer flex-col items-start gap-1">
                  <div className="flex items-center gap-2 w-full">
                    <span className="h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                    <span className="text-sm font-medium">Budget Alert</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">2m ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">Production spending reached 92% of monthly budget</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-4 py-3 cursor-pointer flex-col items-start gap-1">
                  <div className="flex items-center gap-2 w-full">
                    <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-sm font-medium">Cost Anomaly Detected</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">1h ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">Unusual spike in compute costs (+34% vs baseline)</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-4 py-3 cursor-pointer flex-col items-start gap-1">
                  <div className="flex items-center gap-2 w-full">
                    <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm font-medium">New Recommendation</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">3h ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">3 new rightsizing opportunities found — save up to 18%</p>
                </DropdownMenuItem>
              </div>
              <div className="px-4 py-2.5 border-t border-border">
                <button className="text-xs text-primary font-medium hover:underline" onClick={() => navigate('/notifications')}>View all notifications</button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
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

import { useFinOpsStore, formatCompactCurrency } from '@/lib/finops-store';
import { mockTenants, generateKPIs } from '@/lib/mock-data';
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
  Building2, 
  ChevronDown, 
  Calendar, 
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import type { Currency, DateRangePreset } from '@shared/schema';
import huaweiLogo from '@assets/image_1764758201045.png';
import { useMemo, useState, useEffect } from 'react';

const currencyOptions: { value: Currency; label: string; flag: string }[] = [
  { value: 'USD', label: 'USD', flag: '🇺🇸' },
  { value: 'GBP', label: 'GBP', flag: '🇬🇧' },
  { value: 'EUR', label: 'EUR', flag: '🇪🇺' },
  { value: 'JPY', label: 'JPY', flag: '🇯🇵' },
];

const dateRangeOptions: { value: DateRangePreset; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
];

export function Header() {
  const { 
    currency, 
    setCurrency, 
    selectedTenantId, 
    setSelectedTenantId,
    dateRange,
    setDateRange,
  } = useFinOpsStore();

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const selectedTenant = useMemo(() => {
    if (selectedTenantId === 'all') return null;
    return mockTenants.find(t => t.id === selectedTenantId);
  }, [selectedTenantId]);

  const kpis = useMemo(() => generateKPIs(selectedTenantId), [selectedTenantId]);

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

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img 
              src={huaweiLogo} 
              alt="Huawei Cloud" 
              className="h-8 w-auto object-contain"
              data-testid="img-huawei-logo"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-foreground">FinOps</span>
              <span className="text-xs text-muted-foreground ml-2">Dashboard</span>
            </div>
          </div>
          
          <div className="h-6 w-px bg-border hidden md:block" />
          
          <Select 
            value={selectedTenantId} 
            onValueChange={setSelectedTenantId}
          >
            <SelectTrigger 
              className="w-[220px] bg-background/50"
              data-testid="select-tenant"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select Tenant" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="select-tenant-all">
                <div className="flex items-center gap-2">
                  <span className="font-medium">All Tenants</span>
                  <Badge variant="secondary" className="text-xs">
                    {mockTenants.length}
                  </Badge>
                </div>
              </SelectItem>
              {mockTenants.map((tenant) => (
                <SelectItem 
                  key={tenant.id} 
                  value={tenant.id}
                  data-testid={`select-tenant-${tenant.id}`}
                >
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">{tenant.country}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
            <span className="text-xs text-muted-foreground">MTD Spend:</span>
            <span className="text-sm font-mono font-semibold text-foreground">
              {formatCompactCurrency(kpis.totalSpend, currency)}
            </span>
            <Badge 
              variant={kpis.spendGrowthRate > 0 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {kpis.spendGrowthRate > 0 ? '+' : ''}{kpis.spendGrowthRate}%
            </Badge>
          </div>

          <Select 
            value={dateRange.preset} 
            onValueChange={(value) => handleDateRangeChange(value as DateRangePreset)}
          >
            <SelectTrigger 
              className="w-[150px] bg-background/50"
              data-testid="select-date-range"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  data-testid={`select-date-${option.value}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={currency} 
            onValueChange={(value) => setCurrency(value as Currency)}
          >
            <SelectTrigger 
              className="w-[100px] bg-background/50"
              data-testid="select-currency"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  data-testid={`select-currency-${option.value}`}
                >
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
            onClick={() => setIsDark(!isDark)}
            data-testid="button-theme-toggle"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                data-testid="button-user-menu"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem data-testid="menu-item-profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-item-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                data-testid="menu-item-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

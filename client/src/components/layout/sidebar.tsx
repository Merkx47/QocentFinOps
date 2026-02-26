import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Server,
  Lightbulb,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Target,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinOpsStore } from '@/lib/finops-store';
import { getProviderConfig } from '@/lib/provider-config';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo } from 'react';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  badge?: number;
}

function useNavItems() {
  const { selectedProvider } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);

  const mainNavItems: NavItem[] = useMemo(() => [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: TrendingUp, label: 'Cost Analytics', href: '/analytics' },
    { icon: Server, label: 'Resources', href: '/resources' },
    { icon: Lightbulb, label: 'Recommendations', href: '/recommendations', badge: 10 },
    { icon: Users, label: config.hierarchy.orgUnitLabelPlural, href: '/tenants' },
  ], [config.hierarchy.orgUnitLabelPlural]);

  return mainNavItems;
}

const secondaryNavItems: NavItem[] = [
  { icon: Target, label: 'Budgets', href: '/budgets' },
  { icon: Wallet, label: 'Cost Allocation', href: '/allocation' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
];

function NavLink({
  item,
  isCollapsed,
  isActive
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  const content = (
    <Link href={item.href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer relative group/nav",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn(
          "h-[18px] w-[18px] flex-shrink-0 transition-colors",
          isActive ? "text-primary-foreground" : "text-slate-400 group-hover/nav:text-slate-600"
        )} />
        {!isCollapsed && (
          <>
            <span className={cn(
              "text-[13px] font-medium flex-1",
              isActive ? "font-semibold" : ""
            )}>{item.label}</span>
            {item.badge && !isActive && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center">
                {item.badge}
              </span>
            )}
            {item.badge && isActive && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-white/20 text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          <p>{item.label}</p>
          {item.badge && <span className="text-xs text-muted-foreground ml-1">({item.badge})</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const [location] = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useFinOpsStore();
  const mainNavItems = useNavItems();

  return (
    <aside
      className={cn(
        "h-[calc(100vh-4rem)] border-r border-slate-200/80 bg-white flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-2.5 space-y-0.5">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isCollapsed={sidebarCollapsed}
              isActive={location === item.href}
            />
          ))}
        </nav>

        <div className={cn("my-3 mx-3 border-t border-slate-100", sidebarCollapsed && "mx-2")} />

        <nav className="px-2.5 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Financial
            </p>
          )}
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isCollapsed={sidebarCollapsed}
              isActive={location === item.href}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-100 p-2.5 space-y-0.5">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isCollapsed={sidebarCollapsed}
            isActive={location === item.href}
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-center mt-1 text-slate-400 hover:text-slate-600 rounded-xl h-9",
            !sidebarCollapsed && "justify-end"
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <span className="text-[11px] mr-2">Collapse</span>
              <ChevronLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  IconLayoutDashboard,
  IconTrendingUp,
  IconServer2,
  IconBulb,
  IconUsersGroup,
  IconSettings,
  IconHelp,
  IconChevronLeft,
  IconChevronRight,
  IconChartBar,
  IconChartPie,
  IconTarget,
  IconWallet,
  IconAlertTriangle,
  IconChartLine,
  IconBell,
  IconTag,
  IconTrash,
  IconBriefcase,
  IconShieldLock,
  IconCalculator,
  IconReceipt,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useFinOpsStore } from '@/lib/finops-store';
import { getProviderConfig } from '@/lib/provider-config';
import { supportsCustomers } from '@/lib/customers';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo } from 'react';

interface NavItem {
  icon: typeof IconLayoutDashboard;
  label: string;
  href: string;
  badge?: number;
}

function useNavItems() {
  const { selectedProvider } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);

  const mainNavItems: NavItem[] = useMemo(() => [
    { icon: IconLayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: IconTrendingUp, label: 'Cost Analytics', href: '/analytics' },
    { icon: IconServer2, label: 'Resources', href: '/resources' },
    { icon: IconBulb, label: 'Recommendations', href: '/recommendations', badge: 10 },
    ...(supportsCustomers(selectedProvider)
      ? [{ icon: IconBriefcase, label: 'Customers', href: '/customers' }]
      : []),
    { icon: IconUsersGroup, label: config.hierarchy.orgUnitLabelPlural, href: '/tenants' },
  ], [config.hierarchy.orgUnitLabelPlural, selectedProvider]);

  return mainNavItems;
}

const intelligenceNavItems: NavItem[] = [
  { icon: IconAlertTriangle, label: 'Anomaly Detection', href: '/anomalies' },
  { icon: IconChartLine, label: 'Cost Forecast', href: '/forecasting' },
  { icon: IconBell, label: 'Notifications', href: '/notifications', badge: 3 },
];

const baseSecondaryNavItems: NavItem[] = [
  { icon: IconTarget, label: 'Budgets', href: '/budgets' },
  { icon: IconWallet, label: 'Cost Allocation', href: '/allocation' },
  { icon: IconChartBar, label: 'Reports', href: '/reports' },
];

function useSecondaryNavItems() {
  const { selectedProvider } = useFinOpsStore();

  return useMemo<NavItem[]>(() => [
    ...baseSecondaryNavItems,
    ...(supportsCustomers(selectedProvider)
      ? [
          { icon: IconCalculator, label: 'TCO Analysis', href: '/tco' },
          { icon: IconReceipt, label: 'Rate Cards', href: '/rate-cards' },
        ]
      : []),
  ], [selectedProvider]);
}

const baseGovernanceNavItems: NavItem[] = [
  { icon: IconTag, label: 'Tag Compliance', href: '/tagging' },
  { icon: IconTrash, label: 'Waste Detection', href: '/waste' },
];

function useGovernanceNavItems() {
  const { selectedProvider } = useFinOpsStore();

  return useMemo<NavItem[]>(() => [
    ...baseGovernanceNavItems,
    ...(supportsCustomers(selectedProvider)
      ? [{ icon: IconShieldLock, label: 'Cross-Account Access', href: '/cross-account-access' }]
      : []),
  ], [selectedProvider]);
}

const bottomNavItems: NavItem[] = [
  { icon: IconSettings, label: 'Settings', href: '/settings' },
  { icon: IconHelp, label: 'Help', href: '/help' },
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
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
          isCollapsed && "justify-center px-2"
        )}
      >
        <item.icon className={cn(
          "h-[18px] w-[18px] flex-shrink-0 transition-colors",
          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover/nav:text-foreground"
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
  const secondaryNavItems = useSecondaryNavItems();
  const governanceNavItems = useGovernanceNavItems();

  return (
    <aside
      className={cn(
        "h-[calc(100vh-4rem)] border-r [border-right-color:var(--button-outline)] bg-background flex flex-col transition-all duration-300",
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

        <div className={cn("my-3 mx-3 border-t border-border", sidebarCollapsed && "mx-2")} />

        <nav className="px-2.5 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
              Intelligence
            </p>
          )}
          {intelligenceNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isCollapsed={sidebarCollapsed}
              isActive={location === item.href}
            />
          ))}
        </nav>

        <div className={cn("my-3 mx-3 border-t border-border", sidebarCollapsed && "mx-2")} />

        <nav className="px-2.5 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
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

        <div className={cn("my-3 mx-3 border-t border-border", sidebarCollapsed && "mx-2")} />

        <nav className="px-2.5 space-y-0.5">
          {!sidebarCollapsed && (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
              Governance
            </p>
          )}
          {governanceNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isCollapsed={sidebarCollapsed}
              isActive={location === item.href}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-border p-2.5 space-y-0.5">
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
            "w-full justify-center mt-1 text-muted-foreground hover:text-foreground rounded-xl h-9",
            !sidebarCollapsed && "justify-end"
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <IconChevronRight className="h-4 w-4" />
          ) : (
            <>
              <span className="text-[11px] mr-2">Collapse</span>
              <IconChevronLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', href: '/' },
  { icon: TrendingUp, label: 'Cost Analytics', href: '/analytics' },
  { icon: Server, label: 'Resources', href: '/resources' },
  { icon: Lightbulb, label: 'Recommendations', href: '/recommendations', badge: 10 },
  { icon: Users, label: 'Tenants', href: '/tenants' },
];

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
          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer hover-elevate",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
          isCollapsed && "justify-center px-2"
        )}
        data-testid={`nav-link-${item.label.toLowerCase().replace(' ', '-')}`}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
        {!isCollapsed && (
          <>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            {item.badge && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">
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

  return (
    <aside
      className={cn(
        "h-[calc(100vh-4rem)] border-r border-border bg-sidebar flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isCollapsed={sidebarCollapsed}
              isActive={location === item.href}
            />
          ))}
        </nav>

        <div className={cn("my-4 mx-3 border-t border-border", sidebarCollapsed && "mx-2")} />

        <nav className="px-3 space-y-1">
          {!sidebarCollapsed && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
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

      <div className="border-t border-border p-3 space-y-1">
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
            "w-full justify-center mt-2",
            !sidebarCollapsed && "justify-end"
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          data-testid="button-toggle-sidebar"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <span className="text-xs text-muted-foreground mr-2">Collapse</span>
              <ChevronLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

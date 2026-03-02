import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinOpsStore, formatCurrency } from '@/lib/finops-store';
import { getProviderConfig } from '@/lib/provider-config';
import { useMemo, useState } from 'react';
import {
  IconBell,
  IconAlertTriangle,
  IconTrendingUp,
  IconBulb,
  IconTarget,
  IconServer2,
  IconCheck,
  IconTrash,
  IconFilter,
  IconChecks,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  category: 'budget' | 'anomaly' | 'recommendation' | 'resource' | 'savings' | 'system';
  timestamp: Date;
  read: boolean;
}

function generateNotifications(provider: string): Notification[] {
  const config = getProviderConfig(provider as any);
  const now = new Date();

  return [
    {
      id: 'n1',
      title: 'Budget threshold exceeded',
      message: `Production environment spending has reached 92% of the monthly budget ($47,840 of $52,000). Consider reviewing recent deployments.`,
      type: 'alert',
      category: 'budget',
      timestamp: new Date(now.getTime() - 2 * 60 * 1000),
      read: false,
    },
    {
      id: 'n2',
      title: 'Cost anomaly detected',
      message: `Unusual spike in ${config.shortName} compute costs detected — +34% above baseline in the last 6 hours. Investigation recommended.`,
      type: 'warning',
      category: 'anomaly',
      timestamp: new Date(now.getTime() - 60 * 60 * 1000),
      read: false,
    },
    {
      id: 'n3',
      title: '3 new rightsizing recommendations',
      message: `New optimization opportunities found for underutilized instances. Estimated monthly savings: $2,340 (18% reduction).`,
      type: 'info',
      category: 'recommendation',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: 'n4',
      title: 'Savings Plan utilization low',
      message: `Current Savings Plan utilization dropped to 67%. Consider adjusting commitment levels or shifting workloads.`,
      type: 'warning',
      category: 'savings',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 'n5',
      title: 'Idle resources detected',
      message: `4 running instances have had less than 5% CPU utilization for 72+ hours. Potential monthly waste: $890.`,
      type: 'warning',
      category: 'resource',
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 'n6',
      title: 'Monthly cost report ready',
      message: `Your February 2026 cost report for ${config.shortName} has been generated and is ready for download.`,
      type: 'success',
      category: 'system',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 'n7',
      title: 'Staging budget alert',
      message: `Staging environment has consumed 78% of its allocated budget with 12 days remaining in the billing cycle.`,
      type: 'warning',
      category: 'budget',
      timestamp: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 'n8',
      title: 'Untagged resources found',
      message: `17 new resources detected without required cost allocation tags. Tag compliance is at 84%.`,
      type: 'info',
      category: 'resource',
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 'n9',
      title: 'Reserved capacity expiring',
      message: `2 reserved instances are expiring in 14 days. Review and renew to avoid on-demand pricing.`,
      type: 'alert',
      category: 'savings',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 'n10',
      title: 'Cost forecast updated',
      message: `Updated end-of-month forecast: $156,200 (previously $148,500). Primary driver: increased data transfer costs.`,
      type: 'info',
      category: 'anomaly',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ];
}

const typeConfig = {
  alert: { color: 'bg-destructive', label: 'Critical' },
  warning: { color: 'bg-amber-500', label: 'Warning' },
  info: { color: 'bg-blue-500', label: 'Info' },
  success: { color: 'bg-emerald-500', label: 'Success' },
};

const categoryConfig = {
  budget: { icon: IconTarget, label: 'Budget' },
  anomaly: { icon: IconAlertTriangle, label: 'Anomaly' },
  recommendation: { icon: IconBulb, label: 'Recommendation' },
  resource: { icon: IconServer2, label: 'Resource' },
  savings: { icon: IconTrendingUp, label: 'Savings' },
  system: { icon: IconBell, label: 'System' },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const { selectedProvider } = useFinOpsStore();

  const [notifications, setNotifications] = useState(() => generateNotifications(selectedProvider));
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = notifications;
    if (filter === 'unread') result = result.filter(n => !n.read);
    if (filter === 'read') result = result.filter(n => n.read);
    if (typeFilter !== 'all') result = result.filter(n => n.category === typeFilter);
    return result;
  }, [notifications, filter, typeFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1200px] mx-auto" data-testid="notifications-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <IconBell className="h-6 w-6" />
                Notifications
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <IconChecks className="h-4 w-4 mr-1.5" />
                Mark all as read
              </Button>
            )}
          </div>
        </motion.div>

        <div className="flex items-center gap-3 mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <IconFilter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="anomaly">Anomaly</SelectItem>
              <SelectItem value="recommendation">Recommendation</SelectItem>
              <SelectItem value="resource">Resource</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
          {[
            { label: 'Total', count: notifications.length, color: 'text-foreground' },
            { label: 'Unread', count: unreadCount, color: 'text-destructive' },
            { label: 'Critical', count: notifications.filter(n => n.type === 'alert').length, color: 'text-destructive' },
            { label: 'Warnings', count: notifications.filter(n => n.type === 'warning').length, color: 'text-amber-500' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50 backdrop-blur-sm border-card-border">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <IconBell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No notifications match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((notification, index) => {
                  const catConfig = categoryConfig[notification.category];
                  const CatIcon = catConfig.icon;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.03 * index }}
                      className={cn(
                        "flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group",
                        !notification.read && "bg-primary/[0.03]"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full mt-1.5",
                          typeConfig[notification.type].color,
                          notification.read && "opacity-30"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn(
                            "text-sm font-medium",
                            notification.read ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {notification.title}
                          </span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-1">
                            <CatIcon className="h-2.5 w-2.5" />
                            {catConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <IconCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

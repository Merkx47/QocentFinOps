import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinOpsStore, DEFAULT_EXCHANGE_RATES } from '@/lib/finops-store';
import { useToast } from '@/hooks/use-toast';
import { getProviderConfig } from '@/lib/provider-config';
import { currencyInfo } from '@shared/schema';
import type { Currency, Language } from '@shared/schema';
import {
  IconSettings as SettingsIcon,
  IconUserCircle,
  IconBell,
  IconShieldCheck,
  IconKey,
  IconWorld,
  IconLoader2,
  IconCircleCheck,
  IconArrowsExchange,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Settings() {
  const { currency, setCurrency, language, setLanguage, selectedProvider, user, login, exchangeRates, setExchangeRates, resetExchangeRates } = useFinOpsStore();
  const { toast } = useToast();
  const config = getProviderConfig(selectedProvider);
  const creds = config.terminology.credentialLabels;

  // Profile state
  const nameParts = (user?.name || 'Admin User').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [email, setEmail] = useState(user?.email || 'admin@company.com');

  // Provider connection state
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Exchange rates state
  const [localRates, setLocalRates] = useState<Record<Currency, string>>(() => {
    const rates = {} as Record<Currency, string>;
    for (const code of Object.keys(exchangeRates) as Currency[]) {
      rates[code] = String(exchangeRates[code]);
    }
    return rates;
  });

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1200px] mx-auto" data-testid="settings-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </motion.div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconUserCircle className="h-5 w-5 text-primary" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Admin" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="User" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="admin@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <Button onClick={() => {
                    const fullName = `${firstName} ${lastName}`.trim();
                    login(selectedProvider, { name: fullName, email, role: user?.role || 'Administrator' });
                    toast({ title: "Settings Saved", description: "Your profile settings have been updated" });
                  }}>Save Changes</Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconWorld className="h-5 w-5 text-primary" />
                    Display Preferences
                  </CardTitle>
                  <CardDescription>Customize your dashboard experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Display Language</Label>
                    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English — English</SelectItem>
                        <SelectItem value="fr">Fran&#231;ais — French</SelectItem>
                        <SelectItem value="es">Espa&#241;ol — Spanish</SelectItem>
                        <SelectItem value="pt">Portugu&#234;s — Portuguese</SelectItem>
                        <SelectItem value="zh">&#31616;&#20307;&#20013;&#25991; — Chinese</SelectItem>
                        <SelectItem value="ar">&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577; — Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Powered by Google Translate</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="utc">
                      <SelectTrigger className="w-[250px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="america-new_york">America/New York (EST)</SelectItem>
                        <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                        <SelectItem value="europe-berlin">Europe/Berlin (CET)</SelectItem>
                        <SelectItem value="asia-tokyo">Asia/Tokyo (JST)</SelectItem>
                        <SelectItem value="asia-singapore">Asia/Singapore (SGT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconArrowsExchange className="h-5 w-5 text-primary" />
                    Exchange Rates
                  </CardTitle>
                  <CardDescription>
                    Set custom exchange rates relative to USD (base currency). Rates apply across all providers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Object.keys(currencyInfo) as Currency[]).map((code) => {
                      const info = currencyInfo[code];
                      const isBase = code === 'USD';
                      return (
                        <div key={code} className="flex items-center gap-3">
                          <span className="text-lg w-7 text-center">{info.flag}</span>
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={`rate-${code}`} className="text-sm font-medium">
                              {code} <span className="text-muted-foreground font-normal">— {info.name}</span>
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">1 USD =</span>
                              <Input
                                id={`rate-${code}`}
                                type="number"
                                step="any"
                                min="0"
                                value={isBase ? '1' : localRates[code]}
                                disabled={isBase}
                                className={`h-8 text-sm font-mono ${isBase ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onChange={(e) => {
                                  setLocalRates((prev) => ({
                                    ...prev,
                                    [code]: e.target.value,
                                  }));
                                }}
                              />
                              <span className="text-xs text-muted-foreground font-medium">{info.symbol}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => {
                        const parsed: Record<string, number> = { USD: 1.0 };
                        for (const [code, val] of Object.entries(localRates)) {
                          if (code === 'USD') continue;
                          const num = parseFloat(val);
                          if (isNaN(num) || num <= 0) {
                            toast({ title: "Invalid Rate", description: `Please enter a valid positive number for ${code}`, variant: "destructive" });
                            return;
                          }
                          parsed[code] = num;
                        }
                        setExchangeRates(parsed as Record<Currency, number>);
                        toast({ title: "Exchange Rates Updated", description: "Custom rates have been saved and applied globally" });
                      }}
                    >
                      Save Rates
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        resetExchangeRates();
                        const resetLocal = {} as Record<Currency, string>;
                        for (const [code, rate] of Object.entries(DEFAULT_EXCHANGE_RATES)) {
                          resetLocal[code as Currency] = String(rate);
                        }
                        setLocalRates(resetLocal);
                        toast({ title: "Rates Reset", description: "Exchange rates restored to defaults" });
                      }}
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconBell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose what notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { id: 'budget', label: 'Budget Alerts', desc: 'Get notified when spending exceeds thresholds' },
                    { id: 'anomaly', label: 'Cost Anomalies', desc: 'Alerts for unusual spending patterns' },
                    { id: 'recommendations', label: 'New Recommendations', desc: 'Updates on new optimization opportunities' },
                    { id: 'reports', label: 'Report Ready', desc: 'Notification when scheduled reports are ready' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={item.id} className="font-medium">{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch id={item.id} defaultChecked />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconKey className="h-5 w-5 text-primary" />
                    Cloud API Credentials
                  </CardTitle>
                  <CardDescription>Connect to {config.name} for live data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key1">{creds.key1}</Label>
                    <Input id="key1" type="password" placeholder={`Enter your ${creds.key1.toLowerCase()}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key2">{creds.key2}</Label>
                    <Input id="key2" type="password" placeholder={`Enter your ${creds.key2.toLowerCase()}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key3">{creds.key3}</Label>
                    <Input id="key3" placeholder={`Enter your ${creds.key3.toLowerCase()}`} />
                  </div>
                  <Button
                    disabled={connecting || connected}
                    onClick={() => {
                      setConnecting(true);
                      setTimeout(() => {
                        setConnecting(false);
                        setConnected(true);
                        toast({ title: "Connected", description: `Successfully connected to ${config.shortName}` });
                      }, 2000);
                    }}
                  >
                    {connecting ? (
                      <><IconLoader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                    ) : connected ? (
                      <><IconCircleCheck className="h-4 w-4 mr-2" />Connected</>
                    ) : (
                      <>Connect to {config.shortName}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <IconShieldCheck className="h-5 w-5 text-primary" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label>Change Password</Label>
                    <div className="space-y-2">
                      <Input type="password" placeholder="Current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                      <Input type="password" placeholder="New password (min 8 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      <Button variant="outline" onClick={() => {
                        if (oldPassword !== 'password') {
                          toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
                          return;
                        }
                        if (newPassword.length < 8) {
                          toast({ title: "Error", description: "New password must be at least 8 characters", variant: "destructive" });
                          return;
                        }
                        toast({ title: "Password Updated", description: "Your password has been changed successfully" });
                        setOldPassword('');
                        setNewPassword('');
                      }}>Update</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

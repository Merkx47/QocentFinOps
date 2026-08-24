import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { IconArrowLeft, IconMail, IconLock, IconShieldCheck, IconBolt, IconChartBar, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinOpsStore } from '@/lib/finops-store';
import type { CloudProvider } from '@/lib/provider-config';
import { getProviderConfig } from '@/lib/provider-config';
import { AWSLogo, AzureLogo, GCPIcon } from '@/components/provider-logos';
import huaweiLogo from '@assets/image_1764758201045.png';

import { useState } from 'react';

function ProviderLogo({ provider }: { provider: CloudProvider }) {
  if (provider === 'aws') return <AWSLogo className="h-14 w-auto" />;
  if (provider === 'azure') return <AzureLogo className="h-14 w-auto" />;
  if (provider === 'gcp') return <GCPIcon className="h-14 w-auto" />;
  return <img src={huaweiLogo} alt="Huawei Cloud" className="h-14 w-auto object-contain" />;
}

const features = [
  { icon: IconChartBar, text: 'Real-time cost analytics & forecasting' },
  { icon: IconBolt, text: 'AI-powered optimization recommendations' },
  { icon: IconShieldCheck, text: 'Enterprise-grade security & compliance' },
];

export default function Login() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const providerId = (params.get('provider') || 'huawei') as CloudProvider;
  const config = getProviderConfig(providerId);
  const { login } = useFinOpsStore();
  const [email, setEmail] = useState('admin@qucoon.com');
  const [password, setPassword] = useState('password');
  const [ssoLoading, setSsoLoading] = useState(false);

  const handleSSOLogin = () => {
    setSsoLoading(true);
    setTimeout(() => {
      login(providerId, { name: 'Admin User', email: 'admin@qucoon.com', role: 'Administrator' });
      navigate('/dashboard');
    }, 1800);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(providerId, { name: 'Admin User', email, role: 'Administrator' });
    navigate('/dashboard');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-center p-14"
        style={{ background: config.colors.gradient }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 space-y-10"
        >
          <div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-5">
              One Window,<br />All Cloud.
            </h2>
            <p className="text-white/70 text-xl leading-relaxed max-w-sm">
              Manage and optimize your {config.shortName} cloud costs from a single, intelligent platform.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg text-white/90">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute bottom-8 left-14 z-10 text-sm text-white/40"
        >
          Qocent FinOps Platform
        </motion.p>
      </div>

      <div className="flex-1 bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-card shadow-lg border border-border flex items-center justify-center mb-5">
              <ProviderLogo provider={providerId} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{config.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to your FinOps dashboard</p>
          </div>

          <div className="space-y-5">
            <Button
              onClick={handleSSOLogin}
              disabled={ssoLoading}
              className="w-full h-12 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-90"
              style={{
                background: config.colors.gradient,
              }}
            >
              {ssoLoading ? (
                <span className="flex items-center gap-2">
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Redirecting to identity provider...
                </span>
              ) : (
                config.terminology.ssoButtonLabel
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center -mt-2">
              {ssoLoading ? 'Please wait...' : "Use your organization's identity provider"}
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-3 text-muted-foreground text-xs">
                  or sign in with credentials
                </span>
              </div>
            </div>

            <form onSubmit={handleFormLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-muted-foreground text-xs font-medium">Email</Label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-background border-input text-foreground rounded-xl focus:ring-2 focus:ring-offset-0 transition-shadow"
                    style={{ ['--tw-ring-color' as string]: config.colors.primary + '30' }}
                    placeholder="admin@qucoon.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-muted-foreground text-xs font-medium">Password</Label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-background border-input text-foreground rounded-xl focus:ring-2 focus:ring-offset-0 transition-shadow"
                    style={{ ['--tw-ring-color' as string]: config.colors.primary + '30' }}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 rounded-xl"
              >
                Sign In
              </Button>
            </form>
          </div>

          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mt-8 mx-auto transition-colors group"
          >
            <IconArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">Back to provider selection</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Shield, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinOpsStore } from '@/lib/finops-store';
import type { CloudProvider } from '@/lib/provider-config';
import { getProviderConfig } from '@/lib/provider-config';
import { AWSLogo, AzureLogo, GCPIcon } from '@/components/provider-logos';
import huaweiLogo from '@assets/image_1764758201045.png';
import qocentLogo from '@assets/qocent-logo_1772143895241.png';
import { useState } from 'react';

function ProviderLogo({ provider }: { provider: CloudProvider }) {
  if (provider === 'aws') return <AWSLogo className="h-14 w-auto" />;
  if (provider === 'azure') return <AzureLogo className="h-14 w-auto" />;
  if (provider === 'gcp') return <GCPIcon className="h-14 w-auto" />;
  return <img src={huaweiLogo} alt="Huawei Cloud" className="h-14 w-auto object-contain" />;
}

const features = [
  { icon: BarChart3, text: 'Real-time cost analytics & forecasting' },
  { icon: Zap, text: 'AI-powered optimization recommendations' },
  { icon: Shield, text: 'Enterprise-grade security & compliance' },
];

export default function Login() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const providerId = (params.get('provider') || 'huawei') as CloudProvider;
  const config = getProviderConfig(providerId);
  const { login } = useFinOpsStore();
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password');

  const handleSSOLogin = () => {
    login(providerId, { name: 'Admin User', email: 'admin@company.com', role: 'Administrator' });
    navigate('/dashboard');
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
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: config.colors.gradient }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <img src={qocentLogo} alt="Qocent" className="h-8 w-auto brightness-0 invert" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 space-y-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              One Window,<br />All Cloud.
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Manage and optimize your {config.shortName} cloud costs from a single, intelligent platform.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-white/90">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="relative z-10 text-xs text-white/40"
        >
          Qocent FinOps Platform
        </motion.p>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg shadow-slate-200/60 border border-slate-100 flex items-center justify-center mb-5">
              <ProviderLogo provider={providerId} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{config.name}</h1>
            <p className="text-slate-400 mt-1 text-sm">Sign in to your FinOps dashboard</p>
          </div>

          <div className="space-y-5">
            <Button
              onClick={handleSSOLogin}
              className="w-full h-12 text-white font-medium rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              style={{
                background: config.colors.gradient,
              }}
            >
              {config.terminology.ssoButtonLabel}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gradient-to-br from-slate-50 via-white to-slate-50 px-3 text-slate-400 text-xs">
                  or sign in with email
                </span>
              </div>
            </div>

            <form onSubmit={handleFormLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-600 text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-50/80 border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-offset-0 transition-shadow"
                    style={{ ['--tw-ring-color' as string]: config.colors.primary + '30' }}
                    placeholder="admin@company.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-600 text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-slate-50/80 border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-offset-0 transition-shadow"
                    style={{ ['--tw-ring-color' as string]: config.colors.primary + '30' }}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full h-11 border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50"
              >
                Sign In
              </Button>
            </form>
          </div>

          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-700 mt-8 mx-auto transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">Back to provider selection</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}

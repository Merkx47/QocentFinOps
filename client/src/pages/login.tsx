import { useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinOpsStore } from '@/lib/finops-store';
import type { CloudProvider } from '@/lib/provider-config';
import { getProviderConfig } from '@/lib/provider-config';
import { AWSLogo, AzureLogo, GCPLogo } from '@/components/provider-logos';
import huaweiLogo from '@assets/image_1764758201045.png';
import { useState } from 'react';

function ProviderLogo({ provider }: { provider: CloudProvider }) {
  if (provider === 'aws') return <AWSLogo className="h-16 w-auto" />;
  if (provider === 'azure') return <AzureLogo className="h-16 w-auto" />;
  if (provider === 'gcp') return <GCPLogo className="h-16 w-auto" />;
  return <img src={huaweiLogo} alt="Huawei Cloud" className="h-16 w-auto object-contain" />;
}

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <ProviderLogo provider={providerId} />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">{config.name}</h1>
          <p className="text-gray-500 mt-1">FinOps Dashboard</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <Button
            onClick={handleSSOLogin}
            className="w-full h-12 text-white font-medium mb-6"
            style={{ backgroundColor: config.colors.primary }}
          >
            {config.terminology.ssoButtonLabel}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                  placeholder="admin@company.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                  placeholder="Enter password"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full h-10 border-gray-300 text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Button>
          </form>
        </div>

        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mt-6 mx-auto transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to provider selection</span>
        </button>
      </motion.div>
    </div>
  );
}
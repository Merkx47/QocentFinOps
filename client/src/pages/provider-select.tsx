import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useFinOpsStore } from '@/lib/finops-store';
import type { CloudProvider } from '@/lib/provider-config';
import { getProviderConfig, allProviders } from '@/lib/provider-config';
import { AWSLogo, AzureLogo, GCPLogo } from '@/components/provider-logos';
import huaweiLogo from '@assets/image_1764758201045.png';

function ProviderIcon({ provider }: { provider: CloudProvider }) {
  if (provider === 'aws') return <AWSLogo className="h-12 w-auto" />;
  if (provider === 'azure') return <AzureLogo className="h-12 w-auto" />;
  if (provider === 'gcp') return <GCPLogo className="h-12 w-auto" />;
  return <img src={huaweiLogo} alt="Huawei Cloud" className="h-12 w-auto object-contain" />;
}

export default function ProviderSelect() {
  const [, navigate] = useLocation();
  const { setSelectedProvider } = useFinOpsStore();

  const handleSelect = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    navigate(`/login?provider=${provider}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Multi-Cloud FinOps Platform</h1>
          <p className="text-gray-500">Select your cloud provider to continue</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          {allProviders.map((providerId, index) => {
            const config = getProviderConfig(providerId);
            return (
              <motion.button
                key={providerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(providerId)}
                className="relative flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-gray-200 bg-white shadow-sm cursor-pointer transition-shadow hover:shadow-md group"
              >
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity"
                  style={{ backgroundColor: config.colors.primary }}
                />
                <ProviderIcon provider={providerId} />
                <div className="text-center relative z-10">
                  <h2 className="text-lg font-semibold text-gray-900">{config.shortName}</h2>
                  <p className="text-sm text-gray-500 mt-1">{config.tagline}</p>
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl"
                  style={{ background: config.colors.gradient }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
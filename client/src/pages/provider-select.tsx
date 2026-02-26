import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useFinOpsStore } from '@/lib/finops-store';
import type { CloudProvider } from '@/lib/provider-config';
import { getProviderConfig, allProviders } from '@/lib/provider-config';
import { AWSLogo, AzureLogo, GCPIcon } from '@/components/provider-logos';
import huaweiLogo from '@assets/image_1764758201045.png';
import qocentLogo from '@assets/qocent-logo_1772143895241.png';
import { IconArrowRight } from '@tabler/icons-react';

const cardStyles: Record<CloudProvider, { bg: string; border: string; hoverBorder: string; iconBg: string; iconBorder: string }> = {
  aws: {
    bg: 'bg-orange-50/60',
    border: 'border-orange-200/50',
    hoverBorder: 'hover:border-orange-300',
    iconBg: 'bg-orange-100/60',
    iconBorder: 'border-orange-200/40',
  },
  azure: {
    bg: 'bg-blue-50/60',
    border: 'border-blue-200/50',
    hoverBorder: 'hover:border-blue-300',
    iconBg: 'bg-blue-100/60',
    iconBorder: 'border-blue-200/40',
  },
  gcp: {
    bg: 'bg-sky-50/60',
    border: 'border-sky-200/50',
    hoverBorder: 'hover:border-sky-300',
    iconBg: 'bg-sky-100/60',
    iconBorder: 'border-sky-200/40',
  },
  huawei: {
    bg: 'bg-red-50/60',
    border: 'border-red-200/50',
    hoverBorder: 'hover:border-red-300',
    iconBg: 'bg-red-100/60',
    iconBorder: 'border-red-200/40',
  },
};

function ProviderIcon({ provider }: { provider: CloudProvider }) {
  if (provider === 'aws') return <AWSLogo className="h-10 w-auto" />;
  if (provider === 'azure') return <AzureLogo className="h-10 w-auto" />;
  if (provider === 'gcp') return <GCPIcon className="h-10 w-auto" />;
  return <img src={huaweiLogo} alt="Huawei Cloud" className="h-10 w-auto object-contain" />;
}

export default function ProviderSelect() {
  const [, navigate] = useLocation();
  const { setSelectedProvider } = useFinOpsStore();

  const handleSelect = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    navigate(`/login?provider=${provider}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-50/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-50/60 blur-3xl" />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <img src={qocentLogo} alt="Qocent" className="h-12 w-auto mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
            Qocent FinOps
          </h1>
          <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            Select your cloud provider to get started with cost analytics and optimization
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allProviders.map((providerId, index) => {
            const config = getProviderConfig(providerId);
            const styles = cardStyles[providerId];
            return (
              <motion.button
                key={providerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(providerId)}
                className={`group relative flex items-center gap-5 p-5 rounded-2xl border ${styles.bg} ${styles.border} ${styles.hoverBorder} backdrop-blur-sm shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg text-left`}
              >
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${styles.iconBg} border ${styles.iconBorder} flex items-center justify-center transition-colors duration-300`}>
                  <ProviderIcon provider={providerId} />
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <h2 className="text-base font-semibold text-slate-900 mb-0.5">
                    {config.shortName}
                  </h2>
                  <p className="text-sm text-slate-500 leading-snug">{config.tagline}</p>
                </div>

                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                  <IconArrowRight
                    className="h-4 w-4 transition-colors duration-300"
                    style={{ color: config.colors.primary }}
                  />
                </div>

                <div
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: config.colors.gradient }}
                />
              </motion.button>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center text-xs text-slate-400 mt-10"
        >
          One Window, All Cloud
        </motion.p>
      </div>
    </div>
  );
}

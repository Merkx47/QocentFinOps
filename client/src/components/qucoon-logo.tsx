import { cn } from '@/lib/utils';
import qucoonLogoOnLight from '@assets/qucoon-logo-dark.svg';
import qucoonLogoOnDark from '@assets/qucoon-logo-light.svg';

/**
 * Qucoon wordmark. Two files rather than one recoloured file — the artwork carries
 * its own fills — swapped by the `dark` class on <html>.
 */
export function QucoonLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <>
      <img
        src={qucoonLogoOnLight}
        alt="Qucoon"
        className={cn('object-contain dark:hidden', className)}
        draggable={false}
      />
      <img
        src={qucoonLogoOnDark}
        alt="Qucoon"
        className={cn('object-contain hidden dark:block', className)}
        draggable={false}
      />
    </>
  );
}

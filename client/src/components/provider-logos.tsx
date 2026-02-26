import awsLogoUrl from '@assets/aws-logo.svg';
import azureLogoUrl from '@assets/azure-logo.svg';
import gcpLogoUrl from '@assets/gcp-logo.svg';
import gcpIconUrl from '@assets/gcp-icon.svg';

export function AWSLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src={awsLogoUrl} alt="Amazon Web Services" className={className} />;
}

export function AzureLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src={azureLogoUrl} alt="Microsoft Azure" className={className} />;
}

export function GCPLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src={gcpLogoUrl} alt="Google Cloud Platform" className={className} />;
}

export function GCPIcon({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src={gcpIconUrl} alt="Google Cloud Platform" className={className} />;
}
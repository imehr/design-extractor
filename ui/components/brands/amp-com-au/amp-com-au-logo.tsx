import Image from "next/image";

export function AmpLogo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brands/amp-com-au/amp-logo.svg"
      alt="AMP logo"
      width={113}
      height={51}
      className={className}
      priority
    />
  );
}

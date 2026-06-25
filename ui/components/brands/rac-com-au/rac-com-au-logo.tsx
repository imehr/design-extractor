import Image from "next/image";

export function RacComAuLogo({
  className = "h-16 w-auto",
}: {
  className?: string;
}) {
  return (
    <Image
      src="/brands/rac-com-au/RAC-site-logo-mobile.png"
      alt="RAC - For the better - logo"
      width={120}
      height={106}
      className={className}
      priority
    />
  );
}

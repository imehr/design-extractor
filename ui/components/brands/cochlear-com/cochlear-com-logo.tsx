import Image from "next/image";

export function CochlearLogo({ className = "h-auto w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brands/cochlear-com/45f3cdfbe24641b69870beed740063ac"
      alt="Cochlear logo"
      width={196}
      height={164}
      className={className}
      priority
      unoptimized
    />
  );
}

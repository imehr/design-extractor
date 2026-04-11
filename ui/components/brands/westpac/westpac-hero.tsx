import Image from "next/image";

interface WestpacHeroProps {
  heading: string;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
}

export function WestpacHero({
  heading = "BOOK A HOME LENDER IN MINUTES",
  subtitle = "Our home loan specialists are here for you, ready to help when and where you need us.",
  ctaText = "Find out more",
  ctaHref = "#",
}: WestpacHeroProps) {
  return (
    <div className="relative w-full overflow-hidden bg-[#DA1710]" style={{ height: 424 }}>
      {/* Hero background image — contains the red bg + phone mockup */}
      <div className="absolute inset-0">
        <Image
          src="/brands/westpac/hero-home.png"
          alt=""
          fill
          className="object-cover object-right"
          priority
        />
      </div>

      {/* Text overlay */}
      <div className="relative mx-auto max-w-[1280px] px-[60px] pt-[90px]">
        <div className="max-w-[765px]">
          <h1
            className="mb-4 text-white"
            style={{
              fontFamily: '"Westpac-bold", "Times New Roman", Times, serif',
              fontSize: "72px",
              fontWeight: 400,
              lineHeight: "64.8px",
            }}
          >
            {heading}
          </h1>
          <p className="mb-6 max-w-[480px] text-base leading-6 text-white/95">
            {subtitle}
          </p>
          <a
            href={ctaHref}
            className="inline-flex h-[42px] items-center rounded-[3px] border border-[#DA1710] bg-white px-5 text-base text-[#181B25] hover:bg-white/90"
          >
            {ctaText}
          </a>
        </div>
      </div>
    </div>
  );
}

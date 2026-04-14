import Link from "next/link";
import Image from "next/image";

interface NineHeroProps {
  heading: string;
  description?: string;
  showLogo?: boolean;
  variant?: "video" | "gradient" | "internal";
  ctaText?: string;
  ctaHref?: string;
  align?: "center" | "left";
}

const GRADIENT_MAP = {
  video: "linear-gradient(to bottom, #070720 0%, #0a1628 40%, #0d2040 70%, #0493de 100%)",
  gradient: "linear-gradient(to bottom, #0a7cc4 0%, #1fa8e8 35%, #3ec8f8 65%, #5dd8ff 100%)",
  internal: "linear-gradient(236.88deg, #111143, #070720)",
};

export function NineHero({
  heading,
  description,
  showLogo = false,
  variant = "gradient",
  ctaText,
  ctaHref = "#",
  align = "center",
}: NineHeroProps) {
  const isLeft = align === "left";
  return (
    <section
      data-component="hero"
      className={`relative flex w-full items-center overflow-hidden ${variant === "internal" ? "min-h-[200px]" : "min-h-[420px]"}`}
      style={{
        fontFamily: '"Proxima Nova", Arial, sans-serif',
        background: GRADIENT_MAP[variant],
        justifyContent: isLeft ? "flex-start" : "center",
      }}
    >
      {/* Content */}
      <div className={`relative z-10 mx-auto w-full max-w-[1200px] px-4 py-[84px] ${isLeft ? "text-left" : "text-center"}`}>
        <h1 className={`font-[800] leading-[1.2] tracking-[0.25px] ${variant === "internal" ? "text-[36px] text-[#0493de]" : "text-[48px] text-white"}`}>
          {heading}
        </h1>

        {showLogo && (
          <div className={`mt-6 ${isLeft ? "" : "flex justify-center"}`}>
            <Image
              src="/brands/nineforbrands-com-au/Nine_FullColour_RGB.png"
              alt="Nine"
              width={200}
              height={52}
              className="h-[52px] w-auto"
            />
          </div>
        )}

        {description && (
          <p className={`mt-6 text-[16px] leading-[1.6] text-white/80 ${isLeft ? "max-w-[700px]" : "mx-auto max-w-[800px]"}`}>
            {description}
          </p>
        )}

        {ctaText && (
          <div className="mt-8">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-[100px] bg-[#0493de] px-8 py-3 text-[14px] font-[800] tracking-[0.5px] text-white transition-colors duration-300 hover:bg-[#037ab8]"
              data-component="button-set"
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
      {/* Blue accent bar at bottom of hero */}
      {variant === "internal" && (
        <div className="absolute inset-x-0 bottom-0 h-[4px] bg-[#0493de]" />
      )}
    </section>
  );
}

export function NineSubscribeBanner() {
  return (
    <section className="w-full bg-[#070720] py-[36px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 md:flex-row md:justify-center md:gap-8">
        <h2
          className="text-[18px] font-[800] tracking-[0.25px] text-white"
          style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
        >
          Subscribe to Nine Insights today
        </h2>
        <Link
          href="#"
          className="inline-flex items-center rounded-[100px] bg-[#0493de] px-6 py-3 text-[14px] font-[800] tracking-[0.5px] text-white transition-colors duration-300 hover:bg-[#037ab8]"
        >
          Sign up
        </Link>
      </div>
    </section>
  );
}

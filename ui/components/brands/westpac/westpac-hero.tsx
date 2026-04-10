import { Button } from "@/components/ui/button";
import { WestpacLogo } from "./westpac-logo";

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
    <div className="w-full bg-[#DA1710]" style={{ padding: "48px 0" }}>
      <div className="mx-auto flex max-w-[1280px] items-start gap-10 px-6">
        {/* Left: Text */}
        <div className="flex-1 pt-4">
          <h1
            className="mb-4 max-w-[765px] text-white"
            style={{
              fontFamily: '"Westpac-bold", "Times New Roman", Times, serif',
              fontSize: "72px",
              fontWeight: 400,
              lineHeight: "64.8px",
            }}
          >
            {heading}
          </h1>
          <p className="mb-6 max-w-[600px] text-base leading-6 text-white/95">
            {subtitle}
          </p>
          <a
            href={ctaHref}
            className="inline-flex h-[42px] items-center rounded-[3px] border border-[#DA1710] bg-white px-5 text-base text-[#181B25] hover:bg-white/90"
          >
            {ctaText}
          </a>
        </div>

        {/* Right: Phone mockup */}
        <div className="hidden flex-shrink-0 md:block" style={{ width: 300 }}>
          <div className="ml-auto w-[220px] rounded-[28px] bg-white p-2 shadow-xl">
            <div className="flex min-h-[380px] flex-col items-center rounded-[20px] bg-[#F3F4F6] px-4 py-5">
              <WestpacLogo className="mb-3 h-[14px] w-[36px]" />
              <p className="mb-3 text-center text-[11px] text-[#575F65]">
                How would you like to
                <br />
                connect with us?
              </p>
              <div className="flex w-full flex-col gap-2">
                <div className="rounded-lg bg-white p-2.5 text-[13px] text-[#181B25] shadow-sm">
                  Phone call
                </div>
                <div className="rounded-lg bg-white p-2.5 text-[13px] text-[#181B25] shadow-sm">
                  Video call
                </div>
                <div className="rounded-lg bg-white p-2.5 text-[13px] text-[#181B25] shadow-sm">
                  In branch
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

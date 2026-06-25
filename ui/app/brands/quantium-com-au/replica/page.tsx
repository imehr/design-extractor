"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

const QUANTIUM_FONT = "'QuantiumPro', -apple-system, system-ui, sans-serif";
const ROBOTO_FONT = "var(--font-roboto), 'Roboto', sans-serif";

/* ---------- Images from DOM extraction ---------- */

const HERO_PARTNER_LOGOS = [
  { src: "/brands/quantium-com-au/images/logo-Woolworths_Group.svg", alt: "Woolworths Group" },
  { src: "/brands/quantium-com-au/images/logo-Commonwealth_Bank.svg", alt: "Commonwealth Bank" },
  { src: "/brands/quantium-com-au/images/logo-Telstra.svg", alt: "Telstra" },
  { src: "/brands/quantium-com-au/images/logo-Discovery.svg", alt: "Discovery" },
  { src: "/brands/quantium-com-au/images/logo-Vitality.svg", alt: "Vitality" },
  { src: "/brands/quantium-com-au/images/Gates-foundation.png", alt: "Gates Foundation" },
  { src: "/brands/quantium-com-au/images/logo-nhs.svg", alt: "NHS" },
  { src: "/brands/quantium-com-au/images/logo-Walmart.svg", alt: "Walmart" },
  { src: "/brands/quantium-com-au/images/logo-ASDA.svg", alt: "ASDA" },
  { src: "/brands/quantium-com-au/images/logo-quantium.png", alt: "Quantium" },
  { src: "/brands/quantium-com-au/images/img-discovery-health.png", alt: "Discovery Health" },
  { src: "/brands/quantium-com-au/images/logo-iress.png", alt: "Iress" },
];

const PARTNER_LOGOS = [
  { src: "/brands/quantium-com-au/images/logo-Woolworths_Group.svg", alt: "Woolworths Group" },
  { src: "/brands/quantium-com-au/images/logo-Commonwealth_Bank.svg", alt: "Commonwealth Bank" },
  { src: "/brands/quantium-com-au/images/logo-Telstra.svg", alt: "Telstra" },
  { src: "/brands/quantium-com-au/images/logo-Discovery.svg", alt: "Discovery" },
  { src: "/brands/quantium-com-au/images/logo-Vitality.svg", alt: "Vitality" },
  { src: "/brands/quantium-com-au/images/Gates-foundation.png", alt: "Gates Foundation" },
  { src: "/brands/quantium-com-au/images/logo-nhs.svg", alt: "NHS" },
  { src: "/brands/quantium-com-au/images/logo-Walmart.svg", alt: "Walmart" },
  { src: "/brands/quantium-com-au/images/logo-ASDA.svg", alt: "ASDA" },
];

/* ---------- Page component ---------- */

export default function QuantiumHomePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: QUANTIUM_FONT }}>
      <QuantiumHeader />

      {/* ===== Alert Banner (from DOM hero) ===== */}
      <div
        className="flex w-full items-center justify-center px-4 py-4"
        style={{ backgroundColor: "black" }}
      >
        <span
          className="text-center text-[16px] text-white md:text-[18px]"
          style={{ fontFamily: ROBOTO_FONT }}
        >
          For an update on Quantium&apos;s COVID-19 response and business continuity plans, please{" "}
          <Link href="https://quantium.com/covid-19" className="underline hover:text-white/80">
            click here
          </Link>
        </span>
      </div>

      {/* ===== Section 1: Hero ===== */}
      <section
        className="relative w-full"
        style={{ backgroundColor: "rgb(0, 0, 6)" }}
        data-component="hero"
      >
        <div className="mx-auto max-w-[1280px] px-6 py-20 md:px-[100px] md:pb-24 md:pt-28">
          <h1
            className="mb-6 max-w-[600px] text-[36px] font-normal leading-tight text-white md:text-[48px] md:leading-[62px]"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Enterprise AI
            <br />
            for complex business
            <br />
            challenges
          </h1>
          <p
            className="mb-8 max-w-[520px] text-[18px] font-light leading-relaxed text-white md:text-[24px] md:leading-[28.8px]"
            style={{ fontFamily: ROBOTO_FONT }}
          >
            Cross-industry expertise built over 23 years.
          </p>
          <Link
            href="https://quantium.com/contact/"
            className="inline-flex h-auto items-center justify-center rounded-none border-2 border-white bg-white px-[30px] py-[18px] text-[20px] font-medium text-[rgb(0,0,6)] transition-colors hover:bg-white/90"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Talk to us
          </Link>

          {/* Partner logos from hero section images */}
          <div className="mt-16 flex flex-wrap items-center gap-8 md:gap-10">
            {HERO_PARTNER_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-[28px] w-auto object-contain opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 md:h-[32px]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 2: Trusted partners ===== */}
      <section className="w-full bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6 md:px-[100px]">
          <h2
            className="mb-12 text-[32px] font-medium leading-tight tracking-tight text-[rgb(0,0,6)] md:text-[48px] md:leading-[62px]"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Trusted partners to leading organisations
          </h2>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-6 md:justify-between md:gap-x-10">
            {PARTNER_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-[28px] w-auto object-contain opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 md:h-[36px]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 3: Why clients choose us ===== */}
      <section
        className="w-full py-16 md:py-24"
        style={{ backgroundColor: "rgb(11, 13, 18)" }}
      >
        <div className="mx-auto max-w-[1200px] px-6 md:px-[100px]">
          <h2
            className="mb-12 text-[32px] font-medium leading-tight tracking-tight text-white md:mb-16 md:text-[48px] md:leading-[62px]"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Why clients choose us
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div className="border-t border-white/20 pt-8">
              <span
                className="mb-4 block text-[14px] font-medium tracking-wider text-[#F25648]"
                style={{ fontFamily: ROBOTO_FONT }}
              >
                01
              </span>
              <h3
                className="mb-4 text-[20px] font-medium leading-snug text-white md:text-[22px]"
                style={{ fontFamily: QUANTIUM_FONT }}
              >
                Commercial outcomes first
              </h3>
              <p
                className="text-[16px] font-light leading-relaxed text-white/70"
                style={{ fontFamily: ROBOTO_FONT }}
              >
                We start with your strategic priorities: profitability, cost pressures, market
                position. We combine AI with your proprietary data and existing systems, getting more
                value from your technology investments and moving fast to commercial value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 4: How we work ===== */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6 md:px-[100px]">
          <h2
            className="mb-12 text-[32px] font-medium leading-tight tracking-tight text-[rgb(0,0,6)] md:mb-16 md:text-[48px] md:leading-[62px]"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            How we work
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div className="border-t border-[rgb(0,0,6)] pt-8">
              <h3
                className="mb-4 text-[20px] font-medium leading-snug text-[rgb(0,0,6)]"
                style={{ fontFamily: QUANTIUM_FONT }}
              >
                Built for business impact
              </h3>
              <p
                className="text-[16px] font-light leading-relaxed text-[rgb(0,0,6)]/70"
                style={{ fontFamily: ROBOTO_FONT }}
              >
                Commercial outcomes drive every decision. Systems designed, deployed, and tracked
                against the results that matter to your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 5: Perspectives ===== */}
      <section className="w-full bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6 md:px-[100px]">
          <h2
            className="mb-8 max-w-[700px] text-[28px] font-medium leading-tight tracking-tight text-[rgb(0,0,6)] md:mb-10 md:text-[36px] md:leading-[48px]"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Your AI can do more than your organisation knows how to ask for
          </h2>
          <p
            className="mb-12 max-w-[700px] text-[16px] font-light leading-relaxed text-[rgb(0,0,6)]/70 md:text-[18px]"
            style={{ fontFamily: ROBOTO_FONT }}
          >
            The organisations seeing lasting impact with AI are not the ones who made perfect
            technology bets. They are the ones who built in a way that lets them adapt. Here, we
            share where to focus investment and how to build for flexibility.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <article className="group cursor-pointer border-t border-[#E5E5E5] pt-6">
              <h3
                className="mb-3 text-[18px] font-medium leading-snug text-[rgb(0,0,6)] transition-colors group-hover:text-[#F25648]"
                style={{ fontFamily: QUANTIUM_FONT }}
              >
                Stop building for stability
              </h3>
              <p
                className="text-[15px] font-light leading-relaxed text-[rgb(0,0,6)]/60"
                style={{ fontFamily: ROBOTO_FONT }}
              >
                The organisations seeing lasting impact with AI are not the ones who made perfect
                technology bets. They are the ones who built in a way that lets them adapt.
              </p>
              <div
                className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[#F25648]"
                style={{ fontFamily: ROBOTO_FONT }}
              >
                Read more
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <QuantiumFooter />
    </div>
  );
}

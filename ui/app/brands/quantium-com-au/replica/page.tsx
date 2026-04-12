"use client";

import { QtHeader } from "@/components/brands/quantium-com-au/qt-header";
import { QtFooter } from "@/components/brands/quantium-com-au/qt-footer";
import Link from "next/link";

const QUANTIUM_FONT = "'QuantiumPro', -apple-system, system-ui, sans-serif";
const ROBOTO_FONT = "var(--font-roboto), 'Roboto', sans-serif";

/* ---------- Data from DOM extraction ---------- */

const PARTNER_LOGOS = [
  { src: "/brands/quantium-com-au/images/logo-Woolworths_Group.svg", alt: "Woolworths Group" },
  { src: "/brands/quantium-com-au/images/logo-Commonwealth_Bank.svg", alt: "Commonwealth Bank" },
  { src: "/brands/quantium-com-au/images/logo-Telstra.svg", alt: "Telstra" },
  { src: "/brands/quantium-com-au/images/logo-Discovery.svg", alt: "Discovery" },
  { src: "/brands/quantium-com-au/images/logo-Vitality.svg", alt: "Vitality" },
  { src: "/brands/quantium-com-au/images/logo-nhs.svg", alt: "NHS" },
  { src: "/brands/quantium-com-au/images/logo-Walmart.svg", alt: "Walmart" },
  { src: "/brands/quantium-com-au/images/logo-ASDA.svg", alt: "ASDA" },
];

const WHY_CHOOSE_US = [
  {
    num: "01",
    title: "Commercial outcomes first",
    description:
      "We start with your business objectives, not the technology.",
  },
  {
    num: "02",
    title: "Two decades deploying AI at scale",
    description:
      "Deep experience across industries means faster, proven outcomes.",
  },
  {
    num: "03",
    title: "Proven approaches across industries",
    description:
      "We bring cross-industry expertise to every engagement.",
  },
];

const HOW_WE_WORK = [
  {
    title: "Built for business impact",
    description:
      "Every engagement starts with a clear commercial objective. We align our AI capabilities to your most pressing business challenges.",
  },
  {
    title: "Systems embedded in your operations",
    description:
      "We don't build prototypes that sit on a shelf. Our solutions integrate into your existing workflows and systems from the start.",
  },
  {
    title: "Capability built to last",
    description:
      "We transfer knowledge and build internal capability so your team can maintain and extend AI systems long after our engagement ends.",
  },
];

const WHAT_WE_DELIVER = [
  {
    title: "Customer intelligence",
    description:
      "Deep understanding of customer behaviour, preferences, and lifetime value to drive personalised experiences at scale.",
  },
  {
    title: "Smarter operations",
    description:
      "AI-optimised supply chains, pricing, and resource allocation that improve efficiency and reduce waste.",
  },
  {
    title: "GenAI in production",
    description:
      "Enterprise-grade generative AI deployed safely at scale with governance and measurable ROI.",
  },
  {
    title: "Risk management",
    description:
      "Real-time fraud detection, compliance, and risk mitigation systems that protect your business.",
  },
];

const IMPACT_CASES = [
  {
    stat: "Real-time fraud prevention",
    title: "Real-time fraud prevention that protects customers and reduces losses",
    image: "/brands/quantium-com-au/images/logo-Commonwealth_Bank.svg",
  },
  {
    stat: "Personalised health",
    title: "Personalised health strategies that reduce costs and improve outcomes",
    image: "/brands/quantium-com-au/images/img-discovery-health.png",
  },
  {
    stat: "Market intelligence",
    title: "Market intelligence that transforms investment decisions",
    image: "/brands/quantium-com-au/images/logo-iress.png",
  },
];

/* ---------- Page component ---------- */

export default function QuantiumHomePage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: QUANTIUM_FONT }}
    >
      <QtHeader />

      {/* ===== Section 1: Hero ===== */}
      <section
        className="relative w-full"
        data-component="hero"
      >
        <div className="grid min-h-[520px] grid-cols-1 md:grid-cols-2">
          {/* Left: text on white */}
          <div className="flex flex-col justify-center bg-white py-20 pl-[100px] pr-12">
            <h1
              className="mb-6 text-[48px] font-medium leading-[1.1] tracking-tight text-[#000006]"
              style={{ fontFamily: QUANTIUM_FONT }}
            >
              Enterprise AI
              <br />
              for complex business
              <br />
              challenges
            </h1>
            <p
              className="mb-8 max-w-[420px] text-[18px] font-light leading-relaxed text-[#666]"
              style={{ fontFamily: ROBOTO_FONT }}
            >
              Cross-industry expertise built over 23 years.
            </p>
            <div>
              <Link
                href="#talk-to-us"
                className="inline-flex h-[48px] items-center justify-center rounded-full bg-[#000006] px-8 text-[15px] font-medium text-white transition-colors hover:bg-[#333]"
                style={{ fontFamily: ROBOTO_FONT }}
              >
                Talk to us
              </Link>
            </div>
          </div>

          {/* Right: hero photo */}
          <div className="relative overflow-hidden">
            <img
              src="/brands/quantium-com-au/images/hero-bg-1.jpg"
              alt="Quantium team in office with large Quantium branding on wall"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ===== Section 2: Trusted partners ===== */}
      <section className="w-full bg-white py-16">
        <div className="mx-auto max-w-[1200px] px-[100px]">
          <h2
            className="mb-12 text-center text-[36px] font-medium tracking-tight text-[#000006]"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Trusted partners to leading organisations
          </h2>
          <div className="grid grid-cols-4 items-center justify-items-center gap-y-10 gap-x-12 md:grid-cols-8">
            {PARTNER_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-[36px] w-auto max-w-[100px] object-contain opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 3: Why clients choose us ===== */}
      <section className="w-full bg-[#0B0D12] py-24">
        <div className="mx-auto max-w-[1200px] px-[100px]">
          <h2
            className="mb-16 text-[42px] font-medium leading-tight tracking-tight text-white"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Why clients choose us
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {WHY_CHOOSE_US.map((item) => (
              <div
                key={item.num}
                className="border-t border-white/20 pt-8"
              >
                <span
                  className="mb-4 block text-[14px] font-medium tracking-wider text-[#F25648]"
                  style={{ fontFamily: ROBOTO_FONT }}
                >
                  {item.num}
                </span>
                <h3
                  className="mb-4 text-[22px] font-medium leading-snug text-white"
                  style={{ fontFamily: QUANTIUM_FONT }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[16px] font-light leading-relaxed text-white/70"
                  style={{ fontFamily: ROBOTO_FONT }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 4: How we work ===== */}
      <section className="w-full bg-white py-24">
        <div className="mx-auto max-w-[1200px] px-[100px]">
          <h2
            className="mb-16 text-[42px] font-medium leading-tight tracking-tight text-[#000006]"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            How we work
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {HOW_WE_WORK.map((item) => (
              <div
                key={item.title}
                className="border-t-2 border-[#000006] pt-8"
              >
                <h3
                  className="mb-4 text-[20px] font-medium leading-snug text-[#000006]"
                  style={{ fontFamily: QUANTIUM_FONT }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[16px] font-light leading-relaxed text-[#666]"
                  style={{ fontFamily: ROBOTO_FONT }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 5: What we deliver ===== */}
      <section className="relative w-full overflow-hidden">
        {/* Background photo with dark overlay */}
        <div className="absolute inset-0">
          <img
            src="/brands/quantium-com-au/images/hero-bg-2.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#000006]/80" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-[100px] py-24">
          <h2
            className="mb-16 text-[42px] font-medium leading-tight tracking-tight text-white"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            What we deliver
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_DELIVER.map((item) => (
              <div
                key={item.title}
                className="group cursor-pointer border-t border-white/30 pt-6 transition-colors"
              >
                <h3
                  className="mb-3 text-[20px] font-medium leading-snug text-white transition-colors group-hover:text-[#F25648]"
                  style={{ fontFamily: QUANTIUM_FONT }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-[15px] font-light leading-relaxed text-white/70"
                  style={{ fontFamily: ROBOTO_FONT }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 6: Impact we've delivered ===== */}
      <section className="w-full bg-[#0B0D12] py-24">
        <div className="mx-auto max-w-[1200px] px-[100px]">
          <h2
            className="mb-16 text-[42px] font-medium leading-tight tracking-tight text-white"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Impact we&apos;ve delivered
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {IMPACT_CASES.map((item) => (
              <div
                key={item.title}
                className="group cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                {/* Image / logo area */}
                <div className="flex h-[180px] items-center justify-center bg-white/5 p-8">
                  <img
                    src={item.image}
                    alt=""
                    className="h-[48px] w-auto object-contain brightness-0 invert"
                  />
                </div>
                {/* Text */}
                <div className="p-6">
                  <h3
                    className="text-[17px] font-light leading-snug text-white/90"
                    style={{ fontFamily: QUANTIUM_FONT }}
                  >
                    {item.title}
                  </h3>
                  <div
                    className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[#F25648] opacity-0 transition-opacity group-hover:opacity-100"
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 7: Complex challenges CTA ===== */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/brands/quantium-com-au/images/hero-bg-3.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#000006]/70" />
        </div>
        <div className="relative mx-auto flex min-h-[480px] max-w-[1200px] items-center px-[100px] py-24">
          <div className="max-w-[600px]">
            <h2
              className="mb-6 text-[48px] font-medium leading-[1.1] tracking-tight text-white"
              style={{ fontFamily: QUANTIUM_FONT }}
            >
              Complex challenges
              <br />
              need experienced
              <br />
              partners
            </h2>
            <p
              className="mb-8 text-[18px] font-light leading-relaxed text-white/80"
              style={{ fontFamily: ROBOTO_FONT }}
            >
              Quantium brings two decades of enterprise AI expertise to your most complex business problems.
            </p>
            <Link
              href="#talk-to-us"
              className="inline-flex h-[48px] items-center justify-center rounded-full bg-[#F25648] px-8 text-[15px] font-medium text-white transition-colors hover:bg-[#D94A3E]"
              style={{ fontFamily: ROBOTO_FONT }}
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Section 8: Footer ===== */}
      <QtFooter />
    </div>
  );
}

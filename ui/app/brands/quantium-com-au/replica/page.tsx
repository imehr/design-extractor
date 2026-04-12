"use client";

import { QtHeader } from "@/components/brands/quantium-com-au/qt-header";
import { QtFooter } from "@/components/brands/quantium-com-au/qt-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const QUANTIUM_FONT = "'QuantiumPro', -apple-system, system-ui, sans-serif";

/* ---------- Data from DOM extraction ---------- */

const PARTNER_LOGOS = [
  { src: "/brands/quantium-com-au/logo-woolworths-group.svg", alt: "Woolworths Group" },
  { src: "/brands/quantium-com-au/logo-commonwealth-bank.svg", alt: "Commonwealth Bank" },
  { src: "/brands/quantium-com-au/logo-telstra.svg", alt: "Telstra" },
  { src: "/brands/quantium-com-au/logo-discovery.svg", alt: "Discovery" },
  { src: "/brands/quantium-com-au/logo-vitality.svg", alt: "Vitality" },
  { src: "/brands/quantium-com-au/gates-foundation.png", alt: "Gates Foundation" },
  { src: "/brands/quantium-com-au/logo-nhs.svg", alt: "NHS" },
  { src: "/brands/quantium-com-au/logo-walmart.svg", alt: "Walmart" },
  { src: "/brands/quantium-com-au/logo-asda.svg", alt: "ASDA" },
];

const WHY_CHOOSE_US = [
  {
    title: "Commercial outcomes first",
    description:
      "We start with the business problem, not the technology. Our approach ensures AI investments deliver measurable returns from day one.",
  },
  {
    title: "Two decades deploying AI at scale",
    description:
      "Since 2002, we've built and deployed AI systems that operate at enterprise scale across the world's most demanding industries.",
  },
  {
    title: "Proven approaches across industries",
    description:
      "Our cross-industry experience means we bring tested methodologies and avoid the costly mistakes of starting from scratch.",
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
    description: "Deep understanding of customer behaviour, preferences, and lifetime value.",
  },
  {
    title: "Smarter operations",
    description: "AI-optimised supply chains, pricing, and resource allocation.",
  },
  {
    title: "GenAI in production",
    description: "Enterprise-grade generative AI deployed safely at scale.",
  },
  {
    title: "Risk management",
    description: "Real-time fraud detection, compliance, and risk mitigation systems.",
  },
];

const IMPACT_CASES = [
  {
    title: "Real-time fraud prevention that protects customers and reduces losses",
    logos: ["/brands/quantium-com-au/logo-commonwealth-bank.svg"],
    dark: true,
  },
  {
    title: "Personalised health strategies that reduce costs and improve outcomes",
    logos: ["/brands/quantium-com-au/img-discovery-health.png"],
    dark: true,
  },
  {
    title: "Market intelligence that transforms investment decisions",
    logos: ["/brands/quantium-com-au/logo-iress.png"],
    dark: true,
  },
];

const PERSPECTIVES = [
  {
    title: "Your AI can do more than your organisation knows how to ask for",
    image: "/brands/quantium-com-au/perspective-lines.png",
  },
  {
    title: "Stop building for stability",
    image: "/brands/quantium-com-au/perspective-tile.png",
  },
  {
    title: "What the AI failure headlines aren't telling you",
    image: "/brands/quantium-com-au/ai-failure-headlines.png",
  },
  {
    title: "AI strategy shifts from models to deployments",
    image: "/brands/quantium-com-au/ai-strategy-shifts.png",
  },
  {
    title: "Why AI agents will reshape work, and the 5 human skills that matter most",
    image: "/brands/quantium-com-au/5-human-skills.png",
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

      {/* ── Hero section ── */}
      <section
        className="relative w-full bg-white"
        data-component="hero"
      >
        <div className="grid min-h-[480px] grid-cols-[1fr_1fr]">
          {/* Left: text content */}
          <div className="flex flex-col justify-center py-16 pl-[100px] pr-10">
            <h1 className="mb-5 text-[44px] font-light leading-[1.12] tracking-tight text-[#1A1A1A]">
              Enterprise AI
              <br />
              for complex business
              <br />
              challenges
            </h1>
            <p className="mb-8 text-[16px] font-light leading-relaxed text-[#666]">
              Cross-industry expertise built over 23 years.
            </p>
            <div>
              <Link
                href="#"
                data-component="button-set"
                className="inline-flex h-[46px] items-center justify-center rounded-full bg-[#1A1A1A] px-8 text-[15px] font-medium text-white hover:bg-[#333]"
              >
                Talk to us
              </Link>
            </div>
          </div>
          {/* Right: hero image */}
          <div className="relative overflow-hidden">
            <img
              src="/brands/quantium-com-au/hero-1.jpg"
              alt="Quantium team in office with large Quantium branding on wall"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Trusted partners ── */}
      <section className="w-full border-b border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2 className="mb-10 text-center text-[15px] font-medium uppercase tracking-[0.2em] text-[#999]">
            Trusted partners to leading organisations
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {PARTNER_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-[40px] w-auto object-contain opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why clients choose us ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2 className="mb-4 text-[36px] font-light tracking-tight text-[#1A1A1A]">
            Why clients choose us
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />
          <div className="grid grid-cols-3 gap-12">
            {WHY_CHOOSE_US.map((item) => (
              <div key={item.title}>
                <h3 className="mb-3 text-[20px] font-medium text-[#1A1A1A]">
                  {item.title}
                </h3>
                <p className="text-[15px] font-light leading-relaxed text-[#666]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How we work ── */}
      <section className="w-full bg-[#F8F8F8] py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2 className="mb-4 text-[36px] font-light tracking-tight text-[#1A1A1A]">
            How we work
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />
          <div className="grid grid-cols-2 gap-16">
            <div className="space-y-10">
              {HOW_WE_WORK.map((item) => (
                <div key={item.title}>
                  <h3 className="mb-2 text-[20px] font-medium text-[#1A1A1A]">
                    {item.title}
                  </h3>
                  <p className="text-[15px] font-light leading-relaxed text-[#666]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/brands/quantium-com-au/hero-2.jpg"
                alt="Quantium team collaborating"
                className="h-auto w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── What we deliver ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2 className="mb-4 text-[36px] font-light tracking-tight text-[#1A1A1A]">
            What we deliver
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />
          <div className="grid grid-cols-4 gap-8" data-component="card">
            {WHAT_WE_DELIVER.map((item) => (
              <Card
                key={item.title}
                className="group cursor-pointer border-0 bg-transparent p-0 shadow-none"
              >
                <div className="border-t-2 border-[#00B2A9] pt-6">
                  <h3 className="mb-3 text-[18px] font-medium text-[#1A1A1A] transition-colors group-hover:text-[#00B2A9]">
                    {item.title}
                  </h3>
                  <p className="text-[14px] font-light leading-relaxed text-[#666]">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact we've delivered ── */}
      <section className="w-full bg-[#1A1A1A] py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2 className="mb-4 text-[36px] font-light tracking-tight text-white">
            Impact we&apos;ve delivered
          </h2>
          <Separator className="mb-12 bg-white/10" />
          <div className="grid grid-cols-3 gap-8">
            {IMPACT_CASES.map((item) => (
              <div
                key={item.title}
                className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-8 transition-colors hover:border-[#00B2A9]/30 hover:bg-white/10"
              >
                <div className="mb-6 flex items-center">
                  {item.logos.map((logo) => (
                    <img
                      key={logo}
                      src={logo}
                      alt=""
                      className="h-[40px] w-auto object-contain brightness-0 invert"
                    />
                  ))}
                </div>
                <h3 className="text-[17px] font-light leading-snug text-white/90">
                  {item.title}
                </h3>
                <div className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[#00B2A9] opacity-0 transition-opacity group-hover:opacity-100">
                  Read more <ArrowRight className="size-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Complex challenges CTA ── */}
      <section className="relative h-[500px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/brands/quantium-com-au/hero-3.jpg"
            alt="Quantium office"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative mx-auto flex h-full max-w-[1280px] items-center px-[100px]">
          <div className="max-w-[600px]">
            <h2 className="mb-8 text-[44px] font-light leading-[1.15] tracking-tight text-white">
              Complex challenges
              <br />
              need experienced
              <br />
              partners
            </h2>
            <Link
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#00B2A9] px-8 text-[15px] font-medium text-white hover:bg-[#009E96]"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* ── Perspectives ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-[36px] font-light tracking-tight text-[#1A1A1A]">
              Perspectives
            </h2>
            <Link
              href="#"
              className="flex items-center gap-2 text-[14px] font-medium text-[#00B2A9] hover:underline"
            >
              Read more <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {PERSPECTIVES.slice(0, 3).map((article) => (
              <Card
                key={article.title}
                className="group cursor-pointer overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-none transition-shadow hover:shadow-md"
              >
                <div className="aspect-[336/240] overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-[16px] font-medium leading-snug text-[#1A1A1A]">
                    {article.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6">
            {PERSPECTIVES.slice(3).map((article) => (
              <Card
                key={article.title}
                className="group flex cursor-pointer overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-none transition-shadow hover:shadow-md"
              >
                <div className="w-[200px] shrink-0 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center p-6">
                  <h3 className="text-[16px] font-medium leading-snug text-[#1A1A1A]">
                    {article.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form section ── */}
      <section
        className="w-full bg-[#F8F8F8] py-20"
        data-component="form"
      >
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <div className="mx-auto max-w-[560px] text-center">
            <h2 className="mb-4 text-[36px] font-light tracking-tight text-[#1A1A1A]">
              Get in touch
            </h2>
            <p className="mb-10 text-[15px] font-light text-[#666]">
              Tell us about your challenge. Our team of experts will be in touch.
            </p>
            <div className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
                    First name
                  </label>
                  <input
                    type="text"
                    className="h-11 w-full rounded-md border border-[#D4D4D4] bg-white px-4 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#00B2A9]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
                    Last name
                  </label>
                  <input
                    type="text"
                    className="h-11 w-full rounded-md border border-[#D4D4D4] bg-white px-4 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#00B2A9]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
                  Work email
                </label>
                <input
                  type="email"
                  className="h-11 w-full rounded-md border border-[#D4D4D4] bg-white px-4 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#00B2A9]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
                  Company
                </label>
                <input
                  type="text"
                  className="h-11 w-full rounded-md border border-[#D4D4D4] bg-white px-4 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#00B2A9]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
                  How can we help?
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-[#D4D4D4] bg-white px-4 py-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#00B2A9]"
                />
              </div>
              <Button className="h-12 w-full rounded-full bg-[#00B2A9] text-[15px] font-medium text-white hover:bg-[#009E96]">
                Submit
              </Button>
            </div>
          </div>
        </div>
      </section>

      <QtFooter />
    </div>
  );
}

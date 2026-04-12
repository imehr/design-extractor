"use client";

import { QtHeader } from "@/components/brands/quantium-com-au/qt-header";
import { QtFooter } from "@/components/brands/quantium-com-au/qt-footer";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const QUANTIUM_FONT = "'QuantiumPro', Inter, sans-serif";

/* ---------- Data from DOM extraction ---------- */

const PARTNER_LOGOS = [
  { src: "/brands/quantium-com-au/images/logo-Anthropic.svg", alt: "Anthropic" },
  { src: "/brands/quantium-com-au/images/logo-OpenAI.svg", alt: "OpenAI" },
  { src: "/brands/quantium-com-au/images/logo-Google_Cloud.svg", alt: "Google Cloud" },
  { src: "/brands/quantium-com-au/images/logo-aws.svg", alt: "AWS" },
  { src: "/brands/quantium-com-au/images/logo-Azure.svg", alt: "Azure" },
  { src: "/brands/quantium-com-au/images/logo-Groq.svg", alt: "Groq" },
  { src: "/brands/quantium-com-au/images/logo-Databricks.svg", alt: "Databricks" },
  { src: "/brands/quantium-com-au/images/logo-Snowflake.svg", alt: "Snowflake" },
];

const WHAT_WE_OFFER = [
  {
    title: "Developing capability that lasts",
    description:
      "We build your team's ability to create, deploy, and maintain GenAI systems independently.",
  },
  {
    title: "Building AI agents that deliver commercial value",
    description:
      "We design and deploy AI agents that automate complex workflows and create measurable business outcomes.",
  },
  {
    title: "Transforming business processes at scale",
    description:
      "We identify and implement GenAI solutions that transform how your organisation operates.",
  },
];

const WHY_OUR_APPROACH = {
  heading: "Why our approach works",
  text: "We transformed our own business first. With over 1,200 employees across 13 locations globally, we've faced the same security, adoption, and integration challenges you're navigating now. Our client work spans global enterprises, government agencies, and regulated industries.",
  text2:
    "Our technical partnerships with leading AI providers mean we've tested these platforms against real business needs. This experience helps us move faster and avoid common pitfalls.",
};

const LEADERSHIP_CAPABILITY = {
  heading: "Build GenAI leadership capability",
  text: "Successful GenAI deployment depends on leadership from executives who understand the technology first-hand. Leaders who use GenAI themselves can guide their organisations through adoption practically and confidently.",
  products: [
    { name: "AI Executive Edge" },
    { name: "AI Exec Edge" },
  ],
};

/* ---------- Page component ---------- */

export default function GenAIPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        fontSize: 16,
        color: "#000006",
      }}
    >
      <QtHeader activePage="GenAI" />

      {/* ── Hero - dark bg ── */}
      <section className="relative w-full bg-[#0B0D12]">
        <div className="grid min-h-[480px] grid-cols-1 md:grid-cols-[1fr_1fr]">
          {/* Left: text */}
          <div className="flex flex-col justify-center py-16 pl-[100px] pr-10">
            <h1
              className="mb-5 text-[48px] font-normal leading-[1.12] tracking-tight text-white"
              style={{ fontFamily: QUANTIUM_FONT }}
            >
              Making GenAI work
              <br />
              for your business
            </h1>
            <p className="mb-8 max-w-[480px] text-[17px] font-light leading-relaxed text-white/70">
              We build GenAI systems that work in production and develop your
              organisation&apos;s capability to deploy them at scale. We partner with
              all major AI platforms and bring 23 years of AI experience in your
              industry.
            </p>
            <div>
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-medium text-[#0B0D12] hover:bg-white/90"
              >
                Talk to us
              </Link>
            </div>

            {/* Partner logos row */}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              {PARTNER_LOGOS.map((logo) => (
                <img
                  key={logo.alt}
                  src={logo.src}
                  alt={logo.alt}
                  className="h-[24px] w-auto object-contain brightness-0 invert opacity-60"
                />
              ))}
            </div>
          </div>
          {/* Right: image */}
          <div className="relative overflow-hidden">
            <img
              src="/brands/quantium-com-au/images/hero-bg-2.jpg"
              alt="Team working on GenAI solutions"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── What we offer ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-4 text-[36px] font-normal tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            What we offer
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {WHAT_WE_OFFER.map((item) => (
              <div key={item.title}>
                <h3
                  className="mb-3 text-[20px] font-medium"
                  style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
                >
                  {item.title}
                </h3>
                <p className="text-[15px] font-light leading-relaxed text-[#555]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why our approach works ── */}
      <section className="w-full bg-[#ECE8E4] py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-8 text-[36px] font-normal tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            {WHY_OUR_APPROACH.heading}
          </h2>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
            <div className="space-y-6">
              <p className="text-[17px] font-light leading-relaxed text-[#333]">
                {WHY_OUR_APPROACH.text}
              </p>
              <p className="text-[17px] font-light leading-relaxed text-[#333]">
                {WHY_OUR_APPROACH.text2}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/brands/quantium-com-au/images/hero-bg-3.jpg"
                alt="Quantium team working"
                className="h-auto w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Build GenAI leadership capability ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-6 text-[36px] font-normal tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            {LEADERSHIP_CAPABILITY.heading}
          </h2>
          <p className="mb-10 max-w-[700px] text-[17px] font-light leading-relaxed text-[#444]">
            {LEADERSHIP_CAPABILITY.text}
          </p>

          <div className="flex flex-wrap gap-6">
            {LEADERSHIP_CAPABILITY.products.map((product) => (
              <Card
                key={product.name}
                className="group cursor-pointer border border-[#E5E5E5] bg-white px-8 py-6 shadow-none transition-all hover:border-[#0091AE] hover:shadow-md"
              >
                <p
                  className="text-[16px] font-medium transition-colors group-hover:text-[#0091AE]"
                  style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
                >
                  {product.name}
                </p>
                <ArrowRight className="mt-2 size-4 text-[#0091AE] opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── GenAI partnerships ── */}
      <section className="w-full bg-[#EFEFEF] py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-4 text-[36px] font-normal tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            GenAI partnerships
          </h2>
          <p className="mb-12 max-w-[600px] text-[17px] font-light leading-relaxed text-[#444]">
            Our partnerships with leading AI providers give you access to
            cutting-edge capabilities and the benefit of learnings from clients
            across industries.
          </p>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PARTNER_LOGOS.map((logo) => (
              <div
                key={logo.alt}
                className="flex items-center justify-center rounded-lg bg-white px-6 py-8"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-[32px] w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ready to explore CTA ── */}
      <section className="relative w-full bg-[#0B0D12]">
        <div className="grid min-h-[400px] grid-cols-1 md:grid-cols-[1fr_1fr]">
          {/* Left: text */}
          <div className="flex flex-col justify-center py-16 pl-[100px] pr-10">
            <h2
              className="mb-6 text-[44px] font-normal leading-[1.12] tracking-tight text-white"
              style={{ fontFamily: QUANTIUM_FONT }}
            >
              Ready to explore
              <br />
              GenAI opportunities?
            </h2>
            <p className="mb-8 max-w-[440px] text-[16px] font-light leading-relaxed text-white/70">
              Whether you&apos;re exploring initial GenAI applications or scaling
              existing deployments across your organisation, we can help you move
              with confidence.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-medium text-[#0B0D12] hover:bg-white/90"
              >
                Talk to us
              </Link>
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full border border-white/30 px-8 text-[15px] font-medium text-white hover:border-white/50"
              >
                Subscribe
              </Link>
            </div>
          </div>
          {/* Right: image */}
          <div className="relative overflow-hidden">
            <img
              src="/brands/quantium-com-au/images/hero-bg-1.jpg"
              alt="Quantium office collaboration"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <QtFooter />
    </div>
  );
}

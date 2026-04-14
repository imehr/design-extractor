"use client";

import { SAHeader } from "@/components/brands/screenaustralia-gov-au/sa-header";
import { SAFooter } from "@/components/brands/screenaustralia-gov-au/sa-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

const FUNDING_CATEGORIES = [
  {
    title: "Narrative Content Production",
    subtitle: "Ambition, creativity, audience engagement",
    gradient: "from-[#5b2d8e] via-[#3a1d5c] to-[#1a0a2e]",
  },
  {
    title: "Narrative Content Development",
    subtitle: "Distinctive storytelling",
    gradient: "from-[#1a5276] via-[#154360] to-[#0b2f47]",
  },
  {
    title: "Games",
    subtitle: "Let's play!",
    gradient: "from-[#8dc63f] via-[#5a8a20] to-[#2d4510]",
  },
  {
    title: "Documentary",
    subtitle: "Quality, cultural value, innovation, diversity",
    gradient: "from-[#c0392b] via-[#922b21] to-[#4a1610]",
  },
  {
    title: "First Nations",
    subtitle: "",
    gradient: "from-[#d4a017] via-[#a07c12] to-[#50400a]",
  },
  {
    title: "Industry development",
    subtitle: "",
    gradient: "from-[#2980b9] via-[#1f6391] to-[#0f3149]",
  },
  {
    title: "Producer Offset",
    subtitle: "",
    gradient: "from-[#6c3483] via-[#4a235a] to-[#25112d]",
  },
  {
    title: "Co-production Program",
    subtitle: "",
    gradient: "from-[#1e8449] via-[#145a32] to-[#0a2d19]",
  },
  {
    title: "Funding Approvals",
    subtitle: "",
    gradient: "from-[#d35400] via-[#a04000] to-[#502000]",
  },
  {
    title: "Tools and insights",
    subtitle: "",
    gradient: "from-[#2c3e50] via-[#1c2833] to-[#0e1419]",
  },
];

const NEWS_ITEMS = [
  { title: "Blockbuster year for Australians at Toronto" },
  { title: "Sue Brooks' Looking For Grace selected for Toronto" },
  { title: "Tanna and The Daughter selected for Venice" },
  { title: "Australian talent dominates at Toronto" },
];

export default function FundingAndSupportPage() {
  const scrollToOverview = () => {
    const el = document.getElementById("overview");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen bg-[#1a1a1a] text-white"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      {/* ─── 1. Hero section ─── */}
      <section className="relative flex min-h-[70vh] flex-col">
        {/* Gradient background simulating parallax hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0a] via-[#1a2e1a] to-[#1a1a1a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#8dc63f]/10 via-transparent to-[#8dc63f]/5" />

        {/* Header overlaid */}
        <SAHeader variant="transparent" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
          <h1
            className="text-[36px] font-bold uppercase tracking-wide text-white md:text-[48px]"
            style={{
              fontFamily: "'Open Sans Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            Funding and Support
          </h1>
        </div>

        {/* Scroll-down chevron */}
        <div className="relative z-10 flex justify-center pb-10">
          <button
            onClick={scrollToOverview}
            aria-label="Scroll to overview"
            className="transition-colors hover:text-[#8dc63f]"
          >
            <ChevronDown className="size-8 animate-bounce text-white/60" />
          </button>
        </div>
      </section>

      {/* ─── 2. Overview section ─── */}
      <section id="overview" className="bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <h1
            className="text-[36px] font-bold text-[#333]"
            style={{
              fontFamily: "'Open Sans Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            Funding and support overview
          </h1>
          <p
            className="mt-6 max-w-[900px] text-base leading-relaxed text-[#333]"
            style={{ fontWeight: 300 }}
          >
            Screen Australia offers funding to support the development, production
            and marketing of Australian screen content, as well as for the
            development of Australian talent and screen production businesses.
            Browse the various funds below.
          </p>
          <p
            className="mt-4 max-w-[900px] text-sm leading-relaxed text-[#777]"
            style={{ fontWeight: 400 }}
          >
            Learn more about the upcoming changes to the Documentary and Narrative
            Content Programs and guidelines, effective from 1 July 2025.
          </p>
        </div>
      </section>

      {/* ─── 3. Funding categories grid ─── */}
      <section className="bg-[#000]">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {FUNDING_CATEGORIES.map((cat) => (
              <Link key={cat.title} href="#" className="group">
                <Card className="relative h-[180px] overflow-hidden border-0 bg-transparent p-0 ring-0 md:h-[200px]">
                  {/* Gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} transition-all duration-300 group-hover:brightness-125`}
                  />
                  {/* Semi-transparent overlay */}
                  <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                  {/* Content */}
                  <div className="relative z-10 flex h-full flex-col justify-end p-4">
                    <h3
                      className="text-[16px] font-bold leading-tight text-white md:text-[18px]"
                      style={{
                        fontFamily: "'Open Sans Condensed', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {cat.title}
                    </h3>
                    {cat.subtitle && (
                      <p
                        className="mt-1 text-xs leading-snug text-white/70"
                        style={{ fontWeight: 300 }}
                      >
                        {cat.subtitle}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Starting in the screen industry ─── */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-20 text-center">
          <h1
            className="text-[36px] font-bold text-[#333]"
            style={{
              fontFamily: "'Open Sans Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            Starting in the screen industry?
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#333]"
            style={{ fontWeight: 300 }}
          >
            Find out about support and resources available for first time program
            makers.
          </p>
          <Button
            variant="outline"
            className="mt-8 rounded-sm border-[#333] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-[#333] transition-colors hover:bg-[#333] hover:text-white"
          >
            Find out more
          </Button>
        </div>
      </section>

      {/* ─── 5. News & Events section ─── */}
      <section className="bg-[#1a1a1a]">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="mb-8 inline-flex items-center gap-3">
            <span className="h-[3px] w-8 bg-[#8dc63f]" />
            <h2
              className="text-lg font-bold uppercase tracking-wider text-white"
              style={{
                fontFamily: "'Open Sans Condensed', sans-serif",
                fontWeight: 700,
              }}
            >
              News &amp; Events
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {NEWS_ITEMS.map((item, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden rounded-lg border-0 bg-[#222] p-0 ring-0 transition-colors hover:bg-[#2a2a2a]"
              >
                {/* Placeholder image area */}
                <div className="aspect-video w-full bg-gradient-to-br from-[#333] via-[#2a2a2a] to-[#222]" />
                <div className="p-4">
                  <h3
                    className="text-sm font-semibold leading-snug text-white transition-colors group-hover:text-[#8dc63f]"
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {item.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Footer ─── */}
      <SAFooter />
    </div>
  );
}

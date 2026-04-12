"use client";

import { QtHeader } from "@/components/brands/quantium-com-au/qt-header";
import { QtFooter } from "@/components/brands/quantium-com-au/qt-footer";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const QUANTIUM_FONT = "'QuantiumPro', Inter, sans-serif";

/* ---------- Data from DOM extraction ---------- */

const ARTICLES = [
  {
    title: "Your AI can do more than your organisation knows how to ask for",
    excerpt:
      "The organisations seeing lasting impact with AI are not the ones who made perfect technology bets.",
    date: "31 March 2026",
    image: "/brands/quantium-com-au/images/perspective-lines.png",
  },
  {
    title: "Stop building for stability",
    excerpt:
      "The organisations seeing lasting impact with AI are not the ones who made perfect technology bets.",
    date: "16 February 2026",
    image: "/brands/quantium-com-au/images/perspective-tile-image3.png",
  },
  {
    title: "What the AI failure headlines aren\u2019t telling you",
    excerpt:
      "The organisations seeing lasting impact with AI aren\u2019t just deploying the technology - they\u2019re building the capabilities to use it.",
    date: "27 October 2025",
    image: "/brands/quantium-com-au/images/AI-strategy-shifts.png",
  },
];

/* ---------- Page component ---------- */

export default function PerspectivesPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        fontSize: 16,
        color: "#000006",
      }}
    >
      <QtHeader activePage="Perspectives" />

      {/* ── Hero ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h1
            className="mb-4 text-[80px] font-normal leading-[1.05] tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            Perspectives
          </h1>
          <p className="max-w-[600px] text-[17px] font-light leading-relaxed text-[#555]">
            From the team putting data and AI to work for the world&apos;s leading
            organisations.
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-[1280px] bg-[#E5E5E5]" />

      {/* ── Article grid ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {ARTICLES.map((article) => (
              <Card
                key={article.title}
                className="group cursor-pointer overflow-hidden rounded-none border border-[#E5E5E5] bg-white shadow-none transition-shadow hover:shadow-md"
              >
                <div className="aspect-[336/240] overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3
                    className="mb-3 text-[18px] font-medium leading-snug"
                    style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
                  >
                    {article.title}
                  </h3>
                  <p className="mb-4 text-[14px] font-light leading-relaxed text-[#666]">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#999]">{article.date}</span>
                    <Link
                      href="#"
                      className="font-medium text-[#0091AE] hover:underline"
                    >
                      Read here
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load more */}
          <div className="mt-12 flex justify-center">
            <Button
              variant="outline"
              className="h-[46px] rounded-full border-2 border-[#000006] px-8 text-[15px] font-medium text-[#000006] hover:bg-[#000006] hover:text-white"
            >
              Load more
            </Button>
          </div>
        </div>
      </section>

      {/* ── Direct to your inbox ── */}
      <section className="w-full bg-[#ECE8E4] py-16">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-[100px]">
          <div>
            <h2
              className="mb-2 text-[24px] font-normal tracking-tight"
              style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
            >
              Direct to your inbox
            </h2>
            <p className="text-[15px] font-light text-[#555]">
              Monthly AI insights to help leaders make sense of GenAI &ndash;
              and apply it.
            </p>
          </div>
          <Button className="h-[46px] rounded-full bg-[#000006] px-8 text-[15px] font-medium text-white hover:bg-[#333]">
            Subscribe
          </Button>
        </div>
      </section>

      {/* ── Complex challenges CTA ── */}
      <section className="relative w-full bg-[#0B0D12]">
        <div className="grid min-h-[400px] grid-cols-1 md:grid-cols-[1fr_1fr]">
          {/* Left: text */}
          <div className="flex flex-col justify-center py-16 pl-[100px] pr-10">
            <h2
              className="mb-6 text-[44px] font-normal leading-[1.12] tracking-tight text-white"
              style={{ fontFamily: QUANTIUM_FONT }}
            >
              Complex challenges
              <br />
              need experienced
              <br />
              partners
            </h2>
            <p className="mb-8 max-w-[440px] text-[16px] font-light leading-relaxed text-white/70">
              Let&apos;s discuss what&apos;s possible for your business.
            </p>
            <div>
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full bg-white px-8 text-[15px] font-medium text-[#0B0D12] hover:bg-white/90"
              >
                Talk to us
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

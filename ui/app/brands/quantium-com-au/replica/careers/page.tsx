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

const HERO_TILES = [
  { label: "How people shop", image: "/brands/quantium-com-au/images/careers-tile-1.jpg" },
  { label: "How we fight pandemics", image: "/brands/quantium-com-au/images/careers-tile-2.jpg" },
  { label: "How we treat mental health", image: "/brands/quantium-com-au/images/careers-tile-3.jpg" },
  { label: "How people bank", image: "/brands/quantium-com-au/images/careers-tile-4.jpg" },
  { label: "How products are moved", image: "/brands/quantium-com-au/images/careers-tile-5.jpg" },
  { label: "How waste is tackled", image: "/brands/quantium-com-au/images/careers-tile-6.jpg" },
];

/* ---------- Page component ---------- */

export default function CareersPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        fontSize: 16,
        color: "#000006",
      }}
    >
      <QtHeader activePage="Careers" />

      {/* ── Hero banner ── */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[400px] w-full">
          <img
            src="/brands/quantium-com-au/images/careers-tile-1.jpg"
            alt="Careers hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
          <div className="relative z-10 flex h-full items-center pl-[100px]">
            <div className="max-w-[500px]">
              <p className="mb-3 text-[14px] font-medium uppercase tracking-[0.15em] text-[#F25648]">
                Find your kind
              </p>
              <h1
                className="text-[56px] font-normal leading-[1.08] tracking-tight"
                style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
              >
                Challenge your
                <br />
                imagination at
                <br />
                Quantium.
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sub-hero text ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-4 text-[36px] font-normal tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            Challenge your imagination at Quantium.
          </h2>
          <p className="max-w-[700px] text-[17px] font-light leading-relaxed text-[#444]">
            We offer opportunities to go deeper with data to solve the most
            challenging problems facing business and society today.
          </p>
        </div>
      </section>

      {/* ── Impact tiles grid ── */}
      <section className="w-full pb-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {HERO_TILES.map((tile) => (
              <Card
                key={tile.label}
                className="group cursor-pointer overflow-hidden border-0 bg-[#EFEFEF] shadow-none"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={tile.image}
                    alt={tile.label}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <p
                    className="text-[16px] font-medium"
                    style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
                  >
                    {tile.label}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-[1280px] bg-[#E5E5E5]" />

      {/* ── Global leader section ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
            <div>
              <h2
                className="mb-6 text-[32px] font-normal leading-[1.2] tracking-tight"
                style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
              >
                Quantium is a global leader in data science and AI
              </h2>
              <p className="mb-6 text-[16px] font-light leading-relaxed text-[#444]">
                With a global team of over 1,200, we help organisations maximise
                the potential of their data. Our data and AI-powered solutions
                tackle some of the world&apos;s most complex business challenges.
              </p>
              <p className="mb-8 text-[16px] font-light leading-relaxed text-[#444]">
                We develop leading-edge AI capabilities and embed them across the
                world&apos;s most significant organisations, helping to create
                transformative and lasting value.
              </p>
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full border-2 border-[#000006] px-8 text-[15px] font-medium text-[#000006] hover:bg-[#000006] hover:text-white"
              >
                See open roles
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/brands/quantium-com-au/images/careers-modal1.png"
                alt="Quantium team member"
                className="h-auto w-full max-w-[400px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Make an impact section ── */}
      <section className="w-full bg-[#ECE8E4] py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
            <div className="flex items-center justify-center">
              <img
                src="/brands/quantium-com-au/images/careers-modal2.png"
                alt="Quantium team member at work"
                className="h-auto w-full max-w-[400px] object-contain"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2
                className="mb-6 text-[32px] font-normal leading-[1.2] tracking-tight"
                style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
              >
                Make an impact at Quantium
              </h2>
              <p className="mb-8 text-[16px] font-light leading-relaxed text-[#444]">
                Quantium&apos;s teams work with globally recognised organisations
                to tackle complex challenges. Our engineers, data scientists,
                strategists, and domain experts collaborate on projects that
                create real outcomes for business and society.
              </p>
              <Link
                href="#"
                className="inline-flex h-[46px] w-fit items-center justify-center rounded-full border-2 border-[#000006] px-8 text-[15px] font-medium text-[#000006] hover:bg-[#000006] hover:text-white"
              >
                Learn more about working here
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Grads section ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
            <div>
              <h2
                className="mb-6 text-[32px] font-normal leading-[1.2] tracking-tight"
                style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
              >
                Grads, right this way!
              </h2>
              <p className="mb-8 text-[16px] font-light leading-relaxed text-[#444]">
                Quantium&apos;s Graduate Academy develops the brightest
                minds into well-rounded data science professionals. You&apos;ll
                work on real projects alongside some of the most experienced
                people in Australia&apos;s data science industry.
              </p>
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full border-2 border-[#F25648] px-8 text-[15px] font-medium text-[#F25648] hover:bg-[#F25648] hover:text-white"
              >
                Learn more about Grad Academy
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/brands/quantium-com-au/images/careers-modal3.png"
                alt="Quantium graduate"
                className="h-auto w-full max-w-[400px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <QtFooter />
    </div>
  );
}

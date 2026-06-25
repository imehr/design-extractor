"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function CorporateResponsibilityPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        fontSize: 16,
        color: "#000006",
      }}
    >
      <QuantiumHeader />

      {/* ── Hero banner ── */}
      <section className="relative w-full">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden"
          style={{ height: 410 }}
        >
          <img
            src="/brands/quantium-com-au/corporate-1-a-.jpg"
            alt="Corporate responsibility"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h1
              className="text-[48px] font-normal leading-[62px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Corporate responsibility
            </h1>
          </div>
        </div>
      </section>

      {/* ── Purpose statement ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="mb-6 max-w-[800px] text-[24px] font-light leading-[32px] text-[#000006]">
            Our purpose is to forge a better, more intelligent world.
          </p>
          <p className="max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            We are committed to not only supporting our commercial clients to achieve success but in
            having a real social impact through our partnership with My Choices Foundation in India.
          </p>
        </div>
      </section>

      {/* ── My Choices – India ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <img
                src="/brands/quantium-com-au/corporate-1-b.jpg"
                alt="My Choices Foundation"
                className="w-full object-cover"
              />
            </div>
            <div>
              <h2
                className="mb-6 text-[28px] font-normal leading-[32px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                My Choices – India
              </h2>
              <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
                My Choices Foundation aims to give women and girls choices to live a life free from
                abuse, violence and exploitation.
              </p>
              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                How we help…
              </h3>
              <p className="mb-6 text-[16px] font-normal leading-[24px] text-[#333]">
                Quantium helps by supporting the Foundation’s Operation Red Alert program by applying
                world class analytics to identify locations at greatest risk of young girls being
                trafficked for sex slavery.
              </p>
              <Link
                href="http://mychoicesfoundation.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-medium text-[#0091AE] hover:underline"
              >
                Learn more at mychoicesfoundation.org
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Video thumbnail ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="relative overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
            <img
              src="/brands/quantium-com-au/resp-thumb-1024x576.jpg"
              alt="My Choices Foundation video"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

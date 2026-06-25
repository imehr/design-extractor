"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function InsurancePage() {
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
            src="/brands/quantium-com-au/Insurance_6_Macro.jpg"
            alt="Insurance"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h1
              className="mb-4 text-[48px] font-normal leading-[56px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Insurance
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Enhance customer experience, reduce risk and realise growth with the best in the business.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2">
            <div>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Quantium helps insurers engage their customers as unique individuals at scale: predicting the cover they need, when and how they need it.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Quantium&apos;s solutions help insurers make better product, pricing and marketing decisions that transform returns.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Quantium&apos;s market-leading products and bespoke AI decision engines combine traditional risk and customer models with Q&apos;s world-class data eco-system and data processing power to drive a deeper understanding of the customer.
              </p>
              <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Quality automation drives quicker and more accurate risk and claims decisions, transforming the customer experience and freeing up scarce talent to focus where it matters.
              </p>
              <Link
                href="https://quantium.com/talk-to-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded bg-[#000006] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#333]"
              >
                Talk to us
              </Link>
            </div>
            <div>
              <img
                src="/brands/quantium-com-au/Insurance_6_Micro.jpg"
                alt="Insurance"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

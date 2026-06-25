"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function ConsumerServicesPage() {
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
            src="/brands/quantium-com-au/Consumer_11_Macro.jpg"
            alt="Consumer services"
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
              Consumer services
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Truly understand what drives your customers, predict their behaviour and personalise your offer.
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
                Quantium helps Telcos, Transport and Tech companies engage their customers as unique individuals at scale: delivering an unrivalled understanding of what they want, when and how they want it, and the price they are willing to pay.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Harnessing the power of Q, our products and bespoke AI decision engines help you make better product, pricing and marketing decisions that transform returns.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q&apos;s world-class data ecosystem comprises billions of genuine transactions recorded over many years. It will enrich your understanding of consumers, helping pinpoint the drivers of past behaviour and predict their future needs.
              </p>
              <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q&apos;s unique personalisation capability helps you target customers one-on-one at scale, focusing marketing and price investments where they are most effective.
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
                src="/brands/quantium-com-au/Consumer_11_Micro.jpg"
                alt="Consumer services"
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

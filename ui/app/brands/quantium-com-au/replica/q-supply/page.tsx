"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QSupplyPage() {
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
            src="/brands/quantium-com-au/q-supply-macro.jpg"
            alt="Q.Supply"
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
              Q.Supply
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Supply focusses on reducing waste in the supply chain. Successful businesses realise that to continue to drive value, a key part of success is linked to the performance of their supply chain.
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Supply ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="mb-10 flex items-center gap-4">
            <img
              src="/brands/quantium-com-au/qsupply-white-1-320x100.png"
              alt="Q.Supply logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            What is Q.Supply?
          </h2>
          <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Q.Supply focusses on revenue efficiency within the supply chain.
          </p>
          <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            One key module within Q.Supply is Lost Sales, a report that provides insights on how to improve profit through focusing on high priority areas within the supply chain where sales are being lost.
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
      </section>

      {/* ── Key benefits ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2">
            <div>
              <h2
                className="mb-6 text-[28px] font-normal leading-[32px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Key benefits
              </h2>

              <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
                Enables suppliers to identify new sales opportunities at a store and time level
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>When – How lost sales change over the course of a day</li>
                <li>What – Which products are seeing the highest number of lost sales</li>
                <li>Where – Which stores have the greatest opportunities</li>
              </ul>

              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Provides complete visibility into product, store, week and time of day</li>
                <li>Enables suppliers to size their opportunity and pinpoint lost sales drivers</li>
                <li>Allows suppliers to measure the difference they make in store</li>
              </ul>
            </div>

            <div>
              <img
                src="/brands/quantium-com-au/insight-image-002.jpg"
                alt="Q.Supply benefits"
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

"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function CustomerRetailMediaPage() {
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
            src="/brands/quantium-com-au/Customer-Retail-Media_Macro.png"
            alt="Customer and retail media"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h1
              className="mx-auto mb-4 max-w-[900px] text-[48px] font-normal leading-[62px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Customer and retail media
            </h1>
            <p className="mx-auto max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Harness AI to transform customer relationships into a revenue engine. Unlock the full value of your customer relationships by understanding shopping behaviour, delivering personalised experiences, optimising digital operations and creating new revenue streams with AI-driven insights that transform how you engage shoppers.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Media revenue\ngrowth" },
              { label: "Basket size\nincreases" },
              { label: "Conversion rate\nimprovements" },
              { label: "Fulfilment cost\nreduction" },
            ].map((stat) => (
              <div key={stat.label} className="rounded border border-[#E5E5E5] p-6 text-center">
                <p className="whitespace-pre-line text-[14px] font-medium leading-[20px] text-[#333]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our solutions ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Our solutions
          </h2>

          <div className="space-y-8">
            {/* Q.Checkout */}
            <div className="grid grid-cols-1 items-start gap-8 rounded border border-[#E5E5E5] p-6 md:grid-cols-2">
              <div>
                <h3
                  className="mb-3 text-[24px] font-normal leading-[28px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  01 Q.Checkout
                </h3>
                <p className="mb-2 text-[16px] font-medium leading-[22px] text-[#000006]">
                  Unlock customer-driven growth
                </p>
                <p className="mb-4 text-[14px] leading-[20px] text-[#333]">
                  Transform every transaction into strategic advantage. Q.Checkout turns your existing transaction data into customer intelligence that reveals growth opportunities competitors miss, driving measurable improvements in ranging, pricing, and promotional performance.
                </p>
                <Link
                  href="https://quantium.com/talk-to-us-retail/"
                  className="text-[14px] font-medium text-[#0091AE] hover:underline"
                >
                  Unlock your growth potential
                </Link>
              </div>
              <div className="relative overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
                <img
                  src="/brands/quantium-com-au/q-checkout-vid-thumb.jpg"
                  alt="Q.Checkout"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Q.Relevance */}
            <div className="grid grid-cols-1 items-start gap-8 rounded border border-[#E5E5E5] p-6 md:grid-cols-2">
              <div>
                <h3
                  className="mb-3 text-[24px] font-normal leading-[28px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  02 Q.Relevance
                </h3>
                <p className="mb-2 text-[16px] font-medium leading-[22px] text-[#000006]">
                  Deliver 1:1 customer experiences at scale
                </p>
                <p className="mb-4 text-[14px] leading-[20px] text-[#333]">
                  Intelligent personalisation drives 3.5x growth in attributable sales.
                </p>
                <Link
                  href="https://quantium.com/talk-to-us-retail/"
                  className="text-[14px] font-medium text-[#0091AE] hover:underline"
                >
                  See personalisation impact
                </Link>
              </div>
              <div />
            </div>

            {/* Q.Digital */}
            <div className="grid grid-cols-1 items-start gap-8 rounded border border-[#E5E5E5] p-6 md:grid-cols-2">
              <div>
                <h3
                  className="mb-3 text-[24px] font-normal leading-[28px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  03 Q.Digital
                </h3>
                <p className="mb-2 text-[16px] font-medium leading-[22px] text-[#000006]">
                  Master the digital shelf to maximise product performance
                </p>
                <Link
                  href="https://quantium.com/talk-to-us-retail/"
                  className="text-[14px] font-medium text-[#0091AE] hover:underline"
                >
                  Master your digital shelf
                </Link>
              </div>
              <div />
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact statement ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Intelligent personalisation drives 3.5x growth in attributable sales
          </h2>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative w-full">
        <div className="relative flex w-full items-center justify-center overflow-hidden py-24">
          <img
            src="/brands/quantium-com-au/Custmer-and-retail-media_micro.png"
            alt="Reimagine your retail business today"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h2
              className="mx-auto mb-6 max-w-[700px] text-[48px] font-normal leading-[62px]"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Reimagine your retail business today
            </h2>
            <Link
              href="https://quantium.com/talk-to-us-retail/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded bg-white px-6 py-3 text-[14px] font-medium text-[#000006] transition-colors hover:bg-white/90"
            >
              Talk to an expert
            </Link>
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

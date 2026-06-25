"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QPromotionsPage() {
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
            src="/brands/quantium-com-au/FMCG_5_Macro_A-e1536505247703.jpg"
            alt="Q.Promotions"
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
              Q.Promotions
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Promotions puts advanced analytics into a simple tool to enable anyone in an
              organisation to make better pricing and promotion decisions.
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Promotions ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="mb-10 flex items-center gap-4">
            <img
              src="/brands/quantium-com-au/qpromotions-458x100.png"
              alt="Q.Promotions logo"
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
            What is Q.Promotions?
          </h2>
          <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Q.Promotions enables retailers and suppliers to understand whether their past promotions
            have achieved sufficient or expected sales, unit and profit uplifts and inform future
            promotional plans.
          </p>
          <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Promotional Effectiveness Tool (PET) enables both parties to make the best promotional
            decisions that maximise sales and profit uplifts for product and category.
          </p>

          {/* Video thumbnail */}
          <div className="relative overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
            <img
              src="/brands/quantium-com-au/q-promotions-vid-thumb-1024x576.jpg"
              alt="Q.Promotions video"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
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
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>
                  Optimise promotional effort – make the best promotion decisions at a range of
                  price points and avoid ineffective promotions
                </li>
                <li>
                  Drive up quality of promotions and deliver the best outcomes for the product and
                  category
                </li>
                <li>
                  Align supplier and retailer to one source of truth that delivers best outcomes for
                  all parties
                </li>
                <li>Deliver an increase in incremental sales and profit</li>
                <li>Plan effectively around category and product seasonality</li>
              </ul>
            </div>

            <div>
              <img
                src="/brands/quantium-com-au/FMCG_5_Micro-e1536505573716.jpg"
                alt="Q.Promotions benefits"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
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

      <QuantiumFooter />
    </div>
  );
}

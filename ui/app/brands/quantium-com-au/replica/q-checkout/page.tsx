"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QCheckoutPage() {
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
            src="/brands/quantium-com-au/iStock-603994268-e1536434350587.jpg"
            alt="Q.Checkout"
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
              Q.Checkout
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Checkout brings data to the heart of decision-making to foster a customer-centric
              business, making organisations more responsive to the people they serve
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Checkout ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="mb-10 flex items-center gap-4">
            <img
              src="/brands/quantium-com-au/qcheckout-399x100.png"
              alt="Q.Checkout logo"
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
            What is Q.Checkout?
          </h2>
          <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Q.Checkout is a premier retail analytics solution that combines sophisticated analytics
            with rich transaction and customer data to deliver unparalleled insights into category,
            brand, and product performance.
          </p>
          <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Discover key trends and actionable insights that drive business growth and give you a
            competitive edge in your market.
          </p>

          {/* Video thumbnail */}
          <div className="relative overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
            <img
              src="/brands/quantium-com-au/q-checkout-vid-thumb-1024x576.jpg"
              alt="Q.Checkout video"
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

              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Unlock powerful customer and category insights
              </h3>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Understand performance of your category with unprecedented depth</li>
                <li>Identify key metrics driving category performance</li>
                <li>Track how category performance shifts over time</li>
                <li>
                  Determine whether your category or brand performance is being driven by new
                  customers, switching behaviour, or increased existing customer spend
                </li>
              </ul>

              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Optimise your product category
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>
                  Identify best and worst performing products within your category across multiple
                  performance metrics, including customer loyalty
                </li>
                <li>
                  Understand diverse customer needs, identify category gaps and layout opportunities
                </li>
                <li>Measure the performance of recent product launches</li>
              </ul>
            </div>

            <div>
              <img
                src="/brands/quantium-com-au/FMCG_6_Supporting-e1536436052401.jpg"
                alt="Q.Checkout benefits"
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

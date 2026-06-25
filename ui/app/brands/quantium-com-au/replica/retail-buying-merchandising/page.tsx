"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function RetailBuyingMerchandisingPage() {
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
            src="/brands/quantium-com-au/Buying-and-merchandising-_Macro.png"
            alt="Buying and merchandising"
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
              Buying and merchandising
            </h1>
            <p className="mx-auto max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Master every product decision from sourcing to selling with AI. Transform how you negotiate with suppliers, curate assortments, and plan promotions using AI intelligence proven inside major retailers that turns merchandising decisions into competitive advantage.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Category\nsales growth" },
              { label: "Promotional ROI\nincreases" },
              { label: "Margin\noptimisation" },
              { label: "Return on\nspace increases" },
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
            {[
              {
                num: "01",
                title: "Q.Checkout",
                subtitle: "Unlock customer-driven growth",
                desc: "Transform every transaction into strategic advantage. Q.Checkout turns your existing transaction data into customer intelligence that reveals growth opportunities competitors miss, driving measurable improvements in ranging, pricing, and promotional performance.",
                cta: "Unlock your growth potential",
                img: "/brands/quantium-com-au/q-checkout-vid-thumb.jpg",
                imgAlt: "Q.Checkout",
              },
              {
                num: "02",
                title: "Q.Promotions",
                subtitle: "Unlock true promotional ROI",
                desc: "",
                cta: "Reveal your promo winners",
                img: "/brands/quantium-com-au/4A130622-B899-4447-8126-9EE4F77E7797.png",
                imgAlt: "Q.Promotions",
              },
              {
                num: "03",
                title: "Opticost",
                subtitle: "Master cost-driven negotiations",
                desc: "",
                cta: "See your cost breakdown",
              },
              {
                num: "04",
                title: "Assortment Recommender",
                subtitle: "Streamline ranging with data-driven precision",
                desc: "",
                cta: "Streamline your ranging",
                img: "/brands/quantium-com-au/0E981493-DAD4-483F-A42F-8A213204E658.png",
                imgAlt: "Assortment Recommender",
              },
              {
                num: "05",
                title: "Customer Decision Tree",
                subtitle: "Crack the code of customer choice",
                desc: "",
                cta: "Decode your categories",
              },
              {
                num: "06",
                title: "Pricing",
                subtitle: "Optimise prices for profit and competitiveness",
                desc: "",
                cta: "See a pricing demo",
              },
              {
                num: "07",
                title: "Buying Insights Accelerator",
                subtitle: "Identify your biggest cost reduction wins before competitors",
                desc: "",
                cta: "Find your opportunities",
              },
              {
                num: "08",
                title: "Automated Product Attribution",
                subtitle: "Transform product data into strategic advantage",
                desc: "",
                cta: "Build your data advantage",
              },
              {
                num: "09",
                title: "Store Clustering",
                subtitle: "Discover hidden commercial opportunities in your network",
                desc: "",
                cta: "See your network potential",
              },
            ].map((item) => (
              <div key={item.title} className="grid grid-cols-1 items-start gap-8 rounded border border-[#E5E5E5] p-6 md:grid-cols-2">
                <div>
                  <h3
                    className="mb-3 text-[24px] font-normal leading-[28px]"
                    style={{
                      fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                      color: "#000006",
                    }}
                  >
                    {item.num} {item.title}
                  </h3>
                  <p className="mb-2 text-[16px] font-medium leading-[22px] text-[#000006]">
                    {item.subtitle}
                  </p>
                  {item.desc && (
                    <p className="mb-4 text-[14px] leading-[20px] text-[#333]">{item.desc}</p>
                  )}
                  <Link
                    href="https://quantium.com/talk-to-us-retail/"
                    className="text-[14px] font-medium text-[#0091AE] hover:underline"
                  >
                    {item.cta}
                  </Link>
                </div>
                {item.img && (
                  <div className="relative overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
                    <img
                      src={item.img}
                      alt={item.imgAlt}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
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
            Intelligent promotional optimisation drives 8-10% higher margins
          </h2>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative w-full">
        <div className="relative flex w-full items-center justify-center overflow-hidden py-24">
          <img
            src="/brands/quantium-com-au/img-reimagine-your-retail-business.jpg"
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

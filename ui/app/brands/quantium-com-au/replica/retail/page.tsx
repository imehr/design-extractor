"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function RetailPage() {
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
            src="/brands/quantium-com-au/banner-new-2025.jpg"
            alt="Retail"
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
              Transform retail capabilities with AI-powered intelligence
            </h1>
            <p className="mx-auto max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Built by retailers, for retailers.
            </p>
            <p className="mx-auto mb-6 max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Proven retail solutions that solve your biggest challenges and deliver measurable results.
            </p>
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

      {/* ── What sets us apart ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            What sets us apart
          </h2>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { title: "Retail\nDNA", desc: "Retail expertise forged within a leading retailer" },
              { title: "Complete\nsolutions", desc: "Over 1k experts across data science, engineering, product, UX and strategy" },
              { title: "Strategic\npartner", desc: "Reimagining retail through AI and analytics across the full value chain" },
              { title: "Impact\ndriven", desc: "Understand customer segments and patterns for improved targeting and sales" },
            ].map((item) => (
              <div key={item.title} className="rounded border border-[#E5E5E5] p-6">
                <h3
                  className="mb-3 whitespace-pre-line text-[20px] font-normal leading-[24px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[20px] text-[#333]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Retail DNA ── */}
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
                Retail DNA
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Retail expertise forged within a leading retailer</li>
                <li>Over 1k experts across data science, engineering, product, UX and strategy</li>
                <li>Reimagining retail through AI and analytics across the full value chain</li>
              </ul>
            </div>
            <div>
              <img
                src="/brands/quantium-com-au/img-transform-retail.jpg"
                alt="Retail DNA"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Our retail solutions ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Our retail solutions
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: "Customer and retail media",
                desc: "Harness AI to transform customer relationships into a revenue engine.",
                href: "https://quantium.com/retail/customer-retail-media/",
              },
              {
                title: "Buying and merchandising",
                desc: "Master every product decision from sourcing to selling with AI.",
                href: "https://quantium.com/retail/retail-buying-merchandising/",
              },
              {
                title: "Operations and value chain",
                desc: "Unlock the power of AI from distribution centre to checkout.",
                href: "https://quantium.com/retail/operations-value-chain/",
              },
            ].map((item) => (
              <div key={item.title} className="rounded border border-[#E5E5E5] p-6">
                <h3
                  className="mb-3 text-[20px] font-normal leading-[24px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  {item.title}
                </h3>
                <p className="mb-4 text-[14px] leading-[20px] text-[#333]">{item.desc}</p>
                <Link
                  href={item.href}
                  className="text-[14px] font-medium text-[#0091AE] hover:underline"
                >
                  Learn more
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI leadership in retail ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            AI leadership in retail
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <img src="/brands/quantium-com-au/img-anthropic2.png" alt="Anthropic" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-azure2.png" alt="Azure" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-google-cloud2.png" alt="Google Cloud" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-snowflake2.png" alt="Snowflake" className="h-12 w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* ── Strategic partner ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Strategic partner
          </h2>
          <p className="max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Our 10-year Woolworths partnership demonstrates how deep retail expertise delivers results
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <img src="/brands/quantium-com-au/img-woolworths.png" alt="Woolworths" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-asda.png" alt="Asda" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-endeavour-group.png" alt="Endeavour Group" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-ebay.png" alt="eBay" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-bigw.png" alt="Big W" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/img-walmart.png" alt="Walmart" className="h-12 w-auto object-contain" />
            <img src="/brands/quantium-com-au/and-more-global-retailers.png" alt="And more global retailers" className="h-4 w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* ── Impact driven ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Impact driven
          </h2>
        </div>
      </section>

      {/* ── Our approach ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Our approach
          </h2>
        </div>
      </section>

      {/* ── Key outcomes ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Key outcomes
          </h2>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative w-full">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden py-24"
        >
          <img
            src="/brands/quantium-com-au/img-ready-to-transform-retail-business.jpg"
            alt="Ready to transform your retail business"
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
              Ready to transform your retail business?
            </h2>
            <Link
              href="https://quantium.com/talk-to-us-retail/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded bg-white px-6 py-3 text-[14px] font-medium text-[#000006] transition-colors hover:bg-white/90"
            >
              Talk to a retail expert
            </Link>
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

const PRODUCTS = [
  {
    name: "Q.Checkout",
    logo: "/brands/quantium-com-au/Qcheckout.png",
    href: "https://quantium.com/q-checkout/",
  },
  {
    name: "Q.Promotions",
    logo: "/brands/quantium-com-au/Qpromotions.png",
    href: "https://quantium.com/q-promotions/",
  },
  {
    name: "Q.Shelf",
    logo: "/brands/quantium-com-au/Qshelf.png",
    href: "https://quantium.com/q-shelf/",
  },
  {
    name: "Q.Supply",
    logo: "/brands/quantium-com-au/qsupply-white-small.png",
    href: "https://quantium.com/q-supply/",
  },
];

export default function FMCGCPGPage() {
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
            src="/brands/quantium-com-au/FMCG-3-a-1.jpg"
            alt="FMCG / CPG"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h1
              className="mb-4 text-[48px] font-normal leading-[62px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              FMCG / CPG
            </h1>
            <p className="max-w-[700px] text-[20px] font-light leading-[28px] text-white/90">
              Make better product, pricing and marketing decisions that transform returns. Target
              consumers one-on-one, and at scale.
            </p>
          </div>
        </div>
      </section>

      {/* ── Description ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="mb-6 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            We help brands engage their customers as unique individuals at scale: delivering an
            unrivalled understanding of what they want, when and how they want it, and the price
            they are willing to pay.
          </p>
          <p className="mb-6 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Our products and bespoke AI decision engines help brands make better product, pricing
            and marketing decisions that transform returns.
          </p>
        </div>
      </section>

      {/* ── Data ecosystem ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <img
                src="/brands/quantium-com-au/FMCG-3-b-e1520936091918.jpg"
                alt="FMCG data ecosystem"
                className="w-full object-cover"
              />
            </div>
            <div>
              <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
                Our world-class data ecosystem comprises billions of genuine transactions recorded
                over many years. It will enrich your understanding of consumers, helping pinpoint
                the drivers of past behaviour and predict their future needs.
              </p>
              <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
                Our unique personalisation capability enables brands to target consumers at scale,
                focusing marketing and price investments where they are most effective.
              </p>
              <p className="text-[16px] font-normal leading-[24px] text-[#333]">
                We help brands target shoppers with the right message, in the right place and at the
                right time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Graph ── */}
      <section className="w-full py-10">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <img
            src="/brands/quantium-com-au/graph.png"
            alt="FMCG analytics graph"
            className="mx-auto w-full max-w-[600px] object-contain"
          />
        </div>
      </section>

      {/* ── Products ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="mb-10 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Our products and bespoke analytics set suppliers up for success, helping transform
            customer understanding and partner with retailers for shared success.
          </p>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PRODUCTS.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-4"
              >
                <img
                  src={product.logo}
                  alt={product.name}
                  className="h-14 w-auto object-contain"
                />
                <span className="text-[14px] font-medium text-[#0091AE] hover:underline">
                  here
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="mb-6 text-[16px] font-normal leading-[24px] text-[#333]">
            Contact us about our FMCG solutions and bespoke analytics. Leverage customer analytics
            for your business today.
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

      <QuantiumFooter />
    </div>
  );
}

"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QShelfPage() {
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
            src="/brands/quantium-com-au/iStock-95769638-e1536507941613.jpg"
            alt="Q.Shelf"
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
              Q.Shelf
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Shelf ensures the customer is at the heart of range and space decisions.
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Shelf ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="mb-10 flex items-center gap-4">
            <img
              src="/brands/quantium-com-au/qshelf-265x100.png"
              alt="Q.Shelf logo"
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
            What is Q.Shelf?
          </h2>
          <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Q.Shelf harnesses data science to power better range and space decisions for retailers and suppliers.
          </p>
          <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Q.Shelf comprises of two key modules: Customer Decision Tree and Diagnose Range.
          </p>

          <Link
            href="https://quantium.com/talk-to-us/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded bg-[#000006] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#333]"
          >
            Talk to us
          </Link>

          {/* Video thumbnail */}
          <div className="relative mt-10 overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
            <img
              src="/brands/quantium-com-au/q-shelf-vid-thumb-1024x576.jpg"
              alt="Q.Shelf video"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Customer Decision Tree ── */}
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
                Customer Decision Tree (CDT) combines cutting edge data science to create a visual hierarchy of product attributes that drive customers&apos; purchasing behaviour
              </h2>

              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Benefits of CDT
              </h3>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Better understand how your customers make decisions</li>
                <li>Identify sets of products that meet similar customer needs</li>
                <li>Develop your ranging strategy</li>
                <li>Develop a common way of segmenting the category</li>
              </ul>
            </div>

            <div>
              <img
                src="/brands/quantium-com-au/FMCG-3-b-e1520936091918.jpg"
                alt="Customer Decision Tree"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Diagnose Range ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Diagnose Range enables assessment of range performance to discover growth opportunities and focus on strategic priorities
          </h2>

          <h3
            className="mb-3 text-[18px] font-medium leading-[24px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Benefits of Diagnose Range
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
            <li>Unlock insights from Australia&apos;s largest retailer</li>
            <li>Understand and compare product performance based on customer needs</li>
            <li>Review range efficiency across different customer needs</li>
            <li>Identify top and bottom performing products</li>
          </ul>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

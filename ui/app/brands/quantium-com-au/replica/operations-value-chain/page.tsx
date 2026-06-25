"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function OperationsValueChainPage() {
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
            src="/brands/quantium-com-au/Retail_4_Macro-1.png"
            alt="Operations and value chain"
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
              Operations and value chain
            </h1>
            <p className="mx-auto max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Unlock the power of AI from distribution centre to checkout. Eliminate inefficiencies across your value chain by optimising workforce productivity, ensuring product availability, streamlining distribution processes and empowering store teams with AI-driven intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Lost sales\nelimination" },
              { label: "Labour\nproductivity gains" },
              { label: "Distribution\nefficiency improvements" },
              { label: "Inventory shrinkage\nreduction" },
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
            {/* Quick Assist */}
            <div className="grid grid-cols-1 items-start gap-8 rounded border border-[#E5E5E5] p-6 md:grid-cols-2">
              <div>
                <h3
                  className="mb-3 text-[24px] font-normal leading-[28px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  01 Quick Assist
                </h3>
                <p className="mb-2 text-[16px] font-medium leading-[22px] text-[#000006]">
                  Direct store teams to true efficiency
                </p>
                <p className="mb-4 text-[14px] leading-[20px] text-[#333]">
                  Create efficient stores by focusing team efforts on what really matters. Quick Assist is an AI-native app that translates complex data into actionable recommendations to improve your most critical KPIs, with smart ranking logic that pinpoints the highest-impact actions—so teams act faster, with focus.
                </p>
                <p className="mb-2 text-[14px] font-medium leading-[20px] text-[#000006]">Key benefits:</p>
                <ul className="mb-4 list-disc space-y-1 pl-5 text-[14px] leading-[20px] text-[#333]">
                  <li>Reduce stock-loss and shrinkage by targeting specific management drivers</li>
                  <li>Increase customer satisfaction by addressing exact experience factors</li>
                </ul>
                <Link
                  href="https://quantium.com/talk-to-us-retail/"
                  className="text-[14px] font-medium text-[#0091AE] hover:underline"
                >
                  Unlock your store potential
                </Link>
              </div>
              <div />
            </div>

            {/* Workforce Management */}
            <div className="grid grid-cols-1 items-start gap-8 rounded border border-[#E5E5E5] p-6 md:grid-cols-2">
              <div>
                <h3
                  className="mb-3 text-[24px] font-normal leading-[28px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  02 Workforce Management
                </h3>
                <p className="mb-2 text-[16px] font-medium leading-[22px] text-[#000006]">
                  Maximise labour efficiency and reduce costs
                </p>
                <Link
                  href="https://quantium.com/talk-to-us-retail/"
                  className="text-[14px] font-medium text-[#0091AE] hover:underline"
                >
                  Optimise your workforce now
                </Link>
              </div>
              <div />
            </div>

            {/* Availability and Inventory Management */}
            <div className="grid grid-cols-1 items-start gap-8 rounded border border-[#E5E5E5] p-6 md:grid-cols-2">
              <div>
                <h3
                  className="mb-3 text-[24px] font-normal leading-[28px]"
                  style={{
                    fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                    color: "#000006",
                  }}
                >
                  03 Availability and Inventory Management
                </h3>
                <p className="mb-2 text-[16px] font-medium leading-[22px] text-[#000006]">
                  Control lost sales and inventory shrinkage
                </p>
                <Link
                  href="https://quantium.com/talk-to-us-retail/"
                  className="text-[14px] font-medium text-[#0091AE] hover:underline"
                >
                  Optimise your inventory
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
            Intelligent availability drives $270m sales uplift
          </h2>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative w-full">
        <div className="relative flex w-full items-center justify-center overflow-hidden py-24">
          <img
            src="/brands/quantium-com-au/man-buying-tomatoes.png"
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

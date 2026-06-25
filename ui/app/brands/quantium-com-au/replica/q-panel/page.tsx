"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QPanelPage() {
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
            src="/brands/quantium-com-au/FMCG_12_Macro.jpg"
            alt="Q.Panel"
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
              Q.Panel
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Panel is a unique shopper insights solution combining the power of Woolworths&apos; shopper data and Quantium&apos;s unparalleled analytics for insights into the what, where, when and why shoppers buy.
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Panel ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="mb-10 flex items-center gap-4">
            <img
              src="/brands/quantium-com-au/Q.Panel-501.png"
              alt="Q.Panel logo"
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
            What is Q.Panel?
          </h2>
          <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Answer your most complex questions with Q.Panel – Australia&apos;s premier panel and insights solution.
          </p>
          <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Q.Panel enables you to ask questions of Woolworths&apos; shoppers to uncover their wants and needs and validate what they claim against actual purchasing behaviour.
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
                Combine shopper survey results with best-in-class analytics to:
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Uncover hidden behaviours</li>
                <li>Discover shopper motivations</li>
                <li>Test complex hypotheses</li>
              </ul>

              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Pinpoint and target respondent shoppers from a panel of 109k plus Woolworths shoppers based on actual purchasing behaviour</li>
                <li>Translate insight into action by deepening your category conversations with Woolworths</li>
              </ul>
            </div>

            <div>
              <img
                src="/brands/quantium-com-au/fmcg_8_supporting.jpg"
                alt="Q.Panel benefits"
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

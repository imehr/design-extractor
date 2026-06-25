"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QAudiencePage() {
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
            src="/brands/quantium-com-au/Banking_3_Macro.jpg"
            alt="Q.Audience"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <img
              src="/brands/quantium-com-au/Q.Audience_REV.png"
              alt="Q.Audience"
              className="mx-auto mb-6 h-16 w-auto object-contain"
            />
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Audience accelerates the banking industry&apos;s move to personalisation by transforming customer transactional data into customer profiles, actionable insights and audiences
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Audience ── */}
      <section className="w-full py-16">
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
                What is Q.Audience?
              </h2>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q.Audience accelerates the banking industry&apos;s move to personalisation by transforming customer transactional data into customer profiles, actionable insights and audiences
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q.Audience is not currently offered in Australia.
              </p>
            </div>
            <div>
              <img
                src="/brands/quantium-com-au/Banking_7_Micro.jpg"
                alt="Q.Audience"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Key benefits ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Key benefits
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Accelerates your journey to a customer centric, personalised marketing approach
              </h3>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Moves beyond product and income segmentations</li>
                <li>Transaction data shows key triggers such as first child or booking a holiday</li>
              </ul>

              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Puts insights into the hands of your decision makers
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Improved decision making by making insights widely available</li>
                <li>Liberates internal data science team to work on higher value endeavours</li>
              </ul>
            </div>

            <div>
              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Increases velocity of campaign and creative execution
              </h3>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Automated campaign recommendations for your high value opportunities</li>
                <li>Better understand your key customers with rich customer profiles</li>
              </ul>

              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                Reduce reliance on third party data
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Use your own customer data to better segment and profile your customers</li>
                <li>Protect yourself against the death of third party cookies</li>
                <li>Use your own customer data to better segment and profile your customers.</li>
              </ul>
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

"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function BankingAndWealthPage() {
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
            src="/brands/quantium-com-au/banking-2-a.jpg"
            alt="Banking and wealth"
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
              Banking and wealth
            </h1>
          </div>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2">
            <div>
              <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
                Harness your data to enhance customer experience, reduce risk and realise growth.
              </p>
              <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
                Quantium helps banks extract maximum value from their data assets while driving down risk as open banking rewrites the rules of the game.
              </p>
              <p className="mb-8 text-[16px] font-normal leading-[24px] text-[#333]">
                We help our clients engage customers as unique individuals, predicting what they want, when and how they want it.
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

            <div>
              <img
                src="/brands/quantium-com-au/Banking__Wealth.png"
                alt="Banking and wealth"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Solutions ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Our solutions generate better pricing and credit risk decisions, improved channel utilisation (branch, digital and beyond) and more targeted and effective marketing, all delivered at scale.
          </p>
          <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            When it comes to banking, we simplify and optimise risk assessment and claims management, improving both customer experience and retention rates.
          </p>
          <p className="mb-12 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
            Our banking products help banks harness their data to deliver better customer experience, reduce risk and realize growth
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded border border-[#E5E5E5] p-6">
              <img
                src="/brands/quantium-com-au/Q.Audience-logo_REV_website.png"
                alt="Q.Audience"
                className="mb-4 h-16 w-auto object-contain"
              />
              <p className="text-[14px] leading-[20px] text-[#333]">
                Q.Audience accelerates the banking industry&apos;s move to personalisation by transforming customer transactional data into customer profiles, actionable insights and audiences.
              </p>
              <p className="mt-2 text-[14px] leading-[20px] text-[#666]">
                Currently not available in Australia.
              </p>
            </div>

            <div className="rounded border border-[#E5E5E5] p-6">
              <img
                src="/brands/quantium-com-au/Q.Refinery-logo_REV_website.png"
                alt="Q.Refinery"
                className="mb-4 h-16 w-auto object-contain"
              />
              <p className="text-[14px] leading-[20px] text-[#333]">
                Learn more about Q.Refinery{" "}
                <Link href="https://quantium.com/q-refinery/" className="text-[#0091AE] hover:underline">
                  here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

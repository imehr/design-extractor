"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QCheckupPage() {
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
            src="/brands/quantium-com-au/Checkup_Macro-e1536590333816.jpg"
            alt="Q.Checkup"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <img
              src="/brands/quantium-com-au/qcheckup-l-377x100.png"
              alt="Q.Checkup"
              className="mx-auto mb-6 h-16 w-auto object-contain"
            />
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Checkup puts market insights at your fingertips, making data-led decisions easy.
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Checkup ── */}
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
                What is Q.Checkup?
              </h2>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q.Checkup is a self-serve insight portal for the medical device market, giving you access to market insights across your product portfolio. Its outputs help businesses drive strategies across products, regions, providers and treatment areas. Q.Checkup provides a three sixty degree view of your market.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q.Checkup is not currently offered in Australia.
              </p>
            </div>
            <div>
              <img
                src="/brands/quantium-com-au/Checkup_Micro-e1536590118262.jpg"
                alt="Q.Checkup"
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
                Access and use the most comprehensive private healthcare data to make strategic and sales decisions for your business
              </h3>
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Understand where you are losing or gaining market share</li>
                <li>Track and monitor market trends</li>
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
                Improve data-driven decision-making through training with our expert analysts
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Empower your teams with the latest market insights that they can access from their desk or on the go</li>
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

"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QQuailPage() {
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
            src="/brands/quantium-com-au/Health_3_Macro.jpg"
            alt="Q.Quail"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <img
              src="/brands/quantium-com-au/Q.Quail_REV_logo.png"
              alt="Q.Quail"
              className="mx-auto mb-6 h-16 w-auto object-contain"
            />
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Quail transforms patient experience and safety with AI-powered insights
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Quail ── */}
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
                What is Q.Quail?
              </h2>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q.Quail streamlines how healthcare providers manage, analyse and act on patient feedback and safety incidents. By combining healthcare expertise with advanced analytics, it delivers actionable insights that drive measurable improvements in patient care and safety outcomes. Choose between our complete end-to-end solution or standalone modules.
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded border border-[#E5E5E5] p-4">
                  <h4 className="mb-1 text-[16px] font-medium text-[#000006]">Q.Capture</h4>
                  <p className="text-[14px] leading-[20px] text-[#333]">Transform your patient feedback collection with intelligent form design and AI assisted categorisation. Part of our end-to-end solution</p>
                </div>
                <div className="rounded border border-[#E5E5E5] p-4">
                  <h4 className="mb-1 text-[16px] font-medium text-[#000006]">Q.Resolve</h4>
                  <p className="text-[14px] leading-[20px] text-[#333]">Streamline case management with automated workflows, smart escalations and AI-driven action planning, available within our complete solution</p>
                </div>
                <div className="rounded border border-[#E5E5E5] p-4">
                  <h4 className="mb-1 text-[16px] font-medium text-[#000006]">Q.Respond</h4>
                  <p className="text-[14px] leading-[20px] text-[#333]">Generate personalised responses for complaints, incidents and other communications using advanced AI. Works seamlessly with existing systems or as part of our complete solution</p>
                </div>
                <div className="rounded border border-[#E5E5E5] p-4">
                  <h4 className="mb-1 text-[16px] font-medium text-[#000006]">Q.Action</h4>
                  <p className="text-[14px] leading-[20px] text-[#333]">Extract powerful insights from your patient experience and quality data using AI-driven analysis. Compatible with your existing systems or as part of our complete solution</p>
                </div>
              </div>
            </div>
            <div>
              <img
                src="/brands/quantium-com-au/Health_3_Micro.jpg"
                alt="Q.Quail"
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

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3
                className="mb-3 text-[18px] font-medium leading-[24px]"
                style={{
                  fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                  color: "#000006",
                }}
              >
                More time for care delivery
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Transform thousands of documents into insights in seconds</li>
                <li>Free your healthcare teams to focus on what they do best</li>
                <li>Automate feedback processing across all sources</li>
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
                Deeper understanding of care needs
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Uncover hidden patterns in feedback automatically</li>
                <li>Identify 3x more insights per piece of feedback</li>
                <li>Enable targeted improvements that enhance care quality</li>
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
                Effortless compliance
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Stay ahead of regulatory requirements confidently</li>
                <li>Support National Safety and Quality Standards reporting</li>
                <li>Maintain complete audit trails effortlessly</li>
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

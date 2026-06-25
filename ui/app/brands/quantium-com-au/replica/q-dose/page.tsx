"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

export default function QDosePage() {
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
            src="/brands/quantium-com-au/Untitled-design-2020-08-13T143316.572.jpg"
            alt="Q.Dose"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <img
              src="/brands/quantium-com-au/Q.Dose_REV_2.png"
              alt="Q.Dose"
              className="mx-auto mb-6 h-16 w-auto object-contain"
            />
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              Q.Dose gives a deep understanding of a patient&apos;s full suite of healthcare interventions and allows for sound data-informed decisions to be made
            </p>
          </div>
        </div>
      </section>

      {/* ── What is Q.Dose ── */}
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
                What is Q.Dose?
              </h2>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q.Dose gives a deep understanding of a patient&apos;s full suite of healthcare interventions and allows for sound data-informed decisions to be made
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Q.Dose is not currently offered in Australia.
              </p>
            </div>
            <div>
              <img
                src="/brands/quantium-com-au/Health_13_Micro_B.jpg"
                alt="Q.Dose"
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
              <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Go beyond sales data to understand how your pharma products are getting reimbursed and where</li>
                <li>Adapt your marketing and salesforce strategy using insights on the demographics of patients using your products and the providers prescribing them</li>
                <li>Identify opportunities for new products using data on historical disease incidence and prevalence</li>
              </ul>
            </div>

            <div>
              <ul className="list-disc space-y-2 pl-5 text-[16px] font-normal leading-[24px] text-[#333]">
                <li>Improve data-driven decision-making through training with our expert analysts</li>
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

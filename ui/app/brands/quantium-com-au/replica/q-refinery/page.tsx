"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";

const SLIDES_SET1 = [
  "/brands/quantium-com-au/slide-1-776cb5719356db8aa234337b7e17ec27.png",
  "/brands/quantium-com-au/slide-2-aa7bea9732a784c411dd60190e92bf8b.png",
  "/brands/quantium-com-au/slide-3-c8348483692144473469048285936b77.png",
  "/brands/quantium-com-au/slide-4-a0893d2f85633ea53953d24272ad6fb1.png",
];

const SLIDES_SET2 = [
  "/brands/quantium-com-au/slide-1-65bd3e7b8b379c166b94d425e5163b2e.png",
  "/brands/quantium-com-au/slide-2-c52c8f4bc23942a60ea97a6ecfc900b7.png",
  "/brands/quantium-com-au/slide-3-f81a0f374152896ce94ccd5d4a93be3c.png",
  "/brands/quantium-com-au/slide-4-e78c9cf2ff2f08399e7ea5f43210541b.png",
];

const CASE_SLIDES = [
  "/brands/quantium-com-au/case-slide-1-be7ac7dba6d6f0e8aa87524a792b1f45.jpg",
  "/brands/quantium-com-au/case-slide-2-27516a2d98ff2937d573465b08215a8c.jpg",
  "/brands/quantium-com-au/case-slide-3-eaccc3b9213ebf5786dddd33ce298834.jpg",
  "/brands/quantium-com-au/case-slide-4-8752027fb8569ca17733a84ebdf7974b.jpg",
  "/brands/quantium-com-au/case-slide-5-968810295e5524c75ab0ca840e6058f3.jpg",
  "/brands/quantium-com-au/case-slide-6-9e38488893211239afe30397784dfc51.jpg",
];

const ARTICLE_SLIDES = [
  "/brands/quantium-com-au/article-slide-1-7eb3a4b0504c156bc6e6c8d5999424b1.jpg",
  "/brands/quantium-com-au/article-slide-2-6511c92e12ec7d9ca8c1e047371f5da6.jpg",
  "/brands/quantium-com-au/article-slide-3-086e9c6efe19ed4654e53388efd7c9fb.jpg",
];

export default function QRefineryPage() {
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
          style={{ height: 520 }}
        >
          <img
            src="/brands/quantium-com-au/rainbow-only-desktop-b198a2cfd2c380f8c884e5f5a0bfbaca.png"
            alt="Q.Refinery"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <img
              src="/brands/quantium-com-au/logo-refinery-7074c837d1f01edebb008592f46c9290.png"
              alt="Q.Refinery"
              className="mx-auto mb-6 h-20 w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* ── Screenshots 1 ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {SLIDES_SET1.map((src, i) => (
              <div key={i} className="overflow-hidden rounded border border-[#E5E5E5]">
                <img src={src} alt={`Q.Refinery screenshot ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Illustration ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex-1">
              <img
                src="/brands/quantium-com-au/illustration-sm1-dccd63083843069b00e9e62d62317292.png"
                alt="Q.Refinery illustration"
                className="w-full object-contain"
              />
            </div>
            <div className="flex-1">
              <img
                src="/brands/quantium-com-au/illustration-sm-0625627531d038ee208b738706389c62.png"
                alt="Q.Refinery illustration"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Screenshots 2 ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {SLIDES_SET2.map((src, i) => (
              <div key={i} className="overflow-hidden rounded border border-[#E5E5E5]">
                <img src={src} alt={`Q.Refinery screenshot ${i + 5}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Case studies ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Case studies
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {CASE_SLIDES.map((src, i) => (
              <div key={i} className="overflow-hidden rounded border border-[#E5E5E5]">
                <img src={src} alt={`Case study ${i + 1}`} className="h-64 w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Articles ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Articles
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {ARTICLE_SLIDES.map((src, i) => (
              <div key={i} className="overflow-hidden rounded border border-[#E5E5E5]">
                <img src={src} alt={`Article ${i + 1}`} className="h-80 w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI / Wave ── */}
      <section className="relative w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <img
            src="/brands/quantium-com-au/wave-grid-90b5d18f19e1e6ce7fad6030298c0f9c.svg"
            alt="Wave"
            className="mb-8 w-full"
          />
          <div className="flex justify-center">
            <img
              src="/brands/quantium-com-au/logo-roi-37a4420e2f0fad2c9d1b3439896b33c2.png"
              alt="ROI"
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* ── Footer logo ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px] text-center">
          <img
            src="/brands/quantium-com-au/logo-refinery-7074c837d1f01edebb008592f46c9290.png"
            alt="Q.Refinery"
            className="mx-auto h-16 w-auto object-contain"
          />
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

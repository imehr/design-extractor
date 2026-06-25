"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

const VALUES = [
  {
    title: "Move fast with care",
    description:
      "We hustle with humility and heart, even under pressure. The quality of what we deliver is matched by the camaraderie we forge.",
    image: "/brands/quantium-com-au/move-fast-hero.png",
  },
  {
    title: "Reach for remarkable",
    description:
      "We respectfully challenge the status quo, with courage, passion and discipline. We keep our eyes on the details while making space to set sights on the dream.",
    image: "/brands/quantium-com-au/Value_Reach-for-remarkable_1-scaled.jpg",
  },
  {
    title: "Share our superpowers",
    description:
      "We recognise, value and celebrate what makes each and every one of us unique. Sharing our strengths, and helping others discover theirs makes for a better team.",
    image: "/brands/quantium-com-au/superpowers-hero.png",
  },
  {
    title: "Balance tomorrow with today",
    description:
      "We are measured and insightful, weighing both short and long-term trade-offs in our decision making. We thoughtfully consider the needs of our team, our partners, and our ethical role in society.",
    image: "/brands/quantium-com-au/balance-hero.png",
  },
  {
    title: "Drive for impact",
    description:
      "We own the responsibility to deliver tangible value to our partners and clients. We take the time to build strong relationships, and deliver a positive impact on the world.",
    image: "/brands/quantium-com-au/drive-hero.png",
  },
];

export default function AboutUsValuesPage() {
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
          style={{ height: 570 }}
        >
          <img
            src="/brands/quantium-com-au/hero-values.jpg"
            alt="Our purpose and values"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h1
              className="mb-4 text-[80px] font-normal leading-[80px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Our purpose and values
            </h1>
          </div>
        </div>
      </section>

      {/* ── Culture intro ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="max-w-[800px] text-[24px] font-light leading-[32px] text-[#000006]">
            Our culture is the bedrock of who we are as a collective, what we stand for, and how we
            show up for one another and our stakeholders.
          </p>
        </div>
      </section>

      {/* ── Our purpose ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[42px] font-normal leading-[42px] tracking-normal"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Our purpose
          </h2>
          <p className="max-w-[800px] text-[28px] font-light leading-[36px] text-[#000006]">
            We forge a better, more intelligent world.
          </p>
        </div>
      </section>

      {/* ── Our values ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-12 text-[42px] font-normal leading-[42px] tracking-normal"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Our values
          </h2>

          <div className="space-y-16">
            {VALUES.map((value, idx) => (
              <div
                key={value.title}
                className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 ${
                  idx % 2 === 1 ? "md:[direction:rtl]" : ""
                }`}
              >
                <div className={`${idx % 2 === 1 ? "md:[direction:ltr]" : ""}`}>
                  <img
                    src={value.image}
                    alt={value.title}
                    className="h-[400px] w-full object-cover"
                  />
                </div>
                <div className={`${idx % 2 === 1 ? "md:[direction:ltr]" : ""}`}>
                  <h3
                    className="mb-4 text-[28px] font-normal leading-[32px]"
                    style={{
                      fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                      color: "#000006",
                    }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-[16px] font-normal leading-[24px] text-[#333]">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Careers CTA ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="text-[16px] font-normal leading-[24px] text-[#333]">
            If you want to learn more about our values and find an opportunity with purpose, see our
            latest openings{" "}
            <Link href="https://quantium.com/careers/" className="text-[#0091AE] hover:underline">
              here
            </Link>
            .
          </p>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

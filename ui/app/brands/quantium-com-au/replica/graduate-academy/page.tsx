"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

const HERO_IMAGES = [
  "/brands/quantium-com-au/Graduate_Academy_Low_Res_Campus_Life_23.jpg",
  "/brands/quantium-com-au/Graduate_Academy_Low_Res_Campus_Life_8.jpg",
  "/brands/quantium-com-au/Graduate_Academy_Low_Res_Collaboration_13.jpg",
  "/brands/quantium-com-au/Graduate_Academy_Low_Res_Campus_Life_6.jpg",
  "/brands/quantium-com-au/Graduate_Academy_Low_Res_Campus_Life_14.jpg",
  "/brands/quantium-com-au/Graduate_Academy_Low_Res_Collaboration_3.jpg",
];

const FAQS = [
  {
    question: "Q: When does the Quantium Graduate Program start?",
    answer:
      "A: Our Graduate Academy programs in South Africa start in January, in Australia start in February, in India start in July, and in the UK start in September.",
  },
  {
    question: "Q: Who is eligible for a Quantium graduate role?",
    answer:
      "A: We are open to final year students as well as graduates who have completed their studies within the last 18 months. For Australian applicants, Graduate Visas (subclass 485) and Permanent Residency Visas are both accepted. If you are on another type",
  },
  {
    question: "Q: Can I apply for more than one position?",
    answer:
      "A: We encourage you to choose carefully and consider your strengths and interests as you are only able to apply for either the Analytics or Engineering stream, not both.",
  },
  {
    question: "Q: Can I relocate?",
    answer:
      "A: For the Australian Graduate Academy, we offer Analytics graduate roles in Sydney, Melbourne and Brisbane. For Engineering, these roles will be in Sydney. If you’re based in a different city but planning to move to one of these locations, you’re welcome to apply. We will provide",
  },
  {
    question: "Q: When can I apply?",
    answer:
      "A: Applications open in February / March to apply for a position in the following year’s Graduate Academy in Australia.",
  },
  {
    question: "Q: I might need some adjustments during my interviews, is your process flexible?",
    answer:
      "A: At Quantium we are an equal opportunity employer. If you require any reasonable adjustments to your interview process, please highlight this in the relevant field on the application form and reach out to the team. We",
  },
];

export default function GraduateAcademyPage() {
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

      {/* ── Hero banner carousel ── */}
      <section className="relative w-full">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden"
          style={{ height: 410 }}
        >
          <img
            src={HERO_IMAGES[0]}
            alt="Graduate Academy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h1
              className="mb-2 text-[48px] font-normal leading-[56px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Challenge your imagination
            </h1>
            <h2
              className="text-[28px] font-normal leading-[32px]"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              Join the Quantium Graduate Academy
            </h2>
          </div>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            This is your chance to make an impact, forge your path and find your kind.
          </h2>
          <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
            Join our award-winning Graduate Academy!
          </p>
          <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
            Quantium combines a diverse team of experts who are dedicated to harnessing the power of
            data to forge a better, more intelligent world.
          </p>
          <p className="mb-4 text-[16px] font-normal leading-[24px] text-[#333]">
            As an employer, we focus on fostering the professional learning and growth of our
            Graduates. We are inspired by their innovative thoughts and ever-growing capability.
          </p>
          <p className="text-[16px] font-normal leading-[24px] text-[#333]">
            Our Academy accelerates learning, enables top performance and helps place you in our
            dynamic teams across different industries.
          </p>
        </div>
      </section>

      {/* ── Video thumbnail ── */}
      <section className="w-full py-8">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="relative overflow-hidden rounded" style={{ aspectRatio: "16/9" }}>
            <img
              src="/brands/quantium-com-au/Video_Thumbnail.jpg"
              alt="Graduate Academy video"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Award badges ── */}
      <section className="w-full py-10">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <img
            src="/brands/quantium-com-au/GA-award-badges-top-row.png"
            alt="Award badges"
            className="mb-4 w-full object-contain"
          />
          <img
            src="/brands/quantium-com-au/GA-award-badges-bottom-row.png"
            alt="Award badges"
            className="w-full object-contain"
          />
        </div>
      </section>

      {/* ── Current graduate opportunities ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-6 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Current graduate opportunities
          </h2>
          <p className="mb-2 text-[16px] font-normal leading-[24px] text-[#333]">
            Applications are currently closed across all regions.
          </p>
          <p className="mb-6 text-[16px] font-normal leading-[24px] text-[#333]">
            Check back soon for upcoming opportunities.
          </p>
          <Link
            href="https://job-boards.anz.greenhouse.io/quantiumgrad"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[14px] font-medium text-[#0091AE] hover:underline"
          >
            View all graduate roles
          </Link>
        </div>
      </section>

      {/* ── Forage links ── */}
      <section className="w-full py-10">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="flex flex-wrap gap-6">
            <Link
              href="https://www.theforage.com/simulations/quantium/data-analytics-rqkb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-medium text-[#0091AE] hover:underline"
            >
              analytics
            </Link>
            <Link
              href="https://www.theforage.com/simulations/quantium/software-engineering-j6ci"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-medium text-[#0091AE] hover:underline"
            >
              engineering
            </Link>
          </div>
        </div>
      </section>

      {/* ── Frequently asked questions ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-8 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <p className="mb-2 text-[16px] font-medium leading-[24px] text-[#000006]">
                  {faq.question}
                </p>
                <p className="text-[16px] font-normal leading-[24px] text-[#333]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

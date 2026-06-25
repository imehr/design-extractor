"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";
import Link from "next/link";

const PARTNERS = [
  { src: "/brands/quantium-com-au/AUG-Health-and-aged-care-1.png", alt: "AUG Health and aged care" },
  { src: "/brands/quantium-com-au/AUG-aged-care-quality-and-safety-1.png", alt: "AUG aged care quality and safety" },
  { src: "/brands/quantium-com-au/NHS-1.png", alt: "NHS" },
  { src: "/brands/quantium-com-au/Discovery-Health-1.png", alt: "Discovery Health" },
  { src: "/brands/quantium-com-au/Vitality-1.png", alt: "Vitality" },
  { src: "/brands/quantium-com-au/Gates-foundation-1.png", alt: "Gates Foundation" },
  { src: "/brands/quantium-com-au/Bupa-1.png", alt: "Bupa" },
  { src: "/brands/quantium-com-au/JJ-1.png", alt: "Johnson & Johnson" },
  { src: "/brands/quantium-com-au/Pfizer-1.png", alt: "Pfizer" },
  { src: "/brands/quantium-com-au/Medtronic-1.png", alt: "Medtronic" },
];

const LEADERS = [
  { name: "Brian Hartzer", src: "/brands/quantium-com-au/Brian-Hartzer.jpg", href: "https://quantium.com/our-locations/brian-hartzer/" },
  { name: "Adam Reid", src: "/brands/quantium-com-au/Adam-Reid.png", href: "https://quantium.com/our-locations/adam-reid/" },
  { name: "Natalie Phan", src: "/brands/quantium-com-au/Natalie-Phan.png", href: "https://quantium.com/our-locations/natalie-phan/" },
  { name: "Sharon Ponniah", src: "/brands/quantium-com-au/Sharon-Ponniah.png", href: "https://quantium.com/our-locations/sharon-ponniah/" },
  { name: "Alix Duncan", src: "/brands/quantium-com-au/Alix-Duncan.png", href: "https://quantium.com/our-locations/alix-duncan/" },
  { name: "Ana Andreska", src: "/brands/quantium-com-au/Ana-Andreska.png", href: "https://quantium.com/our-locations/ana-andreska/" },
  { name: "Ben Cockrell", src: "/brands/quantium-com-au/Ben-Cockrell.png", href: "https://quantium.com/our-locations/ben-cockrell/" },
  { name: "Ben Kenyon", src: "/brands/quantium-com-au/Ben-Kenyon.png", href: "https://quantium.com/our-locations/ben-kenyon/" },
  { name: "Conrad Hamill", src: "/brands/quantium-com-au/Conrad-Hamill.jpg", href: "https://quantium.com/our-locations/conrad-hamill/" },
  { name: "Saurav Acharya", src: "/brands/quantium-com-au/Saurav-Acharya.jpg", href: "https://quantium.com/our-locations/saurav-acharya/" },
];

export default function HealthPage() {
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
            src="/brands/quantium-com-au/Health-macro-resize-e1536588071371.jpg"
            alt="Health"
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
              Health
            </h1>
            <p className="max-w-[700px] text-[18px] font-light leading-[26px] text-white/90">
              At Quantium Health, our purpose is to empower healthier lives through analytics.
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2">
            <div>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                We achieve this by helping health sector policy makers, payers, providers, and suppliers to improve the quality and accessibility of health care through sophisticated analytics and actionable insights.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Quantium Health applies advanced analytics and AI-driven insights to improve health outcomes, support policy, and drive efficiency across healthcare systems and their participants.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Quantium Health delivers cutting edge analytics that improve the quality, efficiency, and accessibility of care for health sector participants, including payers, providers, and policymakers. Our solutions are designed to drive measurable impact, from streamlining operations to enhancing patient outcomes.
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Our team includes healthcare experts, data scientists, and data platform engineers based in Australia, the UK, South Africa, and the US, bringing a uniquely global perspective to complex healthcare challenges. With exclusive IP and insights from our joint venture with Discovery Group (creators of the Vitality Shared-Value Insurance model).
              </p>
              <p className="mb-4 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                We work in partnership with our clients to co-create solutions that drive lasting impact. Our approach priorities regulatory compliance, privacy, and ethical standards, ensuring our solutions build and sustain trust across the healthcare landscape.
              </p>
              <p className="mb-8 max-w-[800px] text-[16px] font-normal leading-[24px] text-[#333]">
                Our consulting and technology solutions harness data from multiple sources to support clinicians, policy makers, and patients to benefit from a holistic view of health and health care delivery.
              </p>
            </div>
            <div>
              <img
                src="/brands/quantium-com-au/Health_4_Supporting.jpg"
                alt="Health"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            We partner with leading organisations across the health care sector on their greatest challenges, using data to unlock transformational opportunities.
          </h2>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {PARTNERS.map((p) => (
              <div key={p.alt} className="flex items-center justify-center rounded border border-[#E5E5E5] p-4">
                <img src={p.src} alt={p.alt} className="h-16 w-auto object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership team ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <h2
            className="mb-10 text-[28px] font-normal leading-[32px]"
            style={{
              fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
              color: "#000006",
            }}
          >
            Quantium Health leadership team
          </h2>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {LEADERS.map((leader) => (
              <Link
                key={leader.name}
                href={leader.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded border border-[#E5E5E5] transition-shadow hover:shadow-md"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={leader.src}
                    alt={leader.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-[16px] font-medium text-[#000006]">{leader.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product cards ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded border border-[#E5E5E5] p-8">
              <img
                src="/brands/quantium-com-au/Qcheckup.png"
                alt="Q.Checkup"
                className="mb-6 h-12 w-auto object-contain"
              />
              <p className="mb-4 text-[16px] leading-[24px] text-[#333]">
                Q.Checkup puts market insights at your fingertips, making data-led decisions easy.
              </p>
              <Link
                href="https://quantium.com/q-checkup/"
                className="text-[14px] font-medium text-[#0091AE] hover:underline"
              >
                Learn more
              </Link>
            </div>
            <div className="rounded border border-[#E5E5E5] p-8">
              <img
                src="/brands/quantium-com-au/Q.Dose_REV_2.png"
                alt="Q.Dose"
                className="mb-6 h-12 w-auto object-contain"
              />
              <p className="mb-4 text-[16px] leading-[24px] text-[#333]">
                Q.Dose gives a deep understanding of a patient&apos;s full suite of healthcare interventions and allows for sound data-informed decisions to be made.
              </p>
              <Link
                href="https://quantium.com/q-dose/"
                className="text-[14px] font-medium text-[#0091AE] hover:underline"
              >
                Learn more
              </Link>
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

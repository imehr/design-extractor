"use client";

import { QuantiumHeader } from "@/components/brands/quantium-com-au/quantium-com-au-header";
import { QuantiumFooter } from "@/components/brands/quantium-com-au/quantium-com-au-footer";

const FAQS = [
  {
    num: "01",
    question: "What does Quantium do?",
    answer:
      "Quantium partners with leading organisations to solve complex business challenges through AI. We combine 23 years of technical depth with focus on your strategic priorities – profitability, cost pressures, market position. We work with your data and systems securely building AI that runs in production. We cover traditional analytics, machine learning, and generative AI – understanding both the technical work and the practical challenges of getting AI deployed and working.",
  },
  {
    num: "02",
    question: "What makes Quantium different?",
    answer: "",
  },
  {
    num: "03",
    question: "What industries does Quantium work in?",
    answer:
      "Quantium works across industries including retail, financial services, telecommunications, healthcare, government, professional services, legal, mining and resources, travel and tourism, recruitment, investment banking, and beyond. Our cross-industry experience helps us bring proven approaches from one sector to another.",
  },
  {
    num: "04",
    question: "Where is Quantium located?",
    answer:
      "Quantium is headquartered in Sydney, Australia, with 13 locations globally. Founded in 2002, we partner with clients worldwide with teams in Sydney, Melbourne, Brisbane, Canberra, Auckland, New York, San Francisco, Nashville, London, Manchester, Cape Town, Johannesburg, and Hyderabad.",
  },
  {
    num: "05",
    question: "What services does Quantium offer?",
    answer: "",
  },
  {
    num: "06",
    question: "What is Quantium's GenAI transformation service?",
    answer: "",
  },
  {
    num: "07",
    question: "What is AI Edge?",
    answer: "",
  },
  {
    num: "08",
    question: "What AI platforms and tools does Quantium work with?",
    answer: "",
  },
  {
    num: "09",
    question: "How does Quantium approach data privacy?",
    answer: "",
  },
  {
    num: "10",
    question: "Who are Quantium's AI and technology partners?",
    answer: "",
  },
  {
    num: "11",
    question: "What are Quantium's joint ventures?",
    answer: "",
  },
  {
    num: "12",
    question: "Who are Quantium's clients?",
    answer: "",
  },
];

export default function FAQsPage() {
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
            src="/brands/quantium-com-au/banner-faq.jpg"
            alt="FAQs"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 px-6 text-center">
            <h1
              className="text-[80px] font-normal leading-[80px] tracking-normal"
              style={{
                fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                color: "#ffffff",
              }}
            >
              FAQs
            </h1>
          </div>
        </div>
      </section>

      {/* ── Intro ── */}
      <section className="w-full py-10">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <p className="text-[16px] font-normal leading-[24px] text-[#333]">
            Find answers to frequently asked questions about our capabilities, approach, and
            partnerships.
          </p>
        </div>
      </section>

      {/* ── FAQ list ── */}
      <section className="w-full pb-16">
        <div className="mx-auto max-w-[1280px] px-6 md:px-[100px]">
          <div className="divide-y divide-[#E5E5E5]">
            {FAQS.map((faq) => (
              <div key={faq.num} id={`faq-${faq.num}`} className="py-8">
                <div className="mb-3 flex items-start gap-4">
                  <span
                    className="mt-1 text-[14px] font-medium text-[#0091AE]"
                    style={{ minWidth: 28 }}
                  >
                    {faq.num}.
                  </span>
                  <h3
                    className="text-[20px] font-normal leading-[28px]"
                    style={{
                      fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif",
                      color: "#000006",
                    }}
                  >
                    {faq.question}
                  </h3>
                </div>
                {faq.answer && (
                  <p className="pl-12 text-[16px] font-normal leading-[24px] text-[#333]">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuantiumFooter />
    </div>
  );
}

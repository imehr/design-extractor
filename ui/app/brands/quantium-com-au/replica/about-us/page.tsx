"use client";

import { QtHeader } from "@/components/brands/quantium-com-au/qt-header";
import { QtFooter } from "@/components/brands/quantium-com-au/qt-footer";
import { Separator } from "@/components/ui/separator";

const QUANTIUM_FONT = "'QuantiumPro', Inter, sans-serif";

/* ---------- Data from DOM extraction ---------- */

const DIRECTORS = [
  {
    name: "Peter Tonagh",
    title: "Chair",
    bio: "Peter was appointed to the Quantium Board in 2020. Peter was the first independent Non-Executive Chairman and is currently Chair of the Quantium Board.",
  },
  {
    name: "Caryn Katsikogianis",
    title: "Non-Executive Director",
    bio: "Caryn was appointed to the Quantium Board in October 2024 and is the Chief People Officer of Woolworths Group.",
  },
  {
    name: "Adam Driussi",
    title: "Chief Executive Officer",
    bio: "Adam co-founded Quantium in 2002 and is the Chief Executive Officer. Adam has overall responsibility for Quantium's strategy and operations.",
  },
];

const GROUP_EXECUTIVES = [
  {
    name: "Natalie Jones",
    title: "Group Executive - People & Culture",
    bio: "Natalie is a passionate and commercially focused Executive who drives purposeful growth through an effective People and Culture agenda.",
  },
  {
    name: "Brent Merrin",
    title: "Chief Financial Officer",
    bio: "Brent brings extensive experience managing finance and commercial teams. As well as leading our finance function, Brent also leads Quantium's Strategy and Group Services teams.",
  },
  {
    name: "Ben Chan",
    title: "Chief AI Officer",
    bio: "Ben leads Quantium's AI strategy, transformation, and engineering teams across the organisation.",
  },
];

/* ---------- Page component ---------- */

export default function AboutUsPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        fontSize: 16,
        color: "#000006",
      }}
    >
      <QtHeader activePage="About us" />

      {/* ── Hero ── */}
      <section className="relative w-full">
        <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[1fr_1fr]">
          {/* Left: text */}
          <div className="flex flex-col justify-center py-16 pl-[100px] pr-10">
            <h1
              className="mb-6 text-[80px] font-normal leading-[1.05] tracking-tight"
              style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
            >
              About us
            </h1>
            <p className="max-w-[520px] text-[18px] font-light leading-relaxed text-[#333]">
              Founded in 2002, Quantium is a global leader in Data Science and
              Artificial Intelligence. With over 1,200 team members across 13
              locations globally, we help organisations maximise the potential of
              their data and solve some of their most pressing challenges.
            </p>
          </div>
          {/* Right: image */}
          <div className="relative overflow-hidden">
            <img
              src="/brands/quantium-com-au/hero-1.jpg"
              alt="Quantium office with branding on wall"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── About description ── */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <p className="max-w-[800px] text-[18px] font-light leading-relaxed text-[#444]">
            Our unique partnership model enables leading organisations across the
            world to accelerate the value of data and AI for its business and
            customers. This approach also enables Quantium to bring world-class
            IP developed within these partnerships to new markets and industries.
          </p>
        </div>
      </section>

      {/* ── Directors ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-4 text-[36px] font-normal tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            Directors
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {DIRECTORS.map((person) => (
              <div key={person.name} className="group">
                {/* Placeholder portrait */}
                <div className="mb-4 aspect-square w-full overflow-hidden bg-[#EFEFEF]">
                  <div className="flex h-full w-full items-center justify-center text-[48px] font-light text-[#CCC]">
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                </div>
                <h3
                  className="mb-1 text-[20px] font-medium"
                  style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
                >
                  {person.name}
                </h3>
                <p className="mb-2 text-[14px] font-medium text-[#F25648]">
                  {person.title}
                </p>
                <p className="text-[15px] font-light leading-relaxed text-[#555]">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Group Executives ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-4 text-[36px] font-normal tracking-tight"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            Group Executives
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {GROUP_EXECUTIVES.map((person) => (
              <div key={person.name} className="group">
                {/* Placeholder portrait */}
                <div className="mb-4 aspect-square w-full overflow-hidden bg-[#EFEFEF]">
                  <div className="flex h-full w-full items-center justify-center text-[48px] font-light text-[#CCC]">
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                </div>
                <h3
                  className="mb-1 text-[20px] font-medium"
                  style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
                >
                  {person.name}
                </h3>
                <p className="mb-2 text-[14px] font-medium text-[#F25648]">
                  {person.title}
                </p>
                <p className="text-[15px] font-light leading-relaxed text-[#555]">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Google Cloud Partner ── */}
      <section className="w-full border-t border-[#E5E5E5] py-16">
        <div className="mx-auto flex max-w-[1280px] items-center justify-center px-[100px]">
          <img
            src="/brands/quantium-com-au/images/Google_Cloud_Partner.png"
            alt="Google Cloud Partner"
            className="h-[80px] w-auto object-contain"
          />
        </div>
      </section>

      <QtFooter />
    </div>
  );
}

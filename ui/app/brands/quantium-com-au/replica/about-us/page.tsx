"use client";

import { QtHeader } from "@/components/brands/quantium-com-au/qt-header";
import { QtFooter } from "@/components/brands/quantium-com-au/qt-footer";
import { Separator } from "@/components/ui/separator";

/* ---------- Data from DOM extraction ---------- */

const DIRECTORS = [
  {
    name: "Peter Tonagh",
    title: "Chair",
    photo: "/brands/quantium-com-au/images/peter-tonagh.jpg",
  },
  {
    name: "Caryn Katsikogianis",
    title: "Non Executive Director",
    photo: "/brands/quantium-com-au/images/caryn-katsikogianis.jpg",
  },
  {
    name: "Adam Driussi",
    title: "Chief Executive Officer",
    photo: "/brands/quantium-com-au/images/adam-driussi.jpg",
  },
  {
    name: "Greg Schneider",
    title: "Executive Director",
    photo: "/brands/quantium-com-au/images/greg-schneider.jpg",
  },
  {
    name: "Colin Storrie",
    title: "Non-Executive Director",
    photo: "/brands/quantium-com-au/images/colin-storrie.jpg",
  },
  {
    name: "John Hunt",
    title: "Non-Executive Director",
    photo: "/brands/quantium-com-au/images/john-hunt.png",
  },
  {
    name: "Stephen Harrison",
    title: "Non-Executive Director",
    photo: "/brands/quantium-com-au/images/stephen-harrison.jpg",
  },
];

const GROUP_EXECUTIVES = [
  {
    name: "Natalie Jones",
    title: "Group Executive - People & Culture",
    photo: "/brands/quantium-com-au/images/natalie-jones.png",
  },
  {
    name: "Brent Merrin",
    title: "Chief Financial Officer",
    photo: "/brands/quantium-com-au/images/brent-merrin.png",
  },
  {
    name: "Ben Chan",
    title: "Chief AI Officer",
    photo: "/brands/quantium-com-au/images/ben-chan.jpg",
  },
  {
    name: "Kyle Evans",
    title: "Executive Manager",
    photo: "/brands/quantium-com-au/images/kyle-evans.jpg",
  },
  {
    name: "Kylie Gleeson",
    title: "CEO of Quantium Health",
    photo: "/brands/quantium-com-au/images/kylie-gleeson.png",
  },
  {
    name: "Rohan Dixit",
    title: "Executive Manager",
    photo: "/brands/quantium-com-au/images/rohan-dixit.jpg",
  },
  {
    name: "Brian Hartzer",
    title: "Managing Director – Q-Retail",
    photo: "/brands/quantium-com-au/images/brian-hartzer.jpg",
  },
  {
    name: "Makenna Ralston",
    title: "Executive Manager",
    photo: "/brands/quantium-com-au/images/makenna-ralston.jpg",
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

      {/* ── Hero banner carousel (full-bleed) ── */}
      <section className="relative w-full">
        <div className="relative h-[472px] w-full overflow-hidden">
          <img
            src="/brands/quantium-com-au/images/about-hero.jpg"
            alt="Aerial view of city buildings with green rooftop gardens"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </section>

      {/* ── About us heading + intro ── */}
      <section className="relative w-full">
        <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[1fr_1fr]">
          {/* Left: text */}
          <div className="flex flex-col justify-center py-16 pl-[100px] pr-10">
            <h1
              className="mb-6 text-[80px] font-normal leading-[80px] tracking-normal"
              style={{ fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif", color: "#000006" }}
            >
              About us
            </h1>
            <p className="max-w-[520px] text-[16px] font-normal leading-[19.2px] text-[#000006]">
              Founded in 2002, Quantium is a global leader in Data Science and
              Artificial Intelligence. With over 1,200 team members across 13
              locations globally, we help organisations maximise the potential of
              their data and solve some of their most pressing challenges.
            </p>
          </div>
          {/* Right: image */}
          <div className="relative overflow-hidden">
            <img
              src="/brands/quantium-com-au/images/hero-bg-1.jpg"
              alt="Quantium office with branding on wall"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── About description ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <p className="mb-6 max-w-[800px] text-[16px] font-normal leading-[19.2px] text-[#000006]">
            Our unique partnership model enables leading organisations across the
            world to accelerate the value of data and AI for its business and
            customers. This approach also enables Quantium to bring world-class
            IP developed within these partnerships to new sectors, clients and markets.
          </p>
          <p className="max-w-[800px] text-[16px] font-normal leading-[19.2px] text-[#000006]">
            We have established joint ventures with industry leaders Commonwealth
            Bank of Australia (CommBank iQ), Telstra (Quantium Telstra), and
            Discovery (Quantium Health). In retail, we have partnered with
            Woolworths Group and established &apos;wiq&apos; &ndash; a team that brings
            together best-in-class retail and data analytics experts to reimagine
            retail and transform customer and supplier experiences. In 2021, we
            strengthened this partnership and Woolworths Group now has a majority
            shareholding in Quantium.
          </p>
        </div>
      </section>

      {/* ── Directors ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-4 text-[42px] font-normal leading-[42px] tracking-normal"
            style={{ fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif", color: "#000006" }}
          >
            Directors
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />

          <div className="grid grid-cols-1 gap-x-[264px] gap-y-[44px] sm:grid-cols-2" style={{ maxWidth: 976 }}>
            {DIRECTORS.map((person) => (
              <div key={person.name} className="group">
                <div className="relative mb-4 w-full overflow-hidden rounded" style={{ aspectRatio: "9/10" }}>
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
                <h3
                  className="mb-0.5 text-[18px] font-medium leading-snug"
                  style={{ fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif", color: "#000006" }}
                >
                  {person.name}
                </h3>
                {person.title && (
                  <p className="text-[14px] font-normal text-[#666]">
                    {person.title}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Group Executives ── */}
      <section className="w-full py-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h2
            className="mb-4 text-[42px] font-normal leading-[42px] tracking-normal"
            style={{ fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif", color: "#000006" }}
          >
            Group Executives
          </h2>
          <Separator className="mb-12 bg-[#E5E5E5]" />

          <div className="grid grid-cols-1 gap-x-[264px] gap-y-[44px] sm:grid-cols-2" style={{ maxWidth: 976 }}>
            {GROUP_EXECUTIVES.map((person) => (
              <div key={person.name} className="group">
                <div className="relative mb-4 w-full overflow-hidden rounded" style={{ aspectRatio: "9/10" }}>
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
                <h3
                  className="mb-0.5 text-[18px] font-medium leading-snug"
                  style={{ fontFamily: "quantium_promedium, 'QuantiumPro', Inter, sans-serif", color: "#000006" }}
                >
                  {person.name}
                </h3>
                {person.title && (
                  <p className="text-[14px] font-normal text-[#666]">
                    {person.title}
                  </p>
                )}
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

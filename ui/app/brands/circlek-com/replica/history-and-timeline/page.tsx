import Image from "next/image";
import Link from "next/link";
import { CircleKHeader } from "@/components/brands/circlek-com/circlek-com-header";
import { CircleKFooter } from "@/components/brands/circlek-com/circlek-com-footer";

const BASE = "/brands/circlek-com/replica";
const IMG = "/brands/circlek-com";

const SUB_NAV = [
  { text: "History and timeline", href: `${BASE}/history-and-timeline`, active: true },
  { text: "FAQ", href: `${BASE}` },
  { text: "Our Sustainability Journey", href: `${BASE}` },
];

const TIMELINE_ENTRIES: { year: string; text: string; image?: { src: string; alt: string } }[] = [
  {
    year: "2017",
    text: "Continued roll-out of Circle K global brand to Canada (Ontario, Manitoba, Saskatchewan, Alberta, British Columbia, and the Maritimes), Latvia, Lithuania, Estonia, and Poland",
    image: { src: `${IMG}/timeline_01.jpg`, alt: "Downtown view of a beautiful city in Europe." },
  },
  {
    year: "2016",
    text: "Roll-out of Circle K global brand in Norway, Sweden, and Denmark",
    image: { src: `${IMG}/timeline_02.jpg`, alt: "Cityscape view of commercial buildings." },
  },
  {
    year: "2015",
    text: "\u2014",
    image: { src: `${IMG}/timeline_03.jpg`, alt: "Palm trees under blue sky in Mexico." },
  },
  { year: "2012", text: "\u2014" },
  {
    year: "2011",
    text: "\u2014",
    image: { src: `${IMG}/timeline_04.jpg`, alt: "Curved Road along with mountain and forest." },
  },
  { year: "2008", text: "\u2014" },
  {
    year: "2005",
    text: "\u2014",
    image: { src: `${IMG}/timeline_05.jpg`, alt: "City Skyline with lake view." },
  },
  { year: "2003", text: "\u2014" },
  {
    year: "2002",
    text: "\u2014",
    image: { src: `${IMG}/timeline_07.jpg`, alt: "An alley in a forest." },
  },
  { year: "2001", text: "\u2014" },
  {
    year: "1999",
    text: "\u2014",
    image: { src: `${IMG}/timeline_06.jpg`, alt: "A crowd of people enjoying the sunset at a beach." },
  },
  { year: "1998", text: "\u2014" },
  { year: "1997", text: "\u2014" },
  {
    year: "1996",
    text: "\u2014",
    image: { src: `${IMG}/timeline_08.jpg`, alt: "Curved road next to lake under horizon." },
  },
  { year: "1995", text: "\u2014" },
  { year: "1994", text: "\u2014" },
  { year: "1993", text: "\u2014" },
  {
    year: "1990",
    text: "\u2014",
    image: { src: `${IMG}/timeline_09.jpg`, alt: "Desert with short bushes under blue skies in Arizona." },
  },
  { year: "1984", text: "\u2014" },
  { year: "1983", text: "\u2014" },
  { year: "1979", text: "\u2014" },
  { year: "1975", text: "\u2014" },
  { year: "1971", text: "\u2014" },
  { year: "1965", text: "\u2014" },
  { year: "1957", text: "\u2014" },
  { year: "1951", text: "\u2014" },
];

export default function HistoryAndTimelinePage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'ACT Easy', sans-serif" }}
    >
      <CircleKHeader activePage="About us" />

      {/* ── Hero ── */}
      <section
        className="relative flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #DA291C 50%, #8B0000 100%)",
          minHeight: 320,
        }}
      >
        <h1
          className="text-center text-white"
          style={{ fontSize: 80, fontWeight: 800, lineHeight: "1.05" }}
        >
          History and Timeline
        </h1>
      </section>

      {/* ── Sub-navigation tabs ── */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center gap-8 px-4">
          {SUB_NAV.map((item) => (
            <Link
              key={item.text}
              href={item.href}
              className={`relative py-4 text-sm font-semibold transition-colors ${
                item.active
                  ? "text-[#DA291C]"
                  : "text-[#313131] hover:text-[#DA291C]"
              }`}
            >
              {item.text}
              {item.active && (
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#DA291C]" />
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── History Section ── */}
      <section className="py-16">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-4 md:grid-cols-[1fr_auto]">
          {/* Text column */}
          <div>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#595959", lineHeight: "25.6px" }} className="mb-6">
              Circle K&apos;s success in the convenience retailing industry spans more than 60 years.
              Our roots trace back to 1951 when Fred Hervey purchased three Kay&apos;s Food Stores in
              El Paso, Texas. Little did anyone know that these stores would serve as the beginning of
              Circle K.
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#595959", lineHeight: "25.6px" }} className="mb-6">
              During the early years, Hervey&apos;s enterprising spirit enabled the company to make its
              mark in the southwestern part of the United States. He grew the Circle K chain into
              neighboring New Mexico and Arizona.
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#595959", lineHeight: "25.6px" }} className="mb-6">
              During the next few decades, Circle K grew its retail network through a series of
              acquisitions, which were incorporated into the Circle K brand. By 1975, there were 1,000
              Circle K stores across the U.S. In 1979, Circle K entered the international market when
              a licensing agreement established the first Circle K stores in Japan.
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#595959", lineHeight: "25.6px" }} className="mb-6">
              In 1999, a franchise program was introduced to support operators looking to build a
              business with a leading convenience store brand. In 2003, Circle K was acquired by
              Alimentation Couche-Tard and has developed into a global brand represented in over 20
              countries.
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: "#595959", lineHeight: "25.6px" }}>
              Circle K has become one of the most widely recognized convenience store brands, known
              worldwide for quality products and great customer service. We have come a long way since
              our humble beginnings, and we&apos;re proud of where we&apos;ve been and where
              we&apos;re going.
            </p>
          </div>

          {/* Image column */}
          <div className="flex-shrink-0">
            <Image
              src={`${IMG}/history_image.jpeg`}
              alt="Storefront of Circle K."
              width={647}
              height={443}
              className="rounded-sm object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── International market heading ── */}
      <section className="pb-4 pt-8">
        <div className="mx-auto max-w-[1200px] px-4">
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#313131" }}>
            International market
          </h2>
        </div>
      </section>

      {/* ── Timeline Section ── */}
      <section className="py-12">
        <div className="mx-auto max-w-[1200px] px-4">
          <h3 style={{ fontSize: 24, fontWeight: 800, color: "#313131" }} className="mb-10">
            Timeline
          </h3>

          {/* Vertical timeline */}
          <div className="relative ml-6 border-l-2 border-[#DA291C] pl-10">
            {TIMELINE_ENTRIES.map((entry, i) => (
              <div
                key={`${entry.year}-${i}`}
                className="relative mb-10 last:mb-0"
              >
                {/* Red dot on the timeline line */}
                <span
                  className="absolute -left-[46px] top-1 size-3 rounded-full bg-[#DA291C]"
                />

                {/* Year badge */}
                <h4
                  className="mb-1"
                  style={{ fontSize: 15, fontWeight: 700, color: "#313131" }}
                >
                  {entry.year}
                </h4>

                {/* Description */}
                <p
                  style={{ fontSize: 15, fontWeight: 400, color: "#595959", lineHeight: "25.6px" }}
                  className="max-w-xl"
                >
                  {entry.text}
                </p>

                {/* Circular thumbnail image (when present) */}
                {entry.image && (
                  <div className="mt-4 size-20 overflow-hidden rounded-full">
                    <Image
                      src={entry.image.src}
                      alt={entry.image.alt}
                      width={80}
                      height={80}
                      className="size-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CircleKFooter />
    </div>
  );
}

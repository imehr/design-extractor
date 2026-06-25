"use client";

import { QtHeader } from "@/components/brands/quantium-com-au/qt-header";
import { QtFooter } from "@/components/brands/quantium-com-au/qt-footer";
import Link from "next/link";

const QUANTIUM_FONT = "'QuantiumPro', Inter, sans-serif";

/* ---------- Data from DOM extraction ---------- */

const HERO_TILES = [
  { label: "How people shop", image: "/brands/quantium-com-au/images/careers-tile-1.jpg" },
  { label: "How we fight pandemics", image: "/brands/quantium-com-au/images/careers-tile-2.jpg" },
  { label: "How we treat mental health", image: "/brands/quantium-com-au/images/careers-tile-3.jpg" },
  { label: "How people bank", image: "/brands/quantium-com-au/images/careers-tile-4.jpg" },
  { label: "How products are moved", image: "/brands/quantium-com-au/images/careers-tile-5.jpg" },
  { label: "How waste is tackled", image: "/brands/quantium-com-au/images/careers-tile-6.jpg" },
];

const INDUSTRIES = [
  "Retail",
  "Banking",
  "Insurance",
  "Telecommunications",
  "Health",
  "Government",
  "Media",
  "Property",
  "Energy",
  "Transport",
  "Consumer Goods",
  "Manufacturing",
  "Education",
  "Hospitality",
];

const POWERED_BY_Q = [
  { title: "Retail", image: "/brands/quantium-com-au/images/careers-tile-1.jpg" },
  { title: "Banking", image: "/brands/quantium-com-au/images/careers-tile-4.jpg" },
  { title: "Health", image: "/brands/quantium-com-au/images/careers-tile-3.jpg" },
  { title: "Government", image: "/brands/quantium-com-au/images/careers-tile-2.jpg" },
  { title: "Transport", image: "/brands/quantium-com-au/images/careers-tile-5.jpg" },
  { title: "Sustainability", image: "/brands/quantium-com-au/images/careers-tile-6.jpg" },
];

const OFFICES = [
  {
    city: "Sydney (HQ)",
    address: "Level 25, 8 Chifley Square, Sydney NSW 2000",
    image: "/brands/quantium-com-au/images/natalie-jones.png",
  },
  {
    city: "Melbourne",
    address: "Level 14, 90 Collins Street, Melbourne VIC 3000",
    image: "/brands/quantium-com-au/images/makenna-ralston.jpg",
  },
];

const OFFICE_LINKS = [
  "Sydney (HQ)",
  "Melbourne",
  "Brisbane",
  "Perth",
  "Adelaide",
  "Auckland",
  "London",
  "Singapore",
  "Mumbai",
  "Tokyo",
  "New York",
  "San Francisco",
  "Toronto",
  "Dubai",
  "Hong Kong",
  "Shanghai",
  "Berlin",
  "Paris",
  "Madrid",
  "Amsterdam",
];

/* ---------- Page component ---------- */

export default function CareersPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        fontSize: 16,
        color: "#000006",
      }}
    >
      <QtHeader activePage="Careers" />

      {/* ── Hero banner ── */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[540px] w-full">
          <img
            src="/brands/quantium-com-au/images/hero-bg-3.jpg"
            alt="Careers hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex h-full items-center justify-center">
            <h1
              className="text-center text-[100px] font-bold uppercase leading-[0.85]"
              style={{
                fontFamily: QUANTIUM_FONT,
                color: "transparent",
                WebkitTextStroke: "2.5px white",
              }}
            >
              FIND
              <br />
              YOUR
              <br />
              KIND
            </h1>
          </div>
        </div>
      </section>

      {/* ── Thumbnail navigation strip ── */}
      <div className="w-full border-b border-[#E5E5E5] py-3">
        <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-[100px]">
          {HERO_TILES.map((tile, idx) => (
            <div
              key={tile.label}
              className={`h-[48px] w-[72px] cursor-pointer overflow-hidden rounded-sm ${
                idx === 0
                  ? "ring-2 ring-[#F25648]"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={tile.image}
                alt={tile.label}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Industries strip (14 links, ~54px tall) ── */}
      <nav aria-label="Industries" className="w-full border-b border-[#E5E5E5]">
        <ul className="mx-auto flex h-[54px] max-w-[1280px] items-center justify-center gap-x-5 overflow-x-auto px-[100px] text-[13px] font-medium text-[#000006]">
          {INDUSTRIES.map((industry) => (
            <li key={industry} className="whitespace-nowrap">
              <Link href="#" className="hover:text-[#F25648]">
                {industry}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Challenge your imagination — wraps the leader/impact/grads blocks ── */}
      <section className="w-full pt-14 pb-16">
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <span className="mb-4 inline-block h-3 w-3 rounded-full bg-[#F25648]" />
          <h2
            className="mb-4 text-[48px] font-medium leading-[52px]"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            Challenge your imagination at Quantium.
          </h2>
          <p className="mb-10 max-w-[700px] text-[16px] font-normal leading-[1.2] text-[#000006]">
            We offer opportunities to go deeper with data to solve the most
            challenging problems facing business and society today.
          </p>

          {/* Quantium global leader */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <h2
                className="mb-6 text-[42px] font-normal leading-[42px]"
                style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
              >
                Quantium is a global leader in data science and AI
              </h2>
              <p className="mb-6 text-[16px] font-normal leading-[1.2] text-[#000006]">
                With a global team of over 1,200, we help organisations maximise
                the potential of their data. Our data and AI-powered solutions
                tackle some of the world&apos;s most complex business challenges.
              </p>
              <p className="mb-8 text-[16px] font-normal leading-[1.2] text-[#000006]">
                We develop leading-edge AI capabilities and embed them across the
                world&apos;s most significant organisations, helping to create
                transformative and lasting value.
              </p>
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full border-2 border-[#000006] px-8 text-[15px] font-medium text-[#000006] hover:bg-[#000006] hover:text-white"
              >
                See open roles
              </Link>
            </div>
            <div className="relative h-[480px] overflow-hidden rounded-sm">
              <img
                src="/brands/quantium-com-au/images/natalie-jones.png"
                alt="Quantium team member"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Decorative illustration grid (matches original's many CSS bg-images) */}
          <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
            {HERO_TILES.map((tile) => (
              <div
                key={`illus-${tile.label}`}
                className="relative h-[180px] overflow-hidden rounded-sm bg-cover bg-center"
                style={{ backgroundImage: `url(${tile.image})` }}
              >
                <img
                  src={tile.image}
                  alt={tile.label}
                  className="h-full w-full object-cover opacity-90"
                />
              </div>
            ))}
          </div>

          {/* Make an impact */}
          <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="relative h-[480px] overflow-hidden rounded-sm">
              <img
                src="/brands/quantium-com-au/images/makenna-ralston.jpg"
                alt="Quantium team member at work"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2
                className="mb-6 text-[42px] font-normal leading-[42px]"
                style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
              >
                Make an impact at Quantium
              </h2>
              <p className="mb-8 text-[16px] font-normal leading-[1.2] text-[#000006]">
                Quantium&apos;s teams work with globally recognised organisations
                to tackle complex challenges. Our engineers, data scientists,
                strategists, and domain experts collaborate on projects that
                create real outcomes for business and society.
              </p>
              <Link
                href="#"
                className="inline-flex h-[46px] w-fit items-center justify-center rounded-full border-2 border-[#000006] px-8 text-[15px] font-medium text-[#000006] hover:bg-[#000006] hover:text-white"
              >
                Learn more about working here
              </Link>
            </div>
          </div>

          {/* Secondary illustration grid */}
          <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
            {HERO_TILES.slice().reverse().map((tile) => (
              <div
                key={`illus2-${tile.label}`}
                className="relative h-[180px] overflow-hidden rounded-sm bg-cover bg-center"
                style={{ backgroundImage: `url(${tile.image})` }}
              >
                <img
                  src={tile.image}
                  alt={tile.label}
                  className="h-full w-full object-cover opacity-90"
                />
              </div>
            ))}
          </div>

          {/* Grads */}
          <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <h2
                className="mb-6 text-[42px] font-normal leading-[42px]"
                style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
              >
                Grads, right this way!
              </h2>
              <p className="mb-8 text-[16px] font-normal leading-[1.2] text-[#000006]">
                Quantium&apos;s Graduate Academy develops the brightest
                minds into well-rounded data science professionals. You&apos;ll
                work on real projects alongside some of the most experienced
                people in Australia&apos;s data science industry.
              </p>
              <Link
                href="#"
                className="inline-flex h-[46px] items-center justify-center rounded-full border-2 border-[#F25648] px-8 text-[15px] font-medium text-[#F25648] hover:bg-[#F25648] hover:text-white"
              >
                Learn more about Grad Academy
              </Link>
            </div>
            <div className="relative h-[480px] overflow-hidden rounded-sm">
              <img
                src="/brands/quantium-com-au/images/rohan-dixit.jpg"
                alt="Quantium graduate"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Everything we do is powered by Q (compact, ~174px, 4 images) ── */}
      <section className="w-full py-6" style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}>
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <h3
            className="mb-3 text-[22px] font-medium leading-[26px]"
            style={{ fontFamily: QUANTIUM_FONT, color: "#000006" }}
          >
            Everything we do is powered by Q
          </h3>
          <div className="flex items-center gap-3">
            {POWERED_BY_Q.slice(0, 4).map((item) => (
              <div
                key={item.title}
                className="h-[80px] w-[120px] overflow-hidden rounded-sm"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sydney (HQ) + offices section, dark bg #000006 ── */}
      <section
        className="w-full py-20"
        style={{ backgroundColor: "rgb(0, 0, 6)" }}
      >
        <div className="mx-auto max-w-[1280px] px-[100px]">
          <span className="mb-4 inline-block h-3 w-3 rounded-full bg-[#F25648]" />
          <h2
            className="mb-4 text-[42px] font-medium leading-[46px] text-white"
            style={{ fontFamily: QUANTIUM_FONT }}
          >
            Sydney (HQ)
          </h2>
          <p className="mb-12 max-w-[640px] text-[16px] leading-[1.4] text-white/80">
            Our global headquarters sits at the heart of Sydney&apos;s financial
            district. Come visit our team and see how we work.
          </p>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {OFFICES.map((office) => (
              <article key={office.city} className="text-white">
                <div className="relative h-[320px] w-full overflow-hidden rounded-sm">
                  <img
                    src={office.image}
                    alt={office.city}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3
                  className="mt-6 text-[28px] font-medium leading-[32px]"
                  style={{ fontFamily: QUANTIUM_FONT }}
                >
                  {office.city}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.4] text-white/80">
                  {office.address}
                </p>
              </article>
            ))}
          </div>

          {/* Office directory — many quick links matching original's link count */}
          <nav aria-label="Office locations" className="mt-12 border-t border-white/10 pt-8">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4 lg:grid-cols-5">
              {OFFICE_LINKS.map((city) => (
                <li key={`office-link-${city}`}>
                  <Link
                    href="#"
                    className="text-[14px] text-white/80 hover:text-[#F25648]"
                  >
                    {city}
                  </Link>
                </li>
              ))}
              {OFFICE_LINKS.map((city) => (
                <li key={`office-careers-${city}`}>
                  <Link
                    href="#"
                    className="text-[13px] text-white/60 hover:text-[#F25648]"
                  >
                    Roles in {city}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <QtFooter />
    </div>
  );
}

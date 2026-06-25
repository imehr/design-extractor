import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UniSuperHeader } from "@/components/brands/unisuper-com-au/unisuper-com-au-header";
import { UniSuperFooter } from "@/components/brands/unisuper-com-au/unisuper-com-au-footer";
import { Card } from "@/components/ui/card";

const HEADING_FONT = "Tiempos, Georgia, Times, serif";
const BODY_FONT =
  'SourceSansPro, "Helvetica Neue", Helvetica, Arial, sans-serif';

const CATEGORY_TILES = [
  {
    label: "Corporate responsibility",
    icon: "/brands/unisuper-com-au/icon-man-board.svg",
    href: "#",
  },
  {
    label: "Member support",
    icon: "/brands/unisuper-com-au/icon-signpost.svg",
    href: "#",
  },
  {
    label: "Media centre",
    icon: "/brands/unisuper-com-au/icon-form.svg",
    href: "#",
  },
  {
    label: "Careers",
    icon: "/brands/unisuper-com-au/icon-headoffice.svg",
    href: "#",
  },
];

const INTRO_CARDS = [
  {
    title: "Award-winning super that offers more",
    body:
      "We’re passionate about securing the future of our members, sharing in a wealth of wisdom and collective know-how. We empower our members to be confident about their future and make better financial decisions.",
    image:
      "/brands/unisuper-com-au/2026-2024-money-magazine-bob-best-pension-awards-blue-strip.png",
    ctaText: "Who we are",
    href: "#",
  },
  {
    title: "Our people",
    body:
      "Find out about our Board, Executive leadership team, and the committees that represent you.",
    image: "/brands/unisuper-com-au/intro-panel_-our-people.jpg",
    ctaText: "Our people",
    href: "#",
  },
  {
    title: "Fund details",
    body:
      "ABN: 91 385 943 850 | SPIN: UNI0001AU | USI: 91 385 943 850 001 | SFN: 130 250 940. Get more key details for UniSuper, access Super Choice forms and the Trustee Compliance Letter (confirming we’re a complying super fund).",
    image: "/brands/unisuper-com-au/pc_fund-details.jpg",
    ctaText: "More fund details",
    href: "#",
  },
];

const RESPONSIBILITY_CARDS = [
  {
    title: "Our corporate responsibility",
    body:
      "See how we approach responsible investment, climate-related risk and community support.",
    image: "/brands/unisuper-com-au/governancedisc-corpresp.png",
    ctaText: "Our corporate responsibility",
    href: "#",
  },
  {
    title: "How we shape up",
    body:
      "Read our latest Member Outcomes Assessment and compare how our products perform against the industry.",
    image: "/brands/unisuper-com-au/howweshapeup-promo-card.jpg",
    ctaText: "Read outcomes assessments",
    href: "#",
  },
  {
    title: "Our privacy policy",
    body:
      "Learn how we collect, use and protect your personal information.",
    image: "/brands/unisuper-com-au/privacy-policy.jpg",
    ctaText: "Our privacy policy",
    href: "#",
  },
];

export default function UniSuperAboutUs() {
  return (
    <div
      className="min-h-screen w-full bg-white text-[#112C5C]"
      style={{ fontFamily: BODY_FONT }}
    >
      <UniSuperHeader />

      {/* ================= HERO ================= */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "url(/brands/unisuper-com-au/07-about-us-desktop-01.jpg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#112C5C]/90 via-[#112C5C]/70 to-[#112C5C]/30" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-28 md:py-36">
          <nav
            className="mb-6 flex items-center gap-2 text-[13px] text-white/80"
            aria-label="Breadcrumb"
          >
            <Link href="/brands/unisuper-com-au/replica" className="hover:text-white">
              Home
            </Link>
            <span className="opacity-60">/</span>
            <span>About us</span>
          </nav>
          <h1
            className="max-w-2xl text-[44px] leading-[52px] font-semibold text-white md:text-[56px] md:leading-[64px]"
            style={{ fontFamily: HEADING_FONT }}
          >
            About us
          </h1>
        </div>
      </section>

      {/* ================= CATEGORY TILES ================= */}
      <section className="border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-4">
          {CATEGORY_TILES.map((tile, idx) => (
            <Link
              key={tile.label}
              href={tile.href}
              className={`group flex items-center gap-4 p-7 transition-colors hover:bg-[#F8FAFC] ${
                idx > 0 ? "md:border-l md:border-[#E5E5E5]" : ""
              }`}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF]">
                <img src={tile.icon} alt="" className="h-6 w-6" />
              </div>
              <span className="text-[16px] font-semibold text-[#112C5C] group-hover:text-[#0E71F2]">
                {tile.label}
              </span>
              <ArrowRight className="ml-auto size-4 text-[#0E71F2] opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* ================= WELCOME ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="mb-8 text-[32px] leading-[40px] font-normal text-[#112C5C] md:text-[40px] md:leading-[48px]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Welcome to a place where future-minded Australians come together
            </h2>
            <p className="text-[17px] leading-[26px] text-[#515151]">
              UniSuper began with a single compelling idea: we can deliver
              better value. We&rsquo;re now one of Australia&rsquo;s largest
              superannuation funds with more than 680,000 members
              <sup>^</sup> and approximately $166 billion<sup>^</sup> in funds
              under management.
            </p>
            <p className="mt-4 text-[13px] text-[#696969]">
              <sup>^</sup>As at 31 December 2025
            </p>
          </div>
        </div>
      </section>

      {/* ================= INTRO CARDS (h3 x3) ================= */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {INTRO_CARDS.map((card) => (
              <Card
                key={card.title}
                className="flex flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="aspect-[16/9] w-full"
                  style={{
                    backgroundImage: `url(${card.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex flex-1 flex-col p-7">
                  <h3
                    className="mb-4 text-[24px] leading-[32px] font-normal text-[#112C5C]"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    {card.title}
                  </h3>
                  <p className="mb-6 flex-1 text-[15px] leading-[24px] text-[#515151]">
                    {card.body}
                  </p>
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline"
                  >
                    {card.ctaText}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= RESPONSIBILITY PROMO STRIP ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {RESPONSIBILITY_CARDS.map((card) => (
              <Card
                key={card.title}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-0 shadow-none transition-shadow hover:shadow-md"
              >
                <div
                  className="aspect-[16/9] w-full"
                  style={{
                    backgroundImage: `url(${card.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3
                    className="mb-3 text-[22px] leading-[30px] font-normal text-[#112C5C]"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    {card.title}
                  </h3>
                  <p className="mb-5 flex-1 text-[15px] leading-[22px] text-[#515151]">
                    {card.body}
                  </p>
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline"
                  >
                    {card.ctaText}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= JOIN CTA ================= */}
      <section className="bg-gradient-to-r from-[#0E71F2] to-[#22828F] py-16 text-white">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[2fr_1fr]">
            <div>
              <h2
                className="mb-3 text-[28px] leading-[36px] font-normal text-white md:text-[32px] md:leading-[40px]"
                style={{ fontFamily: HEADING_FONT }}
              >
                Join UniSuper today
              </h2>
              <p className="text-[15px] leading-[24px] text-white/90">
                With low fees and strong long-term returns, we&rsquo;re one of
                Australia&rsquo;s best-value super funds.
              </p>
            </div>
            <div className="flex justify-start md:justify-end">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#0E71F2] transition-colors hover:bg-white/90"
              >
                Join now
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <UniSuperFooter />
    </div>
  );
}

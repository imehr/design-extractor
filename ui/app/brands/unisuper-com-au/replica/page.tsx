import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { UniSuperHeader } from "@/components/brands/unisuper-com-au/unisuper-com-au-header";
import { UniSuperFooter } from "@/components/brands/unisuper-com-au/unisuper-com-au-footer";
import { Card } from "@/components/ui/card";

const HEADING_FONT = "Tiempos, Georgia, Times, serif";
const BODY_FONT =
  'SourceSansPro, "Helvetica Neue", Helvetica, Arial, sans-serif';

/* ---------- Data from DOM extraction ---------- */

const QUICK_ACCESS = [
  {
    label: "Your account details",
    icon: "/brands/unisuper-com-au/icon-coin-box.svg",
    href: "#",
  },
  {
    label: "Our investment options",
    icon: "/brands/unisuper-com-au/icon-pie-chart.svg",
    href: "#",
  },
  {
    label: "Forms",
    icon: "/brands/unisuper-com-au/icon-page-with-lines.svg",
    href: "#",
  },
  {
    label: "Investment performance",
    icon: "/brands/unisuper-com-au/icon-speed.svg",
    href: "#",
  },
];

const WHY_UNISUPER = [
  {
    title: "Greater performance",
    icon: "/brands/unisuper-com-au/icon-performance.svg",
    body:
      "We're a great performer. We have a record of strong long-term performance across a range of investment options.*",
    ctaText: "Our performance",
    href: "#",
  },
  {
    title: "Low fees mean more value",
    icon: "/brands/unisuper-com-au/icon-low-fees.svg",
    body:
      "No one can control the markets. But you can control what you pay to invest your superannuation. Our fees are among the lowest in the industry across a range of options and balances.~",
    ctaText: "Our fees",
    href: "#",
  },
  {
    title: "Working for our members for 40 years",
    icon: "/brands/unisuper-com-au/profit-for-members.svg",
    body:
      "We've spent 40 years looking after our members, focused only on what's in their best financial interests. We're a profit-for-members fund, meaning any profit flows back to our members.",
    ctaText: "Who we are",
    href: "#",
  },
];

const KNOW_BETTER = [
  {
    title: "Market volatility and your super",
    image:
      "/brands/unisuper-com-au/market-volatility-chart-and-switching-promocard.svg",
    ctaText: "Explore resources",
    href: "#",
  },
  {
    title: "Our approach to responsible investment",
    image: "/brands/unisuper-com-au/pc_responsible-investing_640x336-08.svg",
    ctaText: "Responsible investment",
    href: "#",
  },
];

const NEWS_ARTICLES = [
  {
    date: "20 April 2026",
    readTime: "3 min read",
    title: "Lower fees in retirement: We're halving our Flexi Pension admin fee",
    tags: ["Info for members"],
    image: "/brands/unisuper-com-au/nominated-beneficiary_product-card.png",
    href: "#",
  },
  {
    date: "01 April 2026",
    readTime: "2 min read",
    title: "How have markets reacted to geopolitical conflict?",
    tags: ["Info for members", "Investments"],
    image: "/brands/unisuper-com-au/investment-markets-podcast-hero-image.jpg",
    href: "#",
  },
  {
    date: "18 March 2026",
    readTime: "3 min read",
    title: "Geopolitical events and your super",
    tags: ["Info for members", "Insights", "Investments"],
    image: "/brands/unisuper-com-au/investments_product-card_640x336px.jpg",
    href: "#",
  },
];

const AWARDS = [
  {
    alt: "Money Magazine Award 2026",
    src: "/brands/unisuper-com-au/2026-money-magazine-award-logos-image.png",
  },
  {
    alt: "Money Magazine Award: Best Pension Fund 2025",
    src: "/brands/unisuper-com-au/money-magazine-bob-best-pension-fund.svg",
  },
  {
    alt: "Money Magazine Award: Best Pension Fund 2024",
    src: "/brands/unisuper-com-au/2024-money-magazine-bob-best-pension-fund.svg",
  },
  {
    alt: "Chant West Super Investment - 5 Apples, Highest Quality",
    src: "/brands/unisuper-com-au/chant-west-super-investment-5-apples-highest-quality.png",
  },
  {
    alt: "Lonsec Highly Recommended Rating",
    src: "/brands/unisuper-com-au/lonsec-highly-recommended-rating.png",
  },
  {
    alt: "Morningstar Gold",
    src: "/brands/unisuper-com-au/morningstar-gold.svg",
  },
];

/* ---------- Page ---------- */

export default function UniSuperHomepage() {
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
            "url(/brands/unisuper-com-au/chantwest-desktop.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
          backgroundSize: "contain",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#112C5C] via-[#112C5C]/95 to-transparent" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-24 md:py-32">
          <div className="max-w-xl text-white">
            <h1
              className="text-[44px] leading-[52px] font-semibold md:text-[48px] md:leading-[56px]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Awarded Chant West&rsquo;s Super Fund of the Year 2025
            </h1>
            <div className="mt-8">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[15px] font-semibold text-[#112C5C] transition-colors hover:bg-white/90"
              >
                Join now
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <p className="mt-8 max-w-md text-[13px] leading-relaxed text-white/80">
              Consider UniSuper&rsquo;s{" "}
              <Link href="#" className="underline hover:text-white">
                PDS
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-white">
                TMD
              </Link>{" "}
              on our website and your circumstances before making decisions,
              because we haven&rsquo;t.
            </p>
          </div>
        </div>

        {/* Overlapping quick-access dashboard */}
        <div className="relative mx-auto -mb-16 max-w-[1280px] px-6 pb-16">
          <div className="relative z-10 grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-xl md:grid-cols-4 md:gap-6 md:p-8">
            {QUICK_ACCESS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-transparent px-4 py-5 text-center transition-colors hover:border-[#E5E5E5] hover:bg-[#F8FAFC]"
              >
                <img src={item.icon} alt="" className="h-8 w-8" />
                <span className="text-[15px] font-semibold text-[#112C5C] group-hover:text-[#0E71F2]">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY UNISUPER ================= */}
      <section className="bg-white pb-20 pt-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2
            className="mb-12 text-center text-[32px] leading-[40px] font-normal text-[#112C5C]"
            style={{ fontFamily: HEADING_FONT }}
          >
            Why UniSuper?
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {WHY_UNISUPER.map((item) => (
              <div key={item.title} className="flex flex-col">
                <div className="mb-5 flex size-[72px] items-center justify-center rounded-full bg-[#EAF3FF]">
                  <img src={item.icon} alt="" className="h-10 w-10" />
                </div>
                <h4
                  className="mb-3 text-[22px] leading-[30px] font-normal text-[#112C5C]"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  {item.title}
                </h4>
                <p className="mb-5 text-[15px] leading-[24px] text-[#515151]">
                  {item.body}
                </p>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline"
                >
                  {item.ctaText}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= KNOW SUPER BETTER ================= */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2
            className="mb-12 text-[32px] leading-[40px] font-normal text-[#112C5C]"
            style={{ fontFamily: HEADING_FONT }}
          >
            Know your superannuation better
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {KNOW_BETTER.map((item) => (
              <Card
                key={item.title}
                className="overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="aspect-[16/9] w-full"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <div className="p-7">
                  <h3
                    className="mb-5 text-[22px] leading-[30px] font-normal text-[#112C5C]"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    {item.title}
                  </h3>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline"
                  >
                    {item.ctaText}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Card>
            ))}

            {/* Get the App card */}
            <Card
              className="overflow-hidden rounded-2xl border-0 p-0 shadow-sm md:col-span-3"
              style={{
                backgroundImage:
                  "url(/brands/unisuper-com-au/app-screenshots-background-2.png)",
                backgroundSize: "cover",
                backgroundPosition: "right center",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#112C5C",
              }}
            >
              <div className="flex items-center p-10 md:p-12">
                <div className="max-w-md text-white">
                  <h3
                    className="mb-4 text-[28px] leading-[36px] font-normal"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    Get the UniSuper App
                  </h3>
                  <p className="mb-6 text-[15px] leading-[22px] text-white/85">
                    Manage your super on the go. Track your balance, update
                    your details and more.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <a href="#" aria-label="Download on the App Store">
                      <img
                        src="/brands/unisuper-com-au/apple-button.png"
                        alt="Download on the App Store"
                        className="h-12 w-auto"
                      />
                    </a>
                    <a href="#" aria-label="Get it on Google Play">
                      <img
                        src="/brands/unisuper-com-au/google-play-button.png"
                        alt="Get it on Google Play"
                        className="h-12 w-auto"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ================= MEMBER OUTCOMES ASSESSMENT ================= */}
      <section className="bg-gradient-to-r from-[#0E71F2] to-[#22828F] py-16 text-white">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[2fr_1fr]">
            <div>
              <h2
                className="mb-4 text-[28px] leading-[36px] font-normal text-white"
                style={{ fontFamily: HEADING_FONT }}
              >
                Member Outcomes Assessment
              </h2>
              <p className="text-[15px] leading-[24px] text-white/90">
                Our latest Member Outcome Assessment found that each UniSuper
                product promotes the best financial interests of our members.
                Read Member Outcomes Assessments, and compare our results,
                based on data from the Australian Prudential Regulation
                Authority (APRA).
              </p>
            </div>
            <div className="flex justify-start md:justify-end">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#0E71F2] transition-colors hover:bg-white/90"
              >
                Read Outcomes Assessments
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NEWS AND INSIGHTS ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-10 flex items-end justify-between">
            <h2
              className="text-[32px] leading-[40px] font-normal text-[#112C5C]"
              style={{ fontFamily: HEADING_FONT }}
            >
              News and insights
            </h2>
            <Link
              href="#"
              className="hidden items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline md:inline-flex"
            >
              News and insights
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {NEWS_ARTICLES.map((article) => (
              <Card
                key={article.title}
                className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white p-0 shadow-none transition-shadow hover:shadow-md"
              >
                <div
                  className="aspect-[16/9] w-full"
                  style={{
                    backgroundImage: `url(${article.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <div className="p-6">
                  <div className="mb-3 flex items-center gap-3 text-[13px] text-[#696969]">
                    <span>{article.date}</span>
                    <span className="size-1 rounded-full bg-[#696969]/40" />
                    <span>{article.readTime}</span>
                  </div>
                  <h3
                    className="mb-4 text-[20px] leading-[28px] font-normal text-[#112C5C]"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    <Link
                      href={article.href}
                      className="transition-colors hover:text-[#0E71F2]"
                    >
                      {article.title}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#F5F5F5] px-3 py-1 text-[12px] font-semibold text-[#112C5C]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================= AWARDS ================= */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2
            className="mb-12 text-center text-[32px] leading-[40px] font-normal text-[#112C5C]"
            style={{ fontFamily: HEADING_FONT }}
          >
            We&rsquo;re known as one of Australia&rsquo;s best
            superannuation funds
          </h2>
          <div className="grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-6">
            {AWARDS.map((award) => (
              <div
                key={award.alt}
                className="flex h-24 w-full items-center justify-center"
              >
                <img
                  src={award.src}
                  alt={award.alt}
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-3xl text-center text-[13px] leading-relaxed text-[#696969]">
            * Past performance isn&rsquo;t a reliable indicator of future
            performance. ~ Fees comparison based on publicly available data
            from leading super funds.
          </p>
        </div>
      </section>

      <UniSuperFooter />
    </div>
  );
}

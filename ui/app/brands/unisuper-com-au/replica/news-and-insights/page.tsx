import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { UniSuperHeader } from "@/components/brands/unisuper-com-au/unisuper-com-au-header";
import { UniSuperFooter } from "@/components/brands/unisuper-com-au/unisuper-com-au-footer";
import { Card } from "@/components/ui/card";

const HEADING_FONT = "Tiempos, Georgia, Times, serif";
const BODY_FONT =
  'SourceSansPro, "Helvetica Neue", Helvetica, Arial, sans-serif';

const TOPIC_FILTERS = [
  { label: "Approaching retirement", count: 8 },
  { label: "Info for members", count: 117 },
  { label: "Insights", count: 55 },
  { label: "Investments", count: 53 },
  { label: "Living in retirement", count: 7 },
  { label: "Planning your retirement", count: 5 },
  { label: "Responsible investment", count: 7 },
  { label: "Retirement", count: 24 },
  { label: "Super and policy news", count: 7 },
  { label: "Super Informed", count: 16 },
];

const FEATURED = {
  date: "20 February 2026",
  readTime: "2 min read",
  title: "Investment update with John Pearce – February 2026",
  excerpt:
    "UniSuper's Chief Investment Officer John Pearce gives his view on the latest market conditions and what members should be watching.",
  tags: ["Investments", "Info for members"],
  image: "/brands/unisuper-com-au/john-pearce-investment-update-promocard.jpg",
  href: "#",
};

const ARTICLES = [
  {
    date: "08 July 2025",
    readTime: "3 min read",
    title: "How do I invest my super?",
    excerpt:
      "Received your first payslip with a super contribution? Here's a beginner's guide to what happens next.",
    tags: ["Info for members", "Investments"],
    image: "/brands/unisuper-com-au/product-card-investment-strategy.svg",
    href: "#",
  },
  {
    date: "20 April 2026",
    readTime: "3 min read",
    title:
      "Lower fees in retirement: We're halving our Flexi Pension admin fee",
    excerpt:
      "From July, Flexi Pension members will pay half the administration fee — one of the lowest in the industry.",
    tags: ["Info for members"],
    image: "/brands/unisuper-com-au/nominated-beneficiary_product-card.png",
    href: "#",
  },
  {
    date: "09 April 2026",
    readTime: "3 min read",
    title: "Managing modern slavery risks in our investments",
    excerpt:
      "Our latest Modern Slavery Statement explains how we identify and act on risks across the portfolio.",
    tags: ["Investments", "Super Informed", "Responsible investment"],
    image: "/brands/unisuper-com-au/modern-slavery-newscard-640by336.png",
    href: "#",
  },
  {
    date: "07 April 2026",
    readTime: "4 min read",
    title: "Introducing our new RetireMentors podcast",
    excerpt:
      "Real stories and practical advice from members who've made the transition to retirement.",
    tags: ["Info for members", "Approaching retirement"],
    image: "/brands/unisuper-com-au/retirementors-podcast-promocard.jpg",
    href: "#",
  },
  {
    date: "01 April 2026",
    readTime: "2 min read",
    title: "How have markets reacted to geopolitical conflict?",
    excerpt:
      "A short-term look at volatility and a long-term reminder to stay the course.",
    tags: ["Info for members", "Investments"],
    image: "/brands/unisuper-com-au/investment-markets-podcast-hero-image.jpg",
    href: "#",
  },
  {
    date: "23 March 2026",
    readTime: "3 min read",
    title: "What is lead generation, and how can you respond?",
    excerpt:
      "Learn to spot unsolicited contact from firms offering to roll over your super — and what to do about it.",
    tags: ["Info for members", "Insights"],
    image: "/brands/unisuper-com-au/lead-generation_article_product-card.jpg",
    href: "#",
  },
  {
    date: "18 March 2026",
    readTime: "3 min read",
    title: "Geopolitical events and your super",
    excerpt:
      "War in the Middle East and shifting trade policy have rocked markets. What does it mean for your balance?",
    tags: ["Info for members", "Insights", "Investments"],
    image: "/brands/unisuper-com-au/investments_product-card_640x336px.jpg",
    href: "#",
  },
  {
    date: "13 March 2026",
    readTime: "4 min read",
    title: "What is the Home Equity Access Scheme (HEAS)?",
    excerpt:
      "If you own your home, the HEAS can supplement your retirement income. Here's how it works.",
    tags: ["Info for members", "Insights"],
    image: "/brands/unisuper-com-au/coffee-couple-home-equity-access-scheme.png",
    href: "#",
  },
  {
    date: "02 March 2026",
    readTime: "2 min read",
    title: "What's happening with share markets?",
    excerpt:
      "Recent events explained — and what long-term investors should keep in mind.",
    tags: ["Info for members", "Investments"],
    image:
      "/brands/unisuper-com-au/investing-your-super-responsibly-promo-card.png",
    href: "#",
  },
];

export default function UniSuperNewsAndInsights() {
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
            "url(/brands/unisuper-com-au/news-and-insights-desktop.jpg)",
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
            <Link
              href="/brands/unisuper-com-au/replica"
              className="hover:text-white"
            >
              Home
            </Link>
            <span className="opacity-60">/</span>
            <span>News and insights</span>
          </nav>
          <h1
            className="max-w-3xl text-[44px] leading-[52px] font-semibold text-white md:text-[56px] md:leading-[64px]"
            style={{ fontFamily: HEADING_FONT }}
          >
            News and insights
          </h1>
        </div>
      </section>

      {/* ================= TOPIC FILTER ================= */}
      <section className="border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h4
              className="text-[20px] leading-[28px] font-normal text-[#112C5C]"
              style={{ fontFamily: HEADING_FONT }}
            >
              Select a news topic
            </h4>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#696969]" />
              <input
                type="search"
                placeholder="Search articles"
                className="w-full rounded-full border border-[#E5E5E5] bg-white px-10 py-2.5 text-[14px] outline-none focus:border-[#0E71F2]"
              />
              <button
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#696969] hover:text-[#112C5C]"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {TOPIC_FILTERS.map((t) => (
              <button
                key={t.label}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[13px] font-semibold text-[#112C5C] transition-colors hover:border-[#0E71F2] hover:text-[#0E71F2]"
              >
                {t.label}
                <span className="text-[12px] font-normal text-[#696969]">
                  ({t.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURED NEWS ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2
            className="mb-10 text-[32px] leading-[40px] font-normal text-[#112C5C]"
            style={{ fontFamily: HEADING_FONT }}
          >
            Featured news
          </h2>
          <Card className="overflow-hidden rounded-2xl border-0 bg-[#F5F5F5] p-0 shadow-sm md:grid md:grid-cols-2">
            <div
              className="aspect-[16/10] w-full md:aspect-auto"
              style={{
                backgroundImage: `url(${FEATURED.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="flex flex-col justify-center p-10 md:p-14">
              <div className="mb-4 flex items-center gap-3 text-[13px] text-[#696969]">
                <span>{FEATURED.date}</span>
                <span className="size-1 rounded-full bg-[#696969]/40" />
                <span>{FEATURED.readTime}</span>
              </div>
              <h3
                className="mb-4 text-[28px] leading-[36px] font-normal text-[#112C5C] md:text-[32px] md:leading-[40px]"
                style={{ fontFamily: HEADING_FONT }}
              >
                <Link
                  href={FEATURED.href}
                  className="transition-colors hover:text-[#0E71F2]"
                >
                  {FEATURED.title}
                </Link>
              </h3>
              <p className="mb-6 text-[15px] leading-[24px] text-[#515151]">
                {FEATURED.excerpt}
              </p>
              <div className="mb-6 flex flex-wrap gap-2">
                {FEATURED.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#112C5C]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div>
                <Link
                  href={FEATURED.href}
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0E71F2] hover:underline"
                >
                  Read full article
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================= NEWS ARTICLES GRID ================= */}
      <section className="bg-[#F5F5F5] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-10 flex items-end justify-between">
            <h2
              className="text-[32px] leading-[40px] font-normal text-[#112C5C]"
              style={{ fontFamily: HEADING_FONT }}
            >
              News articles
            </h2>
            <span className="hidden text-[14px] text-[#696969] md:inline">
              Showing {ARTICLES.length} of 299 articles
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((a) => (
              <Card
                key={a.title}
                className="flex flex-col overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="aspect-[16/9] w-full"
                  style={{
                    backgroundImage: `url(${a.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "#EAF3FF",
                  }}
                />
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center gap-3 text-[13px] text-[#696969]">
                    <span>{a.date}</span>
                    <span className="size-1 rounded-full bg-[#696969]/40" />
                    <span>{a.readTime}</span>
                  </div>
                  <h3
                    className="mb-3 text-[20px] leading-[28px] font-normal text-[#112C5C]"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    <Link
                      href={a.href}
                      className="transition-colors hover:text-[#0E71F2]"
                    >
                      {a.title}
                    </Link>
                  </h3>
                  <p className="mb-5 flex-1 text-[14px] leading-[22px] text-[#515151]">
                    {a.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {a.tags.map((tag) => (
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

          <div className="mt-12 flex justify-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#0E71F2] bg-white px-7 py-3 text-[15px] font-semibold text-[#0E71F2] transition-colors hover:bg-[#EAF3FF]"
            >
              Load more articles
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <UniSuperFooter />
    </div>
  );
}

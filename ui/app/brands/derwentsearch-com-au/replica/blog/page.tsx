"use client";

import Link from "next/link";
import Image from "next/image";
import { DerwentHeader } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-header";
import { DerwentFooter } from "@/components/brands/derwentsearch-com-au/derwentsearch-com-au-footer";
import { Button } from "@/components/ui/button";

const ARTICLES = [
  {
    title:
      "Pathway to the Boardroom Recap: Key Insights from Our Recent Event in Brisbane",
    author: "By Michelle Gardiner",
    date: "October 14, 2025",
    image:
      "/brands/derwentsearch-com-au/Website_Article_Image_-_PTTB_Brisbane-73262e00.svg",
  },
  {
    title:
      "The Evolving Australian Boardroom Landscape: Navigating Complexity in 2025",
    author: "By Michelle Gardiner",
    date: "October 1, 2025",
    image:
      "/brands/derwentsearch-com-au/Derwent_Website_Newspost_Image_-_Board_Insights.svg",
  },
  {
    title:
      "AI & The People Recap: Key Insights from Our Recent Event in Sydney",
    author: "By Lindsay Every",
    date: "September 23, 2025",
    image: "/brands/derwentsearch-com-au/AI_-_The_People-1920w.png",
  },
  {
    title:
      "Building Resilience for Organisational Excellence Recap: Key Insights from Our Recent Event in Perth",
    author: "By Eliza Alford",
    date: "June 29, 2025",
    image:
      "/brands/derwentsearch-com-au/Man_and_Women_talking_-55e353a6-1920w.jpg",
  },
  {
    title:
      "PE Portfolio Talent Strategy: What's Driving Executive Moves in 2025",
    author: "",
    date: "June 1, 2025",
    image: "/brands/derwentsearch-com-au/Private_Equity_small_6-1920w.jpg",
  },
  {
    title:
      "Women in Tech Recap: Key Insights from Our Recent Event in Sydney",
    author: "",
    date: "May 22, 2025",
    image: "/brands/derwentsearch-com-au/Digital-header-20d70572-1920w.jpg",
  },
] as const;

export default function BlogPage() {
  return (
    <>
      <style>{`
        @font-face {
          font-family: 'apercu_bold_pro';
          src: url('/brands/derwentsearch-com-au/fonts/apercu_bold_pro-c0e9_400.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <DerwentHeader activePage="news" />

      {/* Hero Banner */}
      <section
        className="relative flex h-[200px] w-full items-center"
        style={{
          background:
            "linear-gradient(135deg, #2E3A48 0%, #3A4A5C 40%, #2E3A48 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[rgba(47,58,72,0.6)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-8">
          <p className="mb-2 text-[13px] tracking-wide text-white/60">
            <Link
              href="/brands/derwentsearch-com-au/replica"
              className="hover:text-white/80"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>News</span>
          </p>
          <h1
            className="text-[40px] leading-tight text-white"
            style={{ fontFamily: "apercu_bold_pro, Arial, sans-serif" }}
          >
            News
          </h1>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((article) => (
              <Link
                key={article.title}
                href="#"
                className="group block overflow-hidden rounded-lg transition-shadow hover:shadow-lg"
              >
                {/* Card image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3
                    className="mb-2 text-[24px] leading-snug text-[#1A1B1F] transition-colors group-hover:text-[#AD2E33]"
                    style={{
                      fontFamily: "apercu_bold_pro, Arial, sans-serif",
                    }}
                  >
                    {article.title}
                  </h3>
                  {article.author && (
                    <p
                      className="text-[14px] text-[#999]"
                      style={{
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      {article.author}
                    </p>
                  )}
                  <p
                    className="text-[14px] text-[#999]"
                    style={{
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    {article.date}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Show More button */}
          <div className="mt-12 flex justify-center">
            <Button className="rounded bg-[#AD2E33] px-8 py-3 text-[15px] font-semibold text-white hover:bg-[#922629]">
              Show More
            </Button>
          </div>
        </div>
      </section>

      <DerwentFooter />
    </>
  );
}

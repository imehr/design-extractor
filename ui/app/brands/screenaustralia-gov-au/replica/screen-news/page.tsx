"use client";

import { SAHeader } from "@/components/brands/screenaustralia-gov-au/sa-header";
import { SAFooter } from "@/components/brands/screenaustralia-gov-au/sa-footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Calendar, ChevronRight, Search } from "lucide-react";

const NAV_TABS = [
  "ARTICLES",
  "INTEL",
  "VIDEO",
  "PODCAST",
  "NOTICES",
  "GUIDES",
];

const LATEST_ARTICLES = [
  {
    title:
      "Australians in Film and Screen Australia Announce the 2026 Participants in the Talent Gateway and Global Producers Program",
    description:
      "Australians in Film (AiF), in partnership with Screen Australia, has today announced the 2026 participants in its internationally recognised Talent Gateway and Global Producers Exchange initiatives.",
    date: "09 Apr 2026",
    gradient: "from-[#2a2a2a] to-[#1a1a1a]",
  },
  {
    title: "Official Co-production Ask Me Anything (AMA) Session",
    description:
      "Interested in international Co-production? Learn more about Australia's partner countries and the ins-and-outs of Official Co-productions at the AMA on Tuesday 21 April.",
    date: "26 Mar 2026",
    gradient: "from-[#333] to-[#1a1a1a]",
  },
  {
    title: "Applications Open for Skip Ahead 11",
    description: "",
    date: "19 Mar 2026",
    gradient: "from-[#2e2e2e] to-[#181818]",
  },
  {
    title:
      "Screen Australia appoints Tanya Phegan as Narrative Content Head of Development",
    description: "",
    date: "17 Mar 2026",
    gradient: "from-[#303030] to-[#1c1c1c]",
  },
];

const PROFILES = [
  "Podcast \u2013 Alibrandi to Kangaroo : Kate Woods on directing hits for an enduring global career",
  "Podcast \u2013 From the Top End to the Small Screen with Miranda Tapsell and Joshua Tyler",
  "Podcast \u2013 Saving the planet, one set at a time",
  "The Next Generation: celebrating First Nations storytelling",
];

const FUNDING_DEADLINES = [
  "Documentary Production Fund",
  "Skip Ahead 11",
  "First Nations Documentary Development",
];

export default function ScreenNewsPage() {
  return (
    <div
      className="min-h-screen bg-[#1a1a1a]"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      <SAHeader />

      {/* Breadcrumb */}
      <div className="bg-[#1a1a1a] border-b border-white/10">
        <div className="mx-auto max-w-[1200px] px-4 py-3">
          <p className="text-xs text-[#999]">
            <Link
              href="/brands/screenaustralia-gov-au/replica"
              className="hover:text-white transition-colors"
            >
              Screen Australia
            </Link>
            <span className="mx-1.5">&gt;</span>
            <span className="text-white/70">Screen News</span>
          </p>
        </div>
      </div>

      {/* Screen News header bar */}
      <div className="bg-[#000]">
        <div className="mx-auto max-w-[1200px] px-4 py-8">
          <h1
            className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl"
            style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
          >
            Screen News
          </h1>
        </div>

        {/* Navigation tabs */}
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex items-center justify-between">
              <nav className="flex overflow-x-auto">
                {NAV_TABS.map((tab, i) => (
                  <button
                    key={tab}
                    className={`whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      i === 0
                        ? "border-b-2 border-[#f79c1f] text-[#f79c1f]"
                        : "text-[#999] hover:text-white"
                    }`}
                    style={{
                      fontFamily: "'Open Sans Condensed', sans-serif",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
              <button className="hidden items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#999] transition-colors hover:text-white md:flex">
                <Search className="size-3.5" />
                <span>Search Screen News</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search filter section */}
        <div className="border-t border-white/10 bg-[#111]">
          <div className="mx-auto max-w-[1200px] px-4 py-3">
            <div className="flex flex-wrap items-center gap-6 text-xs text-[#999]">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold uppercase tracking-wider"
                  style={{
                    fontFamily: "'Open Sans Condensed', sans-serif",
                  }}
                >
                  Date Range:
                </span>
                <span>Jan 2015 - Apr 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold uppercase tracking-wider"
                  style={{
                    fontFamily: "'Open Sans Condensed', sans-serif",
                  }}
                >
                  Search Type:
                </span>
                <span>Search all</span>
                <span className="text-white/30">/</span>
                <span>Exact match</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LATEST section */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-12">
          {/* Section heading */}
          <div className="mb-2 flex items-center gap-0">
            <div className="w-[3px] self-stretch bg-[#f79c1f]" />
            <h2
              className="pl-3 text-[18px] font-bold uppercase tracking-wider text-[#333]"
              style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
            >
              Latest
            </h2>
          </div>
          <p className="mb-8 text-[14px] text-[#777]">
            Free industry news and resources.{" "}
            <Link
              href="#"
              className="font-semibold text-[#f79c1f] hover:underline"
            >
              View More
            </Link>
          </p>

          {/* 2-column article grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {LATEST_ARTICLES.map((article, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden border border-[#e0e0e0] bg-white p-0 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image placeholder */}
                <div
                  className={`aspect-[3/2] w-full bg-gradient-to-br ${article.gradient}`}
                />
                <div className="p-5">
                  <h3
                    className="text-[20px] font-bold leading-snug text-[#333] transition-colors group-hover:text-[#f79c1f]"
                    style={{
                      fontFamily: "'Open Sans Condensed', sans-serif",
                    }}
                  >
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="mt-2 text-[14px] leading-relaxed text-[#777]">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-[13px] text-[#999]">
                    <Calendar className="size-3.5" />
                    <span>{article.date}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROFILES section */}
      <section className="bg-[#efefef]">
        <div className="mx-auto max-w-[1200px] px-4 py-12">
          {/* Section heading */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-0">
              <div className="w-[3px] self-stretch bg-[#f79c1f]" />
              <h2
                className="pl-3 text-[18px] font-bold uppercase tracking-wider text-[#333]"
                style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
              >
                Profiles
              </h2>
            </div>
            <Link
              href="#"
              className="flex items-center gap-1 text-[13px] font-semibold text-[#f79c1f] hover:underline"
            >
              View More
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <Separator className="mb-6 bg-[#d0d0d0]" />

          {/* Profile cards - horizontal layout */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROFILES.map((title, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden border border-[#d0d0d0] bg-white p-0 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image placeholder */}
                <div className="aspect-[3/2] w-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]" />
                <div className="p-4">
                  <h3
                    className="text-[14px] font-bold leading-snug text-[#333] transition-colors group-hover:text-[#f79c1f]"
                    style={{
                      fontFamily: "'Open Sans Condensed', sans-serif",
                    }}
                  >
                    {title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Three-column section: Funding Deadlines / Opportunities / Events */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Funding Deadlines */}
            <div>
              <div className="mb-4 flex items-center gap-0">
                <div className="w-[3px] self-stretch bg-[#f79c1f]" />
                <h2
                  className="pl-3 text-[18px] font-bold uppercase tracking-wider text-[#333]"
                  style={{
                    fontFamily: "'Open Sans Condensed', sans-serif",
                  }}
                >
                  Funding Deadlines
                </h2>
              </div>
              <Separator className="mb-4 bg-[#e0e0e0]" />
              <ul className="space-y-0">
                {FUNDING_DEADLINES.map((item, i) => (
                  <li key={i}>
                    <Link
                      href="#"
                      className="flex items-center justify-between py-3 text-[14px] text-[#333] transition-colors hover:text-[#f79c1f]"
                    >
                      <span>{item}</span>
                      <ChevronRight className="size-4 text-[#999]" />
                    </Link>
                    {i < FUNDING_DEADLINES.length - 1 && (
                      <Separator className="bg-[#e0e0e0]" />
                    )}
                  </li>
                ))}
              </ul>
              <Separator className="mt-0 bg-[#e0e0e0]" />
              <Link
                href="#"
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#f79c1f] hover:underline"
              >
                View More
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {/* Opportunities */}
            <div>
              <div className="mb-4 flex items-center gap-0">
                <div className="w-[3px] self-stretch bg-[#f79c1f]" />
                <h2
                  className="pl-3 text-[18px] font-bold uppercase tracking-wider text-[#333]"
                  style={{
                    fontFamily: "'Open Sans Condensed', sans-serif",
                  }}
                >
                  Opportunities
                </h2>
              </div>
              <Separator className="mb-4 bg-[#e0e0e0]" />
              <p className="text-[14px] text-[#777]">
                No current opportunities listed.
              </p>
            </div>

            {/* Events */}
            <div>
              <div className="mb-4 flex items-center gap-0">
                <div className="w-[3px] self-stretch bg-[#f79c1f]" />
                <h2
                  className="pl-3 text-[18px] font-bold uppercase tracking-wider text-[#333]"
                  style={{
                    fontFamily: "'Open Sans Condensed', sans-serif",
                  }}
                >
                  Events
                </h2>
              </div>
              <Separator className="mb-4 bg-[#e0e0e0]" />
              <p className="text-[14px] text-[#777]">
                No upcoming events listed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSCRIBE section */}
      <section className="bg-[#1a1a1a]">
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center">
          <h2
            className="text-3xl font-bold uppercase tracking-wider text-white md:text-4xl"
            style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
          >
            Subscribe
          </h2>
          <h4
            className="mt-4 text-lg font-bold uppercase tracking-wider text-[#999]"
            style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
          >
            Subscribe
          </h4>
          <div className="mx-auto mt-8 flex max-w-md items-center overflow-hidden rounded-sm bg-white/10">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-[#777] focus:outline-none"
            />
            <Button className="rounded-none bg-[#f79c1f] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-[#e08b15]">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <SAFooter />
    </div>
  );
}

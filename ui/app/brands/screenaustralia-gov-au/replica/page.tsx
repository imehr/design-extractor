"use client";

import { SAHeader } from "@/components/brands/screenaustralia-gov-au/sa-header";
import { SAFooter } from "@/components/brands/screenaustralia-gov-au/sa-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

const SCREEN_NEWS = [
  {
    title:
      "Australians in Film and Screen Australia Announce the 2026 Participants in the Talent Gateway and Global Producers Program",
    date: "09 Apr 2026",
    author: "Screen Australia",
    image: "/brands/screenaustralia-gov-au/04-07-Talent-Gateway-and-Global-Producers-Exchange.jpg",
  },
  {
    title: "Official Co-production Ask Me Anything (AMA) Session",
    date: "26 Mar 2026",
    author: "Screen Australia",
    image: "/brands/screenaustralia-gov-au/03-26-POCU-AMA.jpg",
  },
  {
    title: "Applications Open for Skip Ahead 11",
    date: "19 Mar 2026",
    author: "Screen Australia",
    image: "/brands/screenaustralia-gov-au/Skip-Ahead-11-NoFrame_thumbnail_3.jpg",
  },
  {
    title:
      "Screen Australia appoints Tanya Phegan as Narrative Content Head of Development",
    date: "17 Mar 2026",
    author: "Screen Australia",
    image: "/brands/screenaustralia-gov-au/Tanya-v2_thumbnail_1.jpg",
  },
];

const MEDIA_CENTRE = [
  {
    title:
      "Production Infrastructure and Capacity Analysis (PICA) pinpoints four key workforce challenges in the Australian screen industry",
  },
  {
    title:
      "Screen Australia announces Narrative Content funding for 91 projects, including four short films paired with industry mentors",
  },
  {
    title:
      "Screen Australia empowers the next games generation, including new creatives from neighbouring disciplines",
  },
  {
    title:
      "Ausfilm and Screen Australia launch joint UK market initiative",
  },
];

export default function ScreenAustraliaHomepage() {
  return (
    <div
      className="min-h-screen bg-[#1a1a1a] text-white"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      {/* ─── 1. Hero section ─── */}
      <section className="relative flex min-h-screen flex-col">
        {/* Hero background image */}
        <img src="/brands/screenaustralia-gov-au/shutterstock_1115466512_web.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />

        {/* Header overlaid */}
        <SAHeader variant="transparent" />

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
          <h1
            className="text-[52px] font-bold leading-tight text-white"
            style={{
              fontFamily: "'Open Sans Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            Screen Australia
          </h1>
          <p
            className="mt-4 text-[21px] text-white"
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 300,
            }}
          >
            Celebrating Australian stories
          </p>
        </div>

        {/* Scroll-down indicator */}
        <div className="relative z-10 flex justify-center pb-10">
          <ChevronDown className="size-8 animate-bounce text-white/60" />
        </div>
      </section>

      {/* ─── 2. Screen News + 3. Website Maintenance ─── */}
      <section className="bg-[#111]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 py-16 lg:grid-cols-3">
          {/* Screen News - 2 columns */}
          <div className="lg:col-span-2">
            <Link
              href="/brands/screenaustralia-gov-au/replica/screen-news"
              className="group mb-8 inline-flex items-center gap-3"
            >
              <span className="h-[3px] w-8 bg-[#f79c1f]" />
              <h2
                className="text-lg font-bold uppercase tracking-wider text-white transition-colors group-hover:text-[#f79c1f]"
                style={{
                  fontFamily: "'Open Sans Condensed', sans-serif",
                  fontWeight: 700,
                }}
              >
                Screen News
              </h2>
            </Link>

            <div className="space-y-0">
              {SCREEN_NEWS.map((article, i) => (
                <div key={i}>
                  <Card
                    className="cursor-pointer rounded-none border-0 bg-transparent py-0 ring-0 transition-colors hover:bg-white/5"
                  >
                    <div className="flex gap-4 px-0 py-5">
                      {article.image && (
                        <img src={article.image} alt="" className="h-20 w-28 shrink-0 rounded object-cover" />
                      )}
                      <div>
                      <h3
                        className="text-base font-semibold leading-snug text-white"
                        style={{
                          fontFamily: "'Open Sans', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {article.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#999]">
                        {article.date} &mdash; By {article.author}
                      </p>
                      </div>
                    </div>
                  </Card>
                  {i < SCREEN_NEWS.length - 1 && (
                    <Separator className="bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Featured content sidebar */}
          <aside className="lg:col-span-1">
            <div className="mb-8 inline-flex items-center gap-3">
              <span className="h-[3px] w-8 bg-[#f79c1f]" />
              <h2
                className="text-lg font-bold uppercase tracking-wider text-white"
                style={{
                  fontFamily: "'Open Sans Condensed', sans-serif",
                  fontWeight: 700,
                }}
              >
                Featured
              </h2>
            </div>

            <Card className="overflow-hidden rounded-lg border-0 bg-[#222] p-0 ring-0">
              <img src="/brands/screenaustralia-gov-au/Narrative-Content-Slate-April.jpg" alt="Narrative Content Slate" className="w-full object-cover" />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white">Narrative Content Slate</h3>
                <p className="mt-1 text-xs text-[#999]">April 2026 funding round now open</p>
              </div>
            </Card>

            <Card className="mt-4 overflow-hidden rounded-lg border-0 bg-[#222] p-0 ring-0">
              <img src="/brands/screenaustralia-gov-au/CH2332V001_DNWTS_Frog_ES-06.png" alt="Upcoming productions" className="w-full object-cover" />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white">Upcoming Productions</h3>
                <p className="mt-1 text-xs text-[#999]">Discover what&apos;s coming to Australian screens</p>
              </div>
            </Card>

            <Card className="mt-4 overflow-hidden rounded-lg border-0 bg-[#222] p-0 ring-0">
              <img src="/brands/screenaustralia-gov-au/aus-uk-image-1.jpg" alt="Australia-UK partnership" className="w-full object-cover" />
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white">Australia-UK Co-production</h3>
                <p className="mt-1 text-xs text-[#999]">International partnerships and opportunities</p>
              </div>
            </Card>
          </aside>
        </div>
      </section>

      {/* ─── 4. Media Centre ─── */}
      <section className="bg-[#1a1a1a]">
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="mb-8 inline-flex items-center gap-3">
            <span className="h-[3px] w-8 bg-[#f79c1f]" />
            <h2
              className="text-lg font-bold uppercase tracking-wider text-white"
              style={{
                fontFamily: "'Open Sans Condensed', sans-serif",
                fontWeight: 700,
              }}
            >
              Media Centre
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MEDIA_CENTRE.map((article, i) => (
              <Card
                key={i}
                className="group cursor-pointer overflow-hidden rounded-lg border-0 bg-[#222] p-0 ring-0 transition-colors hover:bg-[#2a2a2a]"
              >
                {/* Placeholder image area */}
                <div className="aspect-video w-full bg-gradient-to-br from-[#333] via-[#2a2a2a] to-[#222]" />
                <div className="p-4">
                  <h3
                    className="text-sm font-semibold leading-snug text-white transition-colors group-hover:text-[#f79c1f]"
                    style={{
                      fontFamily: "'Open Sans', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {article.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Funding and Support ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111]" />
        <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-24 text-center">
          <h2
            className="text-4xl font-bold text-white"
            style={{
              fontFamily: "'Open Sans Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            Funding and Support
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#999]"
            style={{ fontWeight: 300 }}
          >
            Explore opportunities for development and production funding, plus
            tax incentives and other industry assistance.
          </p>
          <Link href="/brands/screenaustralia-gov-au/replica/funding-and-support">
            <Button
              className="mt-8 rounded-sm bg-[#f79c1f] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-[#e08b15]"
            >
              Go to Funding and Support
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── 6. The Screen Guide ─── */}
      <section className="bg-[#f5f5f5]">
        <div className="mx-auto max-w-[1200px] px-6 py-20 text-center">
          <h2
            className="text-4xl font-bold text-[#333]"
            style={{
              fontFamily: "'Open Sans Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            The Screen Guide
          </h2>

          <div className="mx-auto mt-8 flex max-w-2xl items-center overflow-hidden rounded-sm bg-white shadow-sm">
            <Search className="ml-4 size-5 text-[#999]" />
            <input
              type="text"
              placeholder="Search for Australian films, databases, online video and games"
              className="flex-1 bg-transparent px-4 py-4 text-sm text-[#333] placeholder:text-[#999] focus:outline-none"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            />
            <button className="bg-[#f79c1f] px-6 py-4 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-[#e08b15]">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ─── 7. Find Australian Stories ─── */}
      <section className="bg-[#111]">
        <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
          <h2
            className="text-4xl font-bold text-white"
            style={{
              fontFamily: "'Open Sans Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            Find Australia stories anytime, anywhere
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#999]"
            style={{ fontWeight: 300 }}
          >
            Discover Where to Watch your favourite Australian films and
            televisions shows on The Screen Guide now!
          </p>
          <Button
            className="mt-8 rounded-sm bg-[#f79c1f] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-[#e08b15]"
          >
            Where to Watch
          </Button>
        </div>
      </section>

      {/* ─── 8. Footer ─── */}
      <SAFooter />
    </div>
  );
}

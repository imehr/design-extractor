"use client";

import { SAHeader } from "@/components/brands/screenaustralia-gov-au/sa-header";
import { SAFooter } from "@/components/brands/screenaustralia-gov-au/sa-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SIDEBAR_NAV = [
  { text: "About us", href: "/brands/screenaustralia-gov-au/replica/about-us", active: true },
  { text: "Who we are", href: "/brands/screenaustralia-gov-au/replica/about-us/who-we-are" },
  { text: "What we do", href: "/brands/screenaustralia-gov-au/replica/about-us/what-we-do" },
  { text: "Corporate documents", href: "#" },
  { text: "Doing business with us", href: "#" },
  { text: "Jobs with Screen Australia", href: "#" },
  { text: "Subscribe to the newsletter", href: "#" },
  { text: "Contact us", href: "#" },
];

const CONTENT_CARDS = [
  { title: "Who we are", href: "/brands/screenaustralia-gov-au/replica/about-us/who-we-are", gradient: "from-[#2a2a2a] to-[#1a1a1a]" },
  { title: "What we do", href: "/brands/screenaustralia-gov-au/replica/about-us/what-we-do", gradient: "from-[#333] to-[#1a1a1a]" },
  { title: "Corporate documents", href: "#", gradient: "from-[#2e2e2e] to-[#181818]" },
  { title: "Doing business with us", href: "#", gradient: "from-[#303030] to-[#1c1c1c]" },
  { title: "Jobs with Screen Australia", href: "#", gradient: "from-[#282828] to-[#161616]" },
  { title: "Subscribe to the newsletter", href: "#", gradient: "from-[#2c2c2c] to-[#1a1a1a]" },
  { title: "Contact us", href: "#", gradient: "from-[#343434] to-[#1e1e1e]" },
];

export default function AboutUsPage() {
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
            <Link href="/brands/screenaustralia-gov-au/replica" className="hover:text-white transition-colors">
              Screen Australia
            </Link>
            <span className="mx-1.5">&gt;</span>
            <span className="text-white/70">About us</span>
          </p>
        </div>
      </div>

      {/* Page title section */}
      <div className="bg-[#000]">
        <div className="mx-auto max-w-[1200px] px-4 py-10">
          <h1
            className="text-3xl font-bold uppercase tracking-wide text-white md:text-4xl"
            style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
          >
            About us
          </h1>
          <p className="mt-2 text-sm font-light text-[#999]">
            Who we are and what we do
          </p>
        </div>
      </div>

      {/* Main content area: sidebar nav | cards | right panels */}
      <div className="bg-[#1a1a1a]">
        <div className="mx-auto max-w-[1200px] px-4 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr_280px]">

            {/* Left sidebar navigation */}
            <aside className="hidden lg:block">
              <nav className="sticky top-8">
                <ul className="space-y-0">
                  {SIDEBAR_NAV.map((item) => (
                    <li key={item.text}>
                      <Link
                        href={item.href}
                        className={`block border-l-2 px-4 py-2.5 text-sm transition-colors ${
                          item.active
                            ? "border-[#f79c1f] bg-white/5 font-semibold text-[#f79c1f]"
                            : "border-transparent text-[#999] hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {item.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Mobile sidebar navigation (horizontal scroll) */}
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {SIDEBAR_NAV.map((item) => (
                  <Link
                    key={item.text}
                    href={item.href}
                    className={`whitespace-nowrap rounded px-3 py-2 text-xs transition-colors ${
                      item.active
                        ? "bg-[#f79c1f] text-black font-semibold"
                        : "bg-white/10 text-[#999] hover:text-white"
                    }`}
                  >
                    {item.text}
                  </Link>
                ))}
              </div>
            </div>

            {/* Main content: navigation cards */}
            <main>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {CONTENT_CARDS.map((card) => (
                  <Link key={card.title} href={card.href} className="group">
                    <Card className="overflow-hidden border-0 bg-transparent">
                      {/* Image placeholder with gradient */}
                      <div className={`relative aspect-[16/10] bg-gradient-to-br ${card.gradient}`}>
                        {/* Overlay at bottom with title */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10">
                          <h2
                            className="text-lg font-bold text-white group-hover:text-[#f79c1f] transition-colors"
                            style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
                          >
                            {card.title}
                          </h2>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </main>

            {/* Right sidebar panels */}
            <aside className="space-y-6">
              {/* SCREEN NEWS panel */}
              <div className="border-t-2 border-[#f79c1f] bg-[#111] p-5">
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-[#f79c1f]"
                  style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
                >
                  Screen News
                </h3>
                <Separator className="my-3 bg-white/10" />
                <Link
                  href="/brands/screenaustralia-gov-au/replica/screen-news"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#f79c1f] hover:text-white transition-colors"
                >
                  Go there now
                  <ChevronRight className="size-3" />
                </Link>
              </div>

              {/* SUBSCRIBE panel */}
              <div className="border-t-2 border-[#f79c1f] bg-[#111] p-5">
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-[#f79c1f]"
                  style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
                >
                  Subscribe to Our Newsletter
                </h3>
                <Separator className="my-3 bg-white/10" />
                <Link
                  href="#"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#f79c1f] hover:text-white transition-colors"
                >
                  Subscribe Now
                  <ChevronRight className="size-3" />
                </Link>
              </div>

              {/* The Screen Guide panel */}
              <div className="border-t-2 border-white/20 bg-[#111] p-5">
                <h3
                  className="text-sm font-bold uppercase tracking-wider text-white"
                  style={{ fontFamily: "'Open Sans Condensed', sans-serif" }}
                >
                  The Screen Guide
                </h3>
                <Separator className="my-3 bg-white/10" />
                <Link
                  href="#"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#f79c1f] hover:text-white transition-colors"
                >
                  Start Exploring
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <SAFooter />
    </div>
  );
}

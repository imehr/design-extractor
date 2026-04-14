"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = "/brands/derwentsearch-com-au/replica";

const NAV_ITEMS = [
  {
    text: "About Us",
    href: "#",
    children: [
      { text: "Company Profile", href: `${BASE}/company-profile` },
      { text: "Advisory Board", href: "#" },
      { text: "Customer Experience", href: "#" },
      { text: "Join Our Team", href: "#" },
      { text: "Privacy Policy", href: `${BASE}/privacy-policy` },
    ],
  },
  {
    text: "Expertise",
    href: "#",
    children: [
      { text: "Board", href: "#" },
      { text: "Digital and Technology", href: "#" },
      { text: "Executive Search", href: "#" },
      { text: "Interim Solutions", href: `${BASE}/interim-solutions` },
      { text: "Private Equity", href: "#" },
    ],
  },
  {
    text: "Industries",
    href: "#",
    children: [
      { text: "Consumer and Retail", href: "#" },
      { text: "Digital & Technology", href: "#" },
      { text: "Education", href: "#" },
      { text: "Financial Services", href: "#" },
      { text: "Healthcare", href: "#" },
      { text: "Industrial", href: "#" },
      { text: "Mining and Metals", href: "#" },
      { text: "Professional Services", href: "#" },
      { text: "Public Sector", href: "#" },
      { text: "For Purpose", href: "#" },
    ],
  },
  {
    text: "Our People",
    href: "#",
  },
  {
    text: "News",
    href: `${BASE}/blog`,
  },
  {
    text: "Contact Us",
    href: "#",
    children: [
      { text: "Register your interest", href: "#" },
      { text: "Our Opportunities", href: "#" },
      { text: "Sydney", href: "#" },
      { text: "Melbourne", href: "#" },
    ],
  },
];

export function DerwentHeader({ activePage }: { activePage?: string }) {
  return (
    <header
      className="sticky top-0 z-50 w-full bg-[#2E3A48]"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <Link href={BASE} className="flex-shrink-0">
          <Image
            src="/brands/derwentsearch-com-au/logo-aff45579-1920w-1920w.png"
            alt="Derwent"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <div key={item.text} className="group relative">
              <Link
                href={item.href}
                className={`flex items-center gap-1 px-3 py-2 text-[18px] leading-[36px] text-white transition-colors hover:text-white/80 ${
                  activePage === item.text ? "text-white/90 underline underline-offset-4" : ""
                }`}
              >
                {item.text}
                {item.children && <ChevronDown className="size-4 opacity-70" />}
              </Link>

              {/* Dropdown */}
              {item.children && (
                <div className="invisible absolute left-0 top-full z-50 min-w-[220px] bg-[#2E3A48] py-2 shadow-lg group-hover:visible">
                  {item.children.map((child) => (
                    <Link
                      key={child.text}
                      href={child.href}
                      className="block px-4 py-2 text-[15px] text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {child.text}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right side: search icon + button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-white transition-colors hover:text-white/80"
            aria-label="Search"
          >
            <Search className="size-5" />
          </button>
          <Button
            className="rounded bg-[#AD2E33] px-5 py-2 text-[15px] font-semibold text-white hover:bg-[#922629]"
          >
            Search Jobs
          </Button>
        </div>
      </div>
    </header>
  );
}

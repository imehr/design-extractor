"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { text: "Funding and support", href: "/brands/screenaustralia-gov-au/replica/funding-and-support" },
  { text: "Data and Insights", href: "#" },
  { text: "Upcoming productions", href: "/brands/screenaustralia-gov-au/replica/upcoming-productions" },
  { text: "The Screen Guide", href: "#" },
  { text: "Screen News", href: "/brands/screenaustralia-gov-au/replica/screen-news" },
  { text: "About us", href: "/brands/screenaustralia-gov-au/replica/about-us" },
];

interface SAHeaderProps {
  variant?: "transparent" | "solid";
}

export function SAHeader({ variant = "solid" }: SAHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const bgClass =
    variant === "transparent"
      ? "absolute top-0 left-0 right-0 z-50 bg-transparent"
      : "relative z-50 bg-[#1a1a1a]";

  return (
    <header
      className={`w-full ${bgClass}`}
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      <div className="mx-auto flex h-[82px] max-w-[1200px] items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/brands/screenaustralia-gov-au/replica"
          className="flex items-center"
        >
          <SALogo className="h-14 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.text}
              href={link.href}
              className="px-3 py-2 text-sm font-normal text-white/80 transition-colors hover:text-white"
            >
              {link.text}
            </Link>
          ))}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="ml-2 flex items-center gap-1.5 px-3 py-2 text-sm text-white/80 hover:text-white"
            aria-label="Site Search"
          >
            <Search className="size-4" />
            <span>Search</span>
          </button>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center text-white lg:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-white/10 bg-[#1a1a1a]">
          <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-3">
            <Search className="size-5 text-white/50" />
            <input
              type="text"
              placeholder="Search Screen Australia..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#1a1a1a] lg:hidden">
          <nav className="mx-auto max-w-[1200px] px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="block py-3 text-sm text-white/80 hover:text-white"
              >
                {link.text}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function SALogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 169 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Screen Australia"
    >
      {/* Stylised SA logo - golden/orange on dark */}
      <rect width="169" height="140" rx="4" fill="none" />
      <text
        x="84.5"
        y="60"
        textAnchor="middle"
        fill="#f79c1f"
        fontFamily="'Open Sans Condensed', sans-serif"
        fontWeight="700"
        fontSize="40"
      >
        SCREEN
      </text>
      <text
        x="84.5"
        y="100"
        textAnchor="middle"
        fill="white"
        fontFamily="'Open Sans Condensed', sans-serif"
        fontWeight="700"
        fontSize="28"
      >
        AUSTRALIA
      </text>
    </svg>
  );
}

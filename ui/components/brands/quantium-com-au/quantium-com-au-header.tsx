"use client";

import Link from "next/link";
import { ChevronDown, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { QuantiumLogo } from "./quantium-com-au-logo";

const NAV_LINKS = [
  { text: "Industries", href: "#", hasDropdown: true },
  { text: "Solutions", href: "#", hasDropdown: true },
  { text: "GenAI", href: "https://quantium.com/genai/" },
  { text: "About us", href: "#", hasDropdown: true },
  { text: "Careers", href: "#", hasDropdown: true },
  { text: "Perspectives", href: "https://quantium.com/perspectives/" },
];

export function QuantiumHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white"
      style={{ fontFamily: "var(--font-roboto), 'Roboto', sans-serif" }}
      data-component="nav"
    >
      {/* ---- Utility bar ---- */}
      <div className="border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex h-10 max-w-[1280px] items-center justify-end px-6 md:px-[100px]">
          <div className="flex items-center gap-1 text-[12px] text-[#1A1A1A]">
            <span className="cursor-pointer transition-colors hover:text-[#00B2A9]">
              Sign in
            </span>
            <span className="text-[#1A1A1A]/30">|</span>
            <span className="cursor-pointer transition-colors hover:text-[#00B2A9]">
              Search
            </span>
          </div>
        </div>
      </div>

      {/* ---- Main navigation bar ---- */}
      <div className="border-b border-[#E5E5E5]">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-[100px]">
          {/* Logo */}
          <QuantiumLogo variant="dark" height={26} />

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="flex items-center gap-1 text-[14px] font-light tracking-wide text-[#1A1A1A] transition-colors hover:text-[#00B2A9]"
                style={{ fontFamily: "var(--font-roboto), 'Roboto', sans-serif" }}
              >
                {link.text}
                {link.hasDropdown && (
                  <ChevronDown className="size-3.5 opacity-50" />
                )}
              </Link>
            ))}

            {/* Search icon */}
            <button
              className="ml-2 rounded-full p-2 text-[#1A1A1A] transition-colors hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="size-4" />
            </button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="rounded-full p-2 text-[#1A1A1A] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="border-t border-[#E5E5E5] bg-white px-6 pb-6 pt-4 md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="block py-3 text-[15px] text-[#1A1A1A] transition-colors hover:text-[#00B2A9]"
                onClick={() => setMobileOpen(false)}
              >
                {link.text}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

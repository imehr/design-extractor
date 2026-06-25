"use client";

import Link from "next/link";
import { LuminaryLogo } from "./luminary-ai-logo";

const NAV_LINKS = [
  { text: "Platform", href: "#" },
  { text: "Industries", href: "#" },
  { text: "Models", href: "#" },
  { text: "Resources", href: "#" },
  { text: "Company", href: "#" },
  { text: "Careers", href: "#" },
];

export function LuminaryHeader() {
  return (
    <header data-component="nav" className="relative z-50 w-full">
      {/* Announcement Banner */}
      <div className="flex items-center justify-center overflow-hidden px-10 py-[10px] text-center" style={{ backgroundColor: "#59FF75" }}>
        <p className="text-sm font-medium text-[#2a2c2f]">
          Webinar May 20: Accelerate Crashworthiness with Physics AI —{" "}
          <a href="#" className="underline underline-offset-2 hover:opacity-70 transition-opacity duration-150">
            Register Now
          </a>
        </p>
      </div>

      {/* Main Nav */}
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 xl:px-16">
        <div className="flex h-[80px] items-center justify-between">
          {/* Logo */}
          <Link href="/brands/luminary-ai/replica" className="flex shrink-0 items-center gap-2">
            <LuminaryLogo className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 xl:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="text-sm font-medium text-[#2a2c2f] hover:opacity-70 transition-opacity duration-150"
              >
                {link.text}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 xl:flex">
            <Link
              href="#"
              className="inline-flex items-center rounded-full border border-[#2a2c2f] px-5 py-2 text-sm font-medium text-[#2a2c2f] transition-all hover:bg-[#2a2c2f] hover:text-white active:scale-[0.97]"
            >
              Login
            </Link>
            <Link
              href="#"
              data-component="button-set"
              className="inline-flex items-center rounded-full bg-[#be95ff] px-5 py-2 text-sm font-medium text-[#2a2c2f] transition-all hover:bg-[#2a2c2f] hover:text-[#be95ff] active:scale-[0.97]"
            >
              Try Prediction Demo
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="flex size-8 items-center justify-center xl:hidden" aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

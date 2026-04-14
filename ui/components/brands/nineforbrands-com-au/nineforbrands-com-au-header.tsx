"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Menu, X } from "lucide-react";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
import { useState } from "react";

const REPLICA_PREFIX = "/brands/nineforbrands-com-au/replica";

const NAV_ITEMS = [
  { text: "About Us", href: "/about/" },
  { text: "Brands", href: "/brands/" },
  { text: "Advertise", href: "/solutions/" },
  { text: "Research", href: "#" },
  { text: "News", href: "#" },
  { text: "Investors", href: "#" },
  { text: "Careers at Nine", href: "#" },
  { text: "Olympics and Paralympics", href: "#" },
  { text: "Nine in 2026", href: "#" },
];

const FONT_STACK = '"Proxima Nova", Arial, sans-serif';

export function NineHeader({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = variant === "dark";

  const logoSrc = isDark
    ? "/brands/nineforbrands-com-au/site-logo-white.png"
    : "/brands/nineforbrands-com-au/Nine_FullColour_RGB.png";

  const textColor = isDark ? "text-white" : "text-[#333333]";
  const hoverTextColor = isDark
    ? "hover:text-white/80"
    : "hover:text-[#0493DE]";
  const subscribeColor = isDark ? "text-white" : "text-[#0493DE]";
  const iconColor = isDark ? "text-white" : "text-[#333333]";
  const headerBg = isDark ? "bg-transparent" : "bg-white";
  const mobileMenuBg = isDark ? "bg-[#070720]" : "bg-white";

  return (
    <header
      className={`relative w-full ${headerBg}`}
      style={{ fontFamily: FONT_STACK }}
    >
      {/* Top bar: Subscribe + social icons */}
      <div className="mx-auto flex h-10 max-w-[1280px] items-center justify-end gap-5 px-6">
        <Link
          href="#"
          className={`flex items-center gap-1.5 text-sm font-medium ${subscribeColor} ${hoverTextColor} transition-colors`}
        >
          <Mail className="size-4" />
          <span>Subscribe</span>
        </Link>
        <Link
          href="#"
          className={`${iconColor} ${hoverTextColor} transition-colors`}
          aria-label="LinkedIn"
        >
          <LinkedinIcon className="size-4" />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`${iconColor} ${hoverTextColor} transition-colors`}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>
      </div>

      {/* Logo (centered) */}
      <div className="flex items-center justify-center py-3">
        <Link href={REPLICA_PREFIX}>
          <Image
            src={logoSrc}
            alt="Nine"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Nav bar: horizontal navigation links (centered) */}
      <nav className="hidden h-[40px] items-center justify-center overflow-x-auto border-t border-b border-white/10 lg:flex">
        <div className="flex items-center gap-6 px-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.text}
              href={
                item.href.startsWith("/")
                  ? `${REPLICA_PREFIX}${item.href}`
                  : item.href
              }
              className={`whitespace-nowrap text-sm font-medium tracking-wide ${textColor} ${hoverTextColor} transition-colors`}
            >
              {item.text}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className={`absolute inset-x-0 top-full z-50 ${mobileMenuBg} shadow-lg lg:hidden`}
        >
          <nav className="flex flex-col px-6 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.text}
                href={
                  item.href.startsWith("/")
                    ? `${REPLICA_PREFIX}${item.href}`
                    : item.href
                }
                className={`border-b border-white/10 py-3 text-sm font-medium ${textColor} ${hoverTextColor} transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.text}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

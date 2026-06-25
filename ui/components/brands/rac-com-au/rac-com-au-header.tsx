"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, ChevronDown, User } from "lucide-react";
import { RacComAuLogo } from "./rac-com-au-logo";

const UTILITY_LINKS = [
  { text: "myRAC", href: "https://rac.com.au/myrac" },
  { text: "13 17 03", href: "tel:131703" },
  { text: "Claims", href: "https://rac.com.au/products/insurance/make-a-claim" },
  { text: "About RAC", href: "https://rac.com.au/about-rac" },
  { text: "Horizons", href: "https://rac.com.au/horizons" },
  { text: "Contact us", href: "https://rac.com.au/about-rac/contact-us" },
];

const QUICK_TOOLS = [
  { text: "Pay or renew", href: "https://rac.com.au/membership-benefits/make-a-payment" },
  { text: "Find a branch", href: "https://rac.com.au/about-rac/contact-us/find-a-branch" },
  { text: "In the community", href: "https://rac.com.au/about-rac/community-programs" },
];

const NAV_ITEMS = [
  {
    label: "Membership\n& Benefits",
    href: "https://rac.com.au/membership-benefits",
    links: [
      { text: "Membership & Benefits", href: "https://rac.com.au/membership-benefits" },
      { text: "Discounts and special offers", href: "https://rac.com.au/membership-benefits/discounts-and-special-offers" },
      { text: "Competitions", href: "https://rac.com.au/membership-benefits/competitions" },
      { text: "Become a member", href: "https://rac.com.au/membership-benefits/become-a-member" },
      { text: "Have your say", href: "https://rac.com.au/membership-benefits/have-your-say" },
      { text: "About your membership", href: "https://rac.com.au/membership-benefits/about-your-membership" },
    ],
  },
  { label: "Car\n& Motoring", href: "https://rac.com.au/car-motoring" },
  { label: "Home\n& Life", href: "https://rac.com.au/home-life" },
  { label: "Travel\n& Touring", href: "https://rac.com.au/travel-touring" },
];

export function RacComAuHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <header
      className="absolute inset-x-0 top-0 z-50"
      data-replica-primary
    >
      {/* Utility bar */}
      <div className="bg-[#182D3C] text-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-2 text-xs">
          <nav className="hidden items-center gap-4 md:flex">
            {UTILITY_LINKS.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-white/90 hover:text-[#FFD100] transition-colors"
                style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                {link.text}
              </a>
            ))}
          </nav>
          <nav className="flex items-center gap-4">
            {QUICK_TOOLS.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-white/90 hover:text-[#FFD100] transition-colors"
                style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                {link.text}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main nav */}
      <div className="bg-transparent">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4">
          <Link href="https://rac.com.au/" aria-label="RAC home">
            <RacComAuLogo className="h-14 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <a
                  href={item.href}
                  className="flex items-center gap-1 whitespace-pre-line px-3 py-2 text-center text-sm font-semibold text-white hover:text-[#FFD100] transition-colors"
                  style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif', lineHeight: '1.1' }}
                >
                  {item.label}
                  {item.links && <ChevronDown className="h-3 w-3 opacity-70" />}
                </a>

                {item.links && activeMenu === item.label && (
                  <div className="absolute left-0 top-full mt-0 w-64 rounded-b-lg bg-white shadow-xl border border-gray-100 overflow-hidden">
                    <ul className="py-2">
                      {item.links.map((l) => (
                        <li key={l.text}>
                          <a
                            href={l.href}
                            className="block px-4 py-2 text-sm text-[#33424D] hover:bg-[#F6F8FA] hover:text-[#0062B2]"
                            style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                          >
                            {l.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              className="hidden items-center gap-1 rounded bg-[#FFD100] px-3 py-1.5 text-sm font-semibold text-[#182D3C] hover:bg-[#e6bc00] transition-colors lg:inline-flex"
              style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              <User className="h-4 w-4" />
              Log in or register
            </button>
            <button
              className="rounded-full p-2 text-white hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              className="rounded-full p-2 text-white hover:bg-white/10 transition-colors lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="bg-[#182D3C] text-white lg:hidden">
          <nav className="px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block border-b border-white/10 py-3 text-sm font-semibold whitespace-pre-line"
                style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif', lineHeight: '1.2' }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              {UTILITY_LINKS.map((link) => (
                <a
                  key={link.text}
                  href={link.href}
                  className="text-sm text-white/80 hover:text-[#FFD100]"
                >
                  {link.text}
                </a>
              ))}
              <a
                href="https://rac.com.au/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#182D3C] bg-[#FFD100] px-3 py-2 rounded w-fit"
              >
                <User className="h-4 w-4" />
                Log in or register
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

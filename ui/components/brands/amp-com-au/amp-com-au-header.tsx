"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import { AmpLogo } from "./amp-com-au-logo";

const UTILITY_LINKS = [
  { text: "About AMP", href: "https://www.amp.com.au/about-amp" },
  { text: "Resources", href: "https://www.amp.com.au/resources" },
  { text: "Help & support", href: "https://www.amp.com.au/help-and-support" },
  { text: "Contact us", href: "https://www.amp.com.au/contact-us" },
];

const NAV_ITEMS = [
  {
    label: "Personal banking",
    href: "https://www.amp.com.au/personal-banking",
    desc: "Banking for whatever wealthy you want. Find the right account for you.",
    image: "/brands/amp-com-au/man-wearing-glasses-striped-top-using-phone-sitting-chair-banking-695x683.jpg",
    imageAlt: "Man sitting on chair looking at his phone",
    links: [
      { text: "Everyday Money Bank Accounts", href: "https://www.amp.com.au/personal-banking/everyday-money" },
      { text: "Savings accounts", href: "https://www.amp.com.au/personal-banking/savings-accounts" },
      { text: "Term deposits", href: "https://www.amp.com.au/personal-banking/term-deposits" },
      { text: "SMSF accounts", href: "https://www.amp.com.au/personal-banking/smsf-accounts" },
      { text: "Tools and calculators", href: "https://www.amp.com.au/personal-banking/calculators" },
    ],
  },
  {
    label: "Business banking",
    href: "https://www.amp.com.au/business-banking",
    desc: "Banking for whatever wealthy you want. Find the right account for you.",
    image: "/brands/amp-com-au/man-wiping-counter-cafe-wearing-apron-banking-695x683.jpg",
    imageAlt: "Man wiping down counter at cafe",
    links: [
      { text: "Small business everyday money", href: "https://www.amp.com.au/business-banking/small-business-everyday-money" },
      { text: "Business banking accounts", href: "https://www.amp.com.au/business-banking/business-banking-accounts" },
      { text: "Business Cash Manager", href: "https://www.amp.com.au/business-banking/business-cash-manager" },
      { text: "Business Term Deposit", href: "https://www.amp.com.au/business-banking/business-term-deposit" },
      { text: "Live Payments", href: "https://www.amp.com.au/business-banking/live-payments" },
    ],
  },
  {
    label: "Home loans",
    href: "https://www.amp.com.au/home-loans",
    desc: "Buying your dream home, refinancing or looking to invest.",
    image: "/brands/amp-com-au/home-loans-couple-sitting-couch-736x736.png",
    imageAlt: "Couple on couch",
    links: [
      { text: "Investment home loans", href: "https://www.amp.com.au/home-loans/amp-investment-loan" },
      { text: "Refinance", href: "https://www.amp.com.au/home-loans/refinance" },
      { text: "First home buyer", href: "https://www.amp.com.au/home-loans/first-home-buyer-family-guarantee" },
      { text: "Get pre-approval", href: "https://www.amp.com.au/home-loans/home-loan-pre-qualification" },
    ],
  },
  {
    label: "Super",
    href: "https://www.amp.com.au/superannuation",
    desc: "Superannuation solutions for every stage of life.",
    image: "/brands/amp-com-au/end-of-financial-year-hub-couple-750x552.jpg",
    imageAlt: "Couple near water",
    links: [
      { text: "Consolidate my super", href: "https://www.amp.com.au/superannuation/consolidate" },
      { text: "Contribute to my super", href: "https://www.amp.com.au/superannuation/contribute" },
      { text: "AMP Super Lifetime Boost", href: "https://www.amp.com.au/superannuation/lifetime-boost" },
      { text: "Calculators and tools", href: "https://www.amp.com.au/superannuation/calculators-and-tools" },
    ],
  },
  {
    label: "Investments",
    href: "https://www.amp.com.au/investments",
    desc: "Investment solutions to grow your wealth.",
    image: "/brands/amp-com-au/girl-sliding-down-stairs-promo-tile-695x683.jpg",
    imageAlt: "Girl sliding down stairs",
    links: [
      { text: "Find PDS updates", href: "https://www.amp.com.au/resources/investments-pds-updates" },
      { text: "View buy/sell spreads", href: "https://www.amp.com.au/investments/buy-sell-spreads" },
      { text: "Annual financial statements", href: "https://www.amp.com.au/investments/annual-financial-statements" },
    ],
  },
];

export function AmpHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white shadow-sm"
      data-replica-primary
    >
      {/* Utility bar */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-1.5">
          <nav className="flex items-center gap-5">
            {UTILITY_LINKS.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-[11px] font-semibold text-[#001E41] hover:text-[#0018F0] transition-colors"
                style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
              >
                {link.text}
              </a>
            ))}
          </nav>
          <a
            href="https://secure.amp.com.au/public/login"
            className="rounded-full bg-[#0018F0] px-4 py-1 text-[11px] font-semibold text-white hover:bg-[#0014cc] transition-colors"
            style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
          >
            Login
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3">
        <Link href="https://www.amp.com.au/" aria-label="AMP home">
          <AmpLogo className="h-11 w-auto" />
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
              <button
                className="flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-semibold text-[#001E41] hover:text-[#0018F0] transition-colors"
                style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
              >
                {item.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {/* Mega menu */}
              {activeMenu === item.label && (
                <div className="absolute left-0 top-full mt-0 w-[480px] rounded-b-xl bg-white shadow-xl border border-gray-100 overflow-hidden">
                  <div className="flex gap-0">
                    {/* Image panel */}
                    <div className="relative w-48 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Links panel */}
                    <div className="flex-1 p-5">
                      <p
                        className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#4C617A]"
                        style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
                      >
                        For every need
                      </p>
                      <ul className="space-y-2">
                        {item.links.map((l) => (
                          <li key={l.text}>
                            <a
                              href={l.href}
                              className="block text-[13px] font-semibold text-[#001E41] hover:text-[#0018F0] transition-colors"
                              style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
                            >
                              {l.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <a
                        href={item.href}
                        className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-[#0018F0] hover:underline"
                        style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
                      >
                        Explore {item.label} →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            className="hidden rounded-full p-2 text-[#001E41] hover:bg-gray-100 transition-colors lg:flex"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="flex rounded-full p-2 text-[#001E41] hover:bg-gray-100 transition-colors lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <nav className="px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="border-b border-gray-100 last:border-0">
                <a
                  href={item.href}
                  className="block py-3 text-[14px] font-semibold text-[#001E41]"
                  style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import {
  ChevronDown,
  Menu,
  Search,
  User,
  ShoppingCart,
  MapPin,
} from "lucide-react";
import { TMobileComLogo } from "./t-mobile-com-logo";

const utilityLinks = [
  { text: "Wireless", href: "https://www.t-mobile.com/?INTNAV=tNav%3AWireless" },
  { text: "Business", href: "https://www.t-mobile.com/business?INTNAV=tNav%3ABusiness" },
  { text: "Prepaid", href: "https://prepaid.t-mobile.com/home?INTNAV=tNav%3APrepaid" },
  { text: "Internet", href: "https://www.t-mobile.com/home-internet?INTNAV=tNav%3AInternet" },
];

const mainLinks = [
  { text: "Plans", href: "https://www.t-mobile.com/cell-phone-plans?INTNAV=tNav%3APlans" },
  { text: "Phones & devices", href: "https://www.t-mobile.com/cell-phones?INTNAV=tNav%3ADevices" },
  { text: "Deals", href: "https://www.t-mobile.com/offers?INTNAV=tNav%3ADeals" },
  { text: "Coverage", href: "https://www.t-mobile.com/coverage/network?INTNAV=tNav%3ACoverage" },
];

export function TMobileComHeader() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Utility bar */}
      <div className="bg-[#141414] text-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-2 text-xs">
          <span className="font-medium text-white/70">more from T-Mobile</span>
          <nav className="flex items-center gap-4">
            {utilityLinks.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="hidden hover:text-[#E20074] sm:inline"
              >
                {link.text}
              </Link>
            ))}
            <button className="flex items-center gap-1 hover:text-[#E20074]">
              <MapPin className="h-3 w-3" />
              Stores
            </button>
            <button className="hover:text-[#E20074]">English</button>
            <button className="hover:text-[#E20074]">Español</button>
          </nav>
        </div>
      </div>

      {/* Main nav */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/brands/t-mobile-com/replica" aria-label="T-Mobile home">
              <TMobileComLogo />
            </Link>
            <nav className="hidden items-center gap-5 lg:flex">
              {mainLinks.map((link) => (
                <Link
                  key={link.text}
                  href={link.href}
                  className="flex items-center gap-1 text-sm font-bold text-[#141414] hover:text-[#E20074]"
                >
                  {link.text}
                  <ChevronDown className="h-4 w-4 text-[#6a6a6a]" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button aria-label="Search" className="text-[#141414] hover:text-[#E20074]">
              <Search className="h-5 w-5" />
            </button>
            <button aria-label="Account" className="hidden text-[#141414] hover:text-[#E20074] sm:block">
              <User className="h-5 w-5" />
            </button>
            <button aria-label="Cart" className="text-[#141414] hover:text-[#E20074]">
              <ShoppingCart className="h-5 w-5" />
            </button>
            <button aria-label="Menu" className="text-[#141414] hover:text-[#E20074] lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

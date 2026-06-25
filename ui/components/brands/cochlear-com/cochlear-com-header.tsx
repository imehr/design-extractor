"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ChevronDown, User, Globe } from "lucide-react";
import { CochlearLogo } from "./cochlear-com-logo";
import { Button } from "@/components/ui/button";

const UTILITY_LINKS = [
  { text: "Contact", href: "https://www.cochlear.com/au/en/connect/contact-us" },
  { text: "Clinic Finder", href: "https://www.cochlear.com/au/en/connect/find-a-clinic" },
];

const MAIN_NAV = [
  { text: "Home", href: "https://www.cochlear.com/au/en/home" },
  { text: "Professionals", href: "https://www.cochlear.com/au/en/professionals" },
  { text: "Find a clinic", href: "https://www.cochlear.com/au/en/connect/find-a-clinic" },
  { text: "Contact us", href: "https://www.cochlear.com/au/en/connect/contact-us" },
  { text: "About us", href: "https://www.cochlear.com/au/en/about-us" },
  { text: "Store", href: "https://www.cochlear.com/au/en/shop/home" },
];

const MEGA_MENU = [
  {
    label: "Diagnosis and treatment",
    href: "https://www.cochlear.com/au/en/home/diagnosis-and-treatment",
  },
  {
    label: "Products and accessories",
    href: "https://www.cochlear.com/au/en/home/products-and-accessories",
  },
  {
    label: "Ongoing care and support",
    href: "https://www.cochlear.com/au/en/home/ongoing-care-and-support",
  },
  {
    label: "Your Cochlear stories",
    href: "https://www.cochlear.com/au/en/home/your-cochlear-stories",
  },
];

export function CochlearHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full" data-replica-primary>
      {/* Utility bar */}
      <div className="bg-[#efefef]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-end gap-4 px-4 py-2 text-sm text-[#56565a]">
          <a
            href="https://www.cochlear.com/au/en/connect/find-a-clinic"
            className="flex items-center gap-1.5 hover:text-[#3f1482]"
            style={{ fontFamily: '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
          >
            <Image
              src="/brands/cochlear-com/cbcc0cf118d34bd584f45dfbd3ed7b87"
              alt="Australian flag icon"
              width={20}
              height={20}
              className="h-4 w-auto"
              unoptimized
            />
            <span>Clinic Finder</span>
          </a>
          {UTILITY_LINKS.map((link) => (
            <a
              key={link.text}
              href={link.href}
              className="hover:text-[#3f1482]"
              style={{ fontFamily: '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
            >
              {link.text}
            </a>
          ))}
        </div>
      </div>

      {/* Main navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-4">
          <Link href="/brands/cochlear-com/replica" className="flex-shrink-0">
            <CochlearLogo className="h-12 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex">
            {MAIN_NAV.map((item) => (
              <a
                key={item.text}
                href={item.href}
                className="text-base font-medium text-[#56565a] hover:text-[#3f1482]"
                style={{ fontFamily: '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
              >
                {item.text}
              </a>
            ))}
            <a
              href="https://www.cochlear.com/au/en/home"
              className="flex items-center gap-1 text-base font-medium text-[#56565a] hover:text-[#3f1482]"
              style={{ fontFamily: '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
            >
              <Globe className="h-4 w-4" />
              English
            </a>
            <a
              href="https://api.cochlear.com/drx/v1/auth/authorize"
              className="flex items-center gap-1 text-base font-medium text-[#56565a] hover:text-[#3f1482]"
              style={{ fontFamily: '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
            >
              <User className="h-4 w-4" />
              Login
            </a>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-b border-gray-200 bg-white lg:hidden">
          <nav className="mx-auto max-w-[1280px] space-y-1 px-4 py-4">
            {MAIN_NAV.map((item) => (
              <a
                key={item.text}
                href={item.href}
                className="block py-2 text-base font-medium text-[#56565a] hover:text-[#3f1482]"
                style={{ fontFamily: '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
              >
                {item.text}
              </a>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              {MEGA_MENU.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between py-2 text-base font-medium text-[#56565a] hover:text-[#3f1482]"
                  style={{ fontFamily: '"BlissPro-Regular", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
                >
                  {item.label}
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </a>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2 flex items-center gap-4">
              <a
                href="https://www.cochlear.com/au/en/home"
                className="flex items-center gap-1 text-base font-medium text-[#56565a] hover:text-[#3f1482]"
              >
                <Globe className="h-4 w-4" />
                English
              </a>
              <a
                href="https://api.cochlear.com/drx/v1/auth/authorize"
                className="flex items-center gap-1 text-base font-medium text-[#56565a] hover:text-[#3f1482]"
              >
                <User className="h-4 w-4" />
                Login
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

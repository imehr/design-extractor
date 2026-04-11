"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useState } from "react";

interface WWGHeaderProps {
  activePage?: string;
}

const navItems = [
  { text: "Who we are", href: "/brands/woolworthsgroup-com-au/replica/who-we-are" },
  { text: "Our impact", href: "/brands/woolworthsgroup-com-au/replica/our-impact" },
  { text: "News and media", href: "#" },
  { text: "Investors", href: "#" },
  { text: "Contact Us", href: "/brands/woolworthsgroup-com-au/replica/contact-us" },
  { text: "Careers", href: "#" },
];

export function WWGHeader({ activePage }: WWGHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Main nav — white bar */}
      <div className="bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-10" style={{ height: 94 }}>
          <Link href="/brands/woolworthsgroup-com-au/replica">
            <Image
              src="/brands/woolworths-group/logo-100years.svg"
              alt="Woolworths Group"
              width={140}
              height={56}
              priority
            />
          </Link>

          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.text}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-[#1971ED] ${
                  activePage === item.text
                    ? "text-[#1971ED] underline underline-offset-4"
                    : "text-[#202020]"
                }`}
              >
                {item.text}
              </Link>
            ))}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="ml-2 rounded-full p-2 hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-[#202020]" />
            </button>
          </nav>
        </div>
      </div>

      {/* Share price ticker — dark navy bar below nav */}
      <div className="bg-[#0E0D26]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-10 py-2.5 text-sm">
          <div className="flex items-center gap-6 text-white/80">
            <span className="font-semibold text-white">Share price 36.83 AUD</span>
            <span className="border-l border-white/30 pl-6">High 37.28</span>
            <span className="border-l border-white/30 pl-6">Low 36.71</span>
            <span className="border-l border-white/30 pl-6">Change -0.35%</span>
          </div>
          <Link href="#" className="font-semibold text-[#66C5FF] hover:underline">
            Information for investors &rsaquo;
          </Link>
        </div>
      </div>
    </header>
  );
}

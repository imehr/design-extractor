import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { WestpacLogo } from "./westpac-logo";

const UTILITY_LINKS = [
  { text: "Contact us", href: "#" },
  { text: "Locate us", href: "#" },
  { text: "Lost or stolen cards", href: "#" },
  { text: "Register", href: "#", bold: true },
];

const NAV_LINKS = [
  { text: "Home", href: "/" },
  { text: "Personal", href: "#" },
  { text: "Business", href: "#" },
  { text: "Corporate", href: "#" },
  { text: "About us", href: "#" },
  { text: "Help", href: "#" },
];

interface WestpacHeaderProps {
  activePage?: string;
}

export function WestpacHeader({ activePage = "Home" }: WestpacHeaderProps) {
  return (
    <>
      {/* Utility bar - 48px, Westpac Red, full width */}
      <div className="w-full bg-[#DA1710]">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center justify-end gap-6 px-6">
          {UTILITY_LINKS.map((link) => (
            <Link
              key={link.text}
              href={link.href}
              className={`text-sm text-white hover:underline ${link.bold ? "font-bold" : ""}`}
            >
              {link.text}
            </Link>
          ))}
        </div>
      </div>

      {/* Main nav - 72px, white, full width, sticky */}
      <div className="sticky top-0 z-50 w-full border-b border-[#DEDEE1] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6">
          {/* Left: Logo + Nav links */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <WestpacLogo />
            </Link>
            <nav className="hidden h-[72px] items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.text}
                  href={link.href}
                  className={`flex h-[72px] items-center border-b-[3px] text-lg text-[#181B25] ${
                    link.text === activePage
                      ? "border-[#DA1710]"
                      : "border-transparent"
                  }`}
                >
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Dropdown + Sign in + Search */}
          <div className="flex items-center gap-3">
            <select className="hidden h-9 rounded-[3px] border border-[#DEDEE1] bg-white px-2 text-sm text-[#575F65] lg:block">
              <option>Online Banking - Personal</option>
            </select>
            <Button
              className="h-9 rounded-[3px] border-2 border-[#DA1710] bg-[#DA1710] px-4 text-base font-bold text-white hover:bg-[#C21410]"
            >
              Sign in
            </Button>
            <button className="p-2" aria-label="Search">
              <Search className="size-6 text-[#575F65]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

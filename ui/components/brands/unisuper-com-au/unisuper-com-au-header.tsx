import Link from "next/link";
import { Search, User, ChevronDown } from "lucide-react";
import { UniSuperLogo } from "./unisuper-com-au-logo";

const BODY_FONT =
  'SourceSansPro, "Helvetica Neue", Helvetica, Arial, sans-serif';

const UTILITY_LINKS = [
  { text: "About us", href: "#" },
  { text: "Careers", href: "#" },
  { text: "News & insights", href: "#" },
  { text: "Help & support", href: "#" },
  { text: "Contact us", href: "#" },
];

const NAV_LINKS = [
  { text: "Compare", href: "#" },
  { text: "Super", href: "#" },
  { text: "Retirement", href: "#" },
  { text: "Investments", href: "#" },
  { text: "Financial advice", href: "#" },
  { text: "Insurance", href: "#" },
  { text: "Tools and learning", href: "#" },
];

export function UniSuperHeader() {
  return (
    <header
      className="w-full bg-white"
      style={{ fontFamily: BODY_FONT }}
      data-component="header"
    >
      {/* Utility bar */}
      <div className="bg-[#F5F5F5] text-[#112C5C]">
        <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-end gap-6 px-6 text-[13px]">
          {UTILITY_LINKS.map((link) => (
            <Link
              key={link.text}
              href={link.href}
              className="hover:text-[#0E71F2] transition-colors"
            >
              {link.text}
            </Link>
          ))}
          <Link
            href="#"
            className="flex items-center gap-1.5 font-semibold text-[#0E71F2] hover:underline"
          >
            <User className="size-4" />
            Log in
          </Link>
        </div>
      </div>

      {/* Main nav */}
      <div className="border-b border-[#E5E5E5]">
        <div className="mx-auto flex h-[88px] max-w-[1280px] items-center justify-between px-6">
          <Link
            href="/brands/unisuper-com-au/replica"
            className="flex shrink-0 items-center"
          >
            <UniSuperLogo className="h-9 w-auto" />
          </Link>

          <nav className="flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="flex items-center gap-1 text-[15px] font-normal text-[#112C5C] transition-colors hover:text-[#0E71F2]"
              >
                {link.text}
                <ChevronDown className="size-3.5 opacity-60" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              aria-label="Search"
              className="flex size-10 items-center justify-center rounded-full text-[#112C5C] transition-colors hover:bg-[#F5F5F5]"
            >
              <Search className="size-5" />
            </button>
            <Link
              href="#"
              className="rounded-full bg-[#0E71F2] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0a5dc9]"
            >
              Join now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

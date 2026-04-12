import Link from "next/link";
import { ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { text: "Industries", href: "#", hasDropdown: true },
  { text: "Solutions", href: "#", hasDropdown: true },
  { text: "GenAI", href: "/brands/quantium-com-au/replica" },
  { text: "About us", href: "#", hasDropdown: true },
  { text: "Careers", href: "#", hasDropdown: true },
  { text: "Perspectives", href: "/brands/quantium-com-au/replica" },
];

const QUANTIUM_FONT = "'QuantiumPro', -apple-system, system-ui, sans-serif";

export function QuantiumHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[#E5E5E5] bg-white"
      style={{ fontFamily: QUANTIUM_FONT }}
      data-component="nav"
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-[100px]">
        {/* Logo */}
        <Link href="/brands/quantium-com-au/replica" className="flex shrink-0 items-center">
          <img
            src="/brands/quantium-com-au/logo.svg"
            alt="Quantium"
            className="h-[26px] w-auto"
          />
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.text}
              href={link.href}
              className="flex items-center gap-1 text-[14px] font-light tracking-wide text-[#1A1A1A] transition-colors hover:text-[#00B2A9]"
            >
              {link.text}
              {link.hasDropdown && <ChevronDown className="size-3.5 opacity-50" />}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

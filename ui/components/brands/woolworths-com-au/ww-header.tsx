import Link from "next/link";
import { Search, ShoppingCart, ChevronDown, MapPin, Clock, User, RotateCcw } from "lucide-react";
import { WWLogo } from "./ww-logo";

const NAV_LINKS = [
  { text: "Browse products", href: "#", hasDropdown: true },
  { text: "Specials & catalogue", href: "#", hasDropdown: true },
  { text: "Recipes & ideas", href: "#" },
  { text: "Get more value", href: "#" },
  { text: "Ways to shop", href: "#" },
  { text: "Help", href: "#" },
  { text: "More", href: "#", hasDropdown: true },
];

interface WWHeaderProps {
  activePage?: string;
}

export function WWHeader({ activePage }: WWHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full" style={{ fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif" }}>
      {/* Top green bar */}
      <div className="w-full bg-[#178841]">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4">
          {/* Left: Logo + Services dropdown */}
          <div className="flex items-center gap-4">
            <Link href="/brands/woolworths-com-au/replica" className="flex items-center">
              <WWLogo className="h-10 w-10" />
            </Link>
            <button className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10">
              Everyday & Other Services
              <ChevronDown className="size-4" />
            </button>
          </div>

          {/* Center: Search bar */}
          <div className="mx-8 flex flex-1 max-w-[600px]">
            <div className="relative flex w-full items-center">
              <input
                type="text"
                placeholder="Search products, recipes & ideas"
                className="h-12 w-full rounded-lg bg-[#F5F6F6] pl-4 pr-12 text-sm text-[#25251F] placeholder:text-[#616C71] focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-md bg-[#178841] hover:bg-[#126b34]" aria-label="Search">
                <Search className="size-5 text-white" />
              </button>
            </div>
          </div>

          {/* Right: Account actions */}
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-white hover:bg-white/10">
              <RotateCcw className="size-4" />
              <span className="hidden lg:inline">Lists & Buy again</span>
            </button>
            <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-white hover:bg-white/10">
              <User className="size-4" />
              <span className="hidden lg:inline">Log in or Sign up</span>
            </button>
            <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-white hover:bg-white/10">
              <ShoppingCart className="size-4" />
              <span className="hidden lg:inline">$0.00</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nav bar - white */}
      <div className="w-full border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center justify-between px-4">
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className={`flex items-center gap-0.5 rounded px-3 py-1.5 text-sm font-medium ${
                  link.text === activePage
                    ? "text-[#178841]"
                    : "text-[#25251F] hover:bg-[#F5F6F6]"
                }`}
              >
                {link.text}
                {link.hasDropdown && <ChevronDown className="size-3.5" />}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-sm font-medium text-[#00723D] hover:underline"
            >
              Shop for business
            </Link>
            <Link
              href="#"
              className="text-sm text-[#616C71] hover:underline"
            >
              Stores
            </Link>
          </div>
        </div>
      </div>

      {/* Delivery bar */}
      <div className="w-full border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto flex h-10 max-w-[1280px] items-center gap-6 px-4 text-sm">
          <div className="flex items-center gap-1.5 text-[#616C71]">
            <MapPin className="size-4 text-[#178841]" />
            <span>Delivery to:</span>
            <button className="font-medium text-[#00723D] hover:underline">
              Set your Delivery address
            </button>
          </div>
          <div className="h-5 w-px bg-[#E0E0E0]" />
          <div className="flex items-center gap-1.5 text-[#616C71]">
            <span>Choose</span>
          </div>
          <div className="h-5 w-px bg-[#E0E0E0]" />
          <div className="flex items-center gap-1.5 text-[#616C71]">
            <Clock className="size-4 text-[#178841]" />
            <span>Select a time:</span>
            <button className="font-medium text-[#00723D] hover:underline">
              View available times
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

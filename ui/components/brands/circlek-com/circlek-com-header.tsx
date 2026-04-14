import Link from "next/link";
import { MapPin } from "lucide-react";
import { CircleKLogo } from "./circlek-com-logo";

const BASE = "/brands/circlek-com/replica";

const NAV_ITEMS = [
  { text: "Contests and Games", href: `${BASE}` },
  { text: "Our products", href: `${BASE}/our-products` },
  { text: "Working with us", href: `${BASE}` },
  {
    text: "About us",
    href: `${BASE}/history-and-timeline`,
    children: [
      { text: "History and timeline", href: `${BASE}/history-and-timeline` },
      { text: "FAQ", href: `${BASE}` },
      { text: "Our Sustainability Journey", href: `${BASE}` },
    ],
  },
];

function SocialIcon({ name, className }: { name: string; className?: string }) {
  const c = className ?? "size-3.5";
  switch (name) {
    case "Facebook":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "Twitter":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.5" />
        </svg>
      );
    case "Youtube":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
        </svg>
      );
    default:
      return null;
  }
}

const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://www.facebook.com/CircleKStores/" },
  { name: "Twitter", href: "https://x.com/circlekstores" },
  { name: "Instagram", href: "https://www.instagram.com/circlekstores/" },
  { name: "Youtube", href: "https://www.youtube.com/c/CircleKoffical" },
];

interface CircleKHeaderProps {
  activePage?: string;
}

export function CircleKHeader({ activePage }: CircleKHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full" style={{ fontFamily: "'ACT Easy', sans-serif" }}>
      {/* Top red bar */}
      <div className="w-full bg-[#DA291C]">
        <div className="mx-auto flex h-10 max-w-[1200px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button className="text-xs font-bold uppercase text-white">Customer</button>
            <Link
              href={`${BASE}`}
              className="text-xs font-bold uppercase text-white/80 hover:text-white"
            >
              Business
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-xs text-white">
              Select your region
              <svg className="size-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            <Link href={`${BASE}/contact`} className="text-xs text-white hover:underline">
              CONTACT US
            </Link>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-white/80"
                  aria-label={s.name}
                >
                  <SocialIcon name={s.name} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main nav bar */}
      <div className="w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-4">
          {/* Logo */}
          <Link href={BASE} className="flex-shrink-0">
            <CircleKLogo className="h-10 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.text}
                href={item.href}
                className={`text-sm font-semibold transition-colors hover:text-[#DA291C] ${
                  activePage === item.text
                    ? "border-b-2 border-[#DA291C] pb-0.5 text-[#DA291C]"
                    : "text-[#141414]"
                }`}
              >
                {item.text}
                {item.children && (
                  <svg
                    className="ml-1 inline-block size-3"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </Link>
            ))}
          </nav>

          {/* Store locator */}
          <Link
            href={`${BASE}`}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#DA291C] hover:underline"
          >
            <MapPin className="size-4" />
            Store locator
          </Link>
        </div>
      </div>
    </header>
  );
}

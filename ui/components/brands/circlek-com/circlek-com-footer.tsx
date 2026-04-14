import Link from "next/link";

const BASE = "/brands/circlek-com/replica";

const PRIMARY_LINKS = [
  { text: "Become a Franchise", href: "https://www.franchise-circlek.com/" },
  { text: "Newsroom", href: "https://corporate.couche-tard.com/" },
  { text: "Contact us", href: `${BASE}/contact` },
];

const LEGAL_LINKS = [
  { text: "Terms of Use", href: `${BASE}/terms-of-use` },
  { text: "Privacy policy", href: `${BASE}` },
  {
    text: "Policy Prohibiting Human Trafficking, Slavery and Child Labor Violations",
    href: `${BASE}`,
  },
  { text: "Do not sell my personal information", href: `${BASE}` },
  { text: "Safety Data Sheets & Product Specs", href: `${BASE}` },
];

export function CircleKFooter() {
  return (
    <footer
      className="w-full border-t border-gray-200 bg-white"
      style={{ fontFamily: "'ACT Easy', sans-serif" }}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        {/* Primary links row */}
        <nav className="mb-3 flex flex-wrap items-center gap-4">
          {PRIMARY_LINKS.map((link, i) => (
            <span key={link.text} className="flex items-center gap-4">
              {link.href.startsWith("http") ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-[#141414] underline hover:text-[#DA291C]"
                >
                  {link.text}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="text-sm font-bold text-[#141414] underline hover:text-[#DA291C]"
                >
                  {link.text}
                </Link>
              )}
              {i < PRIMARY_LINKS.length - 1 && (
                <span className="text-gray-300">|</span>
              )}
            </span>
          ))}
        </nav>

        {/* Copyright */}
        <p className="mb-4 text-xs text-[#595959]">
          Circle K Stores and Alimentation Couche-Tard. All rights reserved.
          Certain activities provided via the website may be covered by U.S.
          Patent 5,930,474.
        </p>

        {/* Legal links row */}
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {LEGAL_LINKS.map((link, i) => (
            <span key={link.text} className="flex items-center gap-4">
              <Link
                href={link.href}
                className="text-xs text-[#141414] underline hover:text-[#DA291C]"
              >
                {link.text}
              </Link>
              {i < LEGAL_LINKS.length - 1 && (
                <span className="text-gray-300">|</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}

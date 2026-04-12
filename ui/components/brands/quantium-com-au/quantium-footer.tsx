import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const QUANTIUM_FONT = "'QuantiumPro', -apple-system, system-ui, sans-serif";

const FOOTER_COLUMNS = {
  industries: {
    title: "Industries",
    links: [
      { text: "FMCG / CPG", href: "#" },
      { text: "Retail", href: "#" },
      { text: "Banking and wealth", href: "#" },
      { text: "Consumer services", href: "#" },
      { text: "Insurance", href: "#" },
      { text: "Health", href: "#" },
      { text: "Public sector", href: "#" },
    ],
  },
  solutions: {
    title: "Solutions",
    links: [
      { text: "Q.Checkout", href: "#" },
      { text: "Q.Promotions", href: "#" },
      { text: "Q.Shelf", href: "#" },
      { text: "Q.Supply", href: "#" },
      { text: "Q.Panel", href: "#" },
      { text: "Q.Refinery", href: "#" },
      { text: "Q.Audience", href: "#" },
      { text: "Q.Checkup", href: "#" },
      { text: "Q.Dose", href: "#" },
      { text: "Q.Quail", href: "#" },
    ],
  },
  company: {
    title: "",
    links: [
      { text: "About us", href: "#" },
      { text: "Our locations", href: "#" },
      { text: "Careers", href: "#" },
      { text: "Perspectives", href: "#" },
      { text: "Corporate responsibility", href: "#" },
      { text: "CommBank iQ", href: "#" },
      { text: "Quantium Telstra", href: "#" },
    ],
  },
};

const LEGAL_LINKS = [
  { text: "Privacy policy", href: "#" },
  { text: "Speak up policy", href: "#" },
  { text: "Terms of use", href: "#" },
];

const LEGAL_LINKS_ROW2 = [
  { text: "Modern slavery policy", href: "#" },
  { text: "Information security policy", href: "#" },
  { text: "Carbon reduction plan", href: "#" },
];

export function QuantiumFooter() {
  return (
    <footer
      className="w-full bg-black"
      style={{ fontFamily: QUANTIUM_FONT }}
      data-component="footer"
    >
      <div className="mx-auto max-w-[1280px] px-[100px] py-16">
        {/* Logo */}
        <div className="mb-12">
          <img
            src="/brands/quantium-com-au/logo-white.svg"
            alt="Quantium"
            className="h-[24px] w-auto"
          />
        </div>

        {/* Link columns */}
        <div className="mb-12 grid grid-cols-3 gap-12">
          {Object.values(FOOTER_COLUMNS).map((col) => (
            <div key={col.title || "company"}>
              {col.title && (
                <h4 className="mb-4 text-[13px] font-medium uppercase tracking-wider text-white/50">
                  {col.title}
                </h4>
              )}
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.text}>
                    <Link
                      href={link.href}
                      className="text-[15px] font-light text-white/70 transition-colors hover:text-white"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-white/10" />

        {/* Legal links */}
        <div className="mt-8 space-y-2">
          <div className="flex items-center gap-2">
            {LEGAL_LINKS.map((link, idx) => (
              <span key={link.text} className="flex items-center gap-2">
                {idx > 0 && <span className="text-white/20">|</span>}
                <Link
                  href={link.href}
                  className="text-[13px] font-light text-white/50 transition-colors hover:text-white"
                >
                  {link.text}
                </Link>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {LEGAL_LINKS_ROW2.map((link, idx) => (
              <span key={link.text} className="flex items-center gap-2">
                {idx > 0 && <span className="text-white/20">|</span>}
                <Link
                  href={link.href}
                  className="text-[13px] font-light text-white/50 transition-colors hover:text-white"
                >
                  {link.text}
                </Link>
              </span>
            ))}
          </div>
          <p className="pt-2 text-[13px] font-light text-white/40">
            Copyright &copy; 2026 Quantium
          </p>
        </div>

        {/* Social icons */}
        <div className="mt-8 flex items-center gap-4">
          <a
            href="#"
            aria-label="LinkedIn"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="YouTube"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

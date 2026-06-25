import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { QuantiumLogo } from "./quantium-com-au-logo";

const FOOTER_COLUMNS = {
  industries: {
    title: "Industries",
    links: [
      { text: "FMCG / CPG", href: "https://quantium.com/fmcg-cpg/" },
      { text: "Retail", href: "https://quantium.com/retail/" },
      { text: "Banking and wealth", href: "https://quantium.com/banking-and-wealth/" },
      { text: "Consumer services", href: "https://quantium.com/consumer-services/" },
      { text: "Insurance", href: "https://quantium.com/insurance/" },
      { text: "Health", href: "https://quantium.com/health/" },
      { text: "Public sector", href: "https://quantium.com/public-sector/" },
    ],
  },
  solutions: {
    title: "Solutions",
    links: [
      { text: "Q", href: "https://quantium.com/powered-by-q/" },
      { text: "Q.Checkout", href: "https://quantium.com/q-checkout/" },
      { text: "Q.Promotions", href: "https://quantium.com/q-promotions/" },
      { text: "Q.Shelf", href: "https://quantium.com/q-shelf/" },
      { text: "Q.Shopper", href: "https://quantium.com/?page_id=3031" },
      { text: "Q.Supply", href: "https://quantium.com/q-supply/" },
      { text: "Q.Panel", href: "https://quantium.com/q-panel/" },
      { text: "Q.Refinery", href: "https://quantium.com/q-refinery/" },
      { text: "Q.Audience", href: "https://quantium.com/q-audience/" },
      { text: "Q.Credit", href: "https://quantium.com/banking-and-wealth/" },
      { text: "Q.Checkup", href: "https://quantium.com/q-checkup/" },
      { text: "Q.Dose", href: "https://quantium.com/q-dose/" },
      { text: "Q.Quail", href: "https://quantium.com/q-quail/" },
    ],
  },
  company: {
    title: "",
    links: [
      { text: "About us", href: "https://quantium.com/about-us/" },
      { text: "Our locations", href: "https://quantium.com/our-locations/" },
      { text: "Careers", href: "https://quantium.com/careers/" },
      { text: "Perspectives", href: "https://quantium.com/perspectives/" },
      { text: "Corporate responsibility", href: "https://quantium.com/corporate-responsibility/" },
      { text: "CommBank iQ", href: "https://quantium.com/commbank-iq/" },
      { text: "Quantium Telstra", href: "https://quantium.com/quantium-telstra/" },
    ],
  },
};

const LEGAL_LINKS_ROW1 = [
  { text: "Privacy policy", href: "https://quantium.com/privacy/" },
  { text: "Speak up policy", href: "https://quantium.com/speak-up-policy" },
  { text: "Terms of use", href: "https://quantium.com/terms-of-use/" },
];

const LEGAL_LINKS_ROW2 = [
  { text: "Modern slavery policy", href: "https://quantium.com/modern-slavery-policy/" },
  { text: "Information security policy", href: "https://quantium.com/information-security-policy/" },
  { text: "Carbon reduction plan", href: "https://quantium.com/carbon-reduction-plan/" },
];

export function QuantiumFooter() {
  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: "rgb(0, 0, 6)",
        fontFamily: "var(--font-roboto), 'Roboto', sans-serif",
      }}
      data-component="footer"
    >
      <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-[100px]">
        {/* Logo */}
        <div className="mb-12">
          <QuantiumLogo variant="light" height={24} href={undefined} />
        </div>

        {/* Link columns */}
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-3">
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
          <div className="flex flex-wrap items-center gap-2">
            {LEGAL_LINKS_ROW1.map((link, idx) => (
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
          <div className="flex flex-wrap items-center gap-2">
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
            href="https://www.linkedin.com/company/quantium"
            aria-label="LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white/40 hover:text-white"
          >
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

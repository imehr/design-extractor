import Image from "next/image";
import Link from "next/link";
import { Search, ArrowUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { RacComAuLogo } from "./rac-com-au-logo";

const FOOTER_COLUMNS = [
  {
    heading: "About RAC",
    href: "https://rac.com.au/about-rac",
    links: [
      { text: "Advocating change", href: "https://rac.com.au/about-rac/advocating-change" },
      { text: "In the community", href: "https://rac.com.au/about-rac/community-programs" },
      { text: "Help centre", href: "https://rac.com.au/about-rac/help-centre" },
      { text: "Frequently asked questions", href: "https://rac.com.au/faq" },
      { text: "Contact us", href: "https://rac.com.au/about-rac/contact-us" },
      { text: "Find a branch", href: "https://rac.com.au/about-rac/contact-us/find-a-branch" },
      { text: "Careers", href: "https://rac.com.au/about-rac/careers" },
      { text: "Media", href: "https://rac.com.au/about-rac/media" },
    ],
  },
  {
    heading: "RAC Products & Services",
    href: "https://rac.com.au/products",
    links: [
      { text: "Pay or renew", href: "https://rac.com.au/membership-benefits/make-a-payment" },
      { text: "Insurance", href: "https://rac.com.au/products/insurance" },
      { text: "Claims", href: "https://rac.com.au/products/insurance/make-a-claim" },
      { text: "Roadside Assistance", href: "https://rac.com.au/car-motoring/roadside-assistance" },
      { text: "Travel", href: "https://rac.com.au/travel-touring" },
      { text: "Holiday Parks and Resorts", href: "https://rac.com.au/travel-touring/rac-parks-and-resorts" },
      { text: "Finance", href: "https://rac.com.au/products/finance" },
      { text: "Home Security", href: "https://rac.com.au/home-life/home-security" },
      { text: "Car servicing & repair", href: "https://rac.com.au/car-motoring/car-servicing-and-repair" },
    ],
  },
  {
    heading: "Information & advice",
    href: "https://rac.com.au/horizons",
    links: [
      { text: "Car & Motoring", href: "https://rac.com.au/car-motoring" },
      { text: "Home & Life", href: "https://rac.com.au/home-life" },
      { text: "Travel & Touring", href: "https://rac.com.au/travel-touring" },
      { text: "Membership & Benefits", href: "https://rac.com.au/membership-benefits" },
    ],
  },
];

const LEGAL_LINKS = [
  { text: "Privacy", href: "https://rac.com.au/about-rac/site-info/privacy" },
  { text: "Disclaimer", href: "https://rac.com.au/about-rac/site-info/disclaimer" },
  { text: "Security", href: "https://rac.com.au/about-rac/site-info/security" },
  { text: "Accessibility", href: "https://rac.com.au/about-rac/site-info/accessibility" },
];

const SOCIAL_LINKS = [
  { label: "RAC on Instagram", href: "https://www.instagram.com/racwa/", icon: "instagram" },
  { label: "RAC on Facebook", href: "https://www.facebook.com/racwa", icon: "facebook" },
  { label: "RAC on Twitter", href: "https://twitter.com/racwa", icon: "twitter" },
  { label: "RAC on LinkedIn", href: "https://www.linkedin.com/company/rac-wa", icon: "linkedin" },
];

function SocialIcon({ icon, label }: { icon: string; label: string }) {
  const cls = "h-5 w-5";
  if (icon === "instagram")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  if (icon === "facebook")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  if (icon === "twitter")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
    </svg>
  );
}

export function RacComAuFooter() {
  return (
    <footer className="bg-[#182D3C] text-white" data-replica-primary>
      {/* Search / back to top */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
          <form className="relative w-full max-w-md" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="search"
              placeholder="Search this site"
              className="h-10 w-full rounded border-white/20 bg-white/10 pr-10 text-white placeholder:text-white/60"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
          <a
            href="#site-header"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-[#FFD100]"
            style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
          >
            Back to top
            <ArrowUp className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-10">
        {/* Sitemap */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="https://rac.com.au/" aria-label="RAC home">
              <Image
                src="/brands/rac-com-au/RAC-footer-logo.png"
                alt="RAC - For the better"
                width={295}
                height={125}
                className="h-16 w-auto"
              />
            </Link>
            <address className="mt-6 not-italic text-sm leading-relaxed text-white/70">
              832 Wellington Street,
              <br />
              West Perth, Western Australia, 6005
            </address>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <a
                href={col.href}
                className="mb-3 block text-base font-semibold text-[#FFD100] hover:text-white"
                style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                {col.heading}
              </a>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.text}>
                    <a
                      href={link.href}
                      className="text-sm text-white/80 hover:text-white transition-colors"
                      style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-white/10" />

        {/* Legal + social */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-sm text-white/80 hover:text-white"
                style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
              >
                {link.text}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[#FFD100] transition-colors"
                aria-label={s.label}
              >
                <SocialIcon icon={s.icon} label={s.label} />
              </a>
            ))}
          </div>
        </div>

        {/* Disclaimer text */}
        <div className="mt-8 space-y-3 text-xs leading-relaxed text-white/60">
          <p style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            This website is created by RAC WA. © 2026
          </p>
          <p style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            RAC acknowledges and pays respects to the Traditional Custodians throughout Australia. We recognise the continuing connection to land, waters and community.
          </p>
          <p style={{ fontFamily: '"Stag Sans Web", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            The RAC Rescue helicopters are sponsored by RAC, funded by the State Government and managed by the Department of Fire and Emergency Services (DFES).
          </p>
        </div>
      </div>
    </footer>
  );
}

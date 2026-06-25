import Image from "next/image";
import Link from "next/link";
import { AmpLogo } from "./amp-com-au-logo";

const FOOTER_NAV = [
  {
    heading: "Personal banking",
    href: "https://www.amp.com.au/personal-banking",
    links: [
      { text: "Everyday Money Bank Accounts", href: "https://www.amp.com.au/personal-banking/everyday-money" },
      { text: "Savings accounts", href: "https://www.amp.com.au/personal-banking/savings-accounts" },
      { text: "Term deposits", href: "https://www.amp.com.au/personal-banking/term-deposits" },
      { text: "SMSF accounts", href: "https://www.amp.com.au/personal-banking/smsf-accounts" },
    ],
  },
  {
    heading: "Home loans",
    href: "https://www.amp.com.au/home-loans",
    links: [
      { text: "Investment home loans", href: "https://www.amp.com.au/home-loans/amp-investment-loan" },
      { text: "Refinance", href: "https://www.amp.com.au/home-loans/refinance" },
      { text: "First home buyer", href: "https://www.amp.com.au/home-loans/first-home-buyer-family-guarantee" },
      { text: "SMSF hub", href: "https://www.amp.com.au/campaigns/bank/smsf-hub" },
    ],
  },
  {
    heading: "Business banking",
    href: "https://www.amp.com.au/business-banking",
    links: [
      { text: "Small business everyday money", href: "https://www.amp.com.au/business-banking/small-business-everyday-money" },
      { text: "Business banking accounts", href: "https://www.amp.com.au/business-banking/business-banking-accounts" },
      { text: "Business Cash Manager", href: "https://www.amp.com.au/business-banking/business-cash-manager" },
      { text: "Live Payments", href: "https://www.amp.com.au/business-banking/live-payments" },
    ],
  },
  {
    heading: "Super",
    href: "https://www.amp.com.au/superannuation",
    links: [
      { text: "Consolidate my super", href: "https://www.amp.com.au/superannuation/consolidate" },
      { text: "Contribute to my super", href: "https://www.amp.com.au/superannuation/contribute" },
      { text: "Lifetime Boost", href: "https://www.amp.com.au/superannuation/lifetime-boost" },
      { text: "MySuper dashboard", href: "https://www.amp.com.au/superannuation/mysuper-dashboard" },
    ],
  },
  {
    heading: "Investments",
    href: "https://www.amp.com.au/investments",
    links: [
      { text: "Find PDS updates", href: "https://www.amp.com.au/resources/investments-pds-updates" },
      { text: "View buy/sell spreads", href: "https://www.amp.com.au/investments/buy-sell-spreads" },
      { text: "Annual financial statements", href: "https://www.amp.com.au/investments/annual-financial-statements" },
    ],
  },
  {
    heading: "Resources",
    href: "https://www.amp.com.au/resources",
    links: [
      { text: "Tools & calculators", href: "https://www.amp.com.au/resources/tools-and-calculators" },
      { text: "Insights hub", href: "https://www.amp.com.au/resources/insights-hub" },
      { text: "Find a form", href: "https://www.amp.com.au/resources/find-a-form" },
      { text: "Target Market Determinations", href: "https://www.amp.com.au/resources#tmd" },
    ],
  },
];

const AMP_LINKS = [
  { text: "About AMP", href: "https://www.amp.com.au/about-amp" },
  { text: "Performance and unit prices", href: "https://www.amp.com.au/amp/performance-and-unit-prices" },
  { text: "AMP share price", href: "https://www.amp.com.au/about-amp/shareholder-centre" },
  { text: "Corporate sustainability", href: "https://www.amp.com.au/about-amp/what-we-do/corporate-sustainability" },
  { text: "News", href: "https://www.amp.com.au/about-amp/news" },
];

const QUICK_LINKS = [
  { text: "Sign in to My AMP", href: "https://secure.amp.com.au/public/login" },
  { text: "Download AMP Bank GO", href: "https://www.amp.com.au/help-and-support/banking-faqs/amp-bank-go/download-amp-bank-go" },
  { text: "MySuper dashboard", href: "https://www.amp.com.au/superannuation/mysuper-dashboard" },
  { text: "Find a calculator", href: "https://www.amp.com.au/resources/tools-and-calculators" },
  { text: "Find a form", href: "https://www.amp.com.au/resources/find-a-form" },
  { text: "Support", href: "https://www.amp.com.au/help-and-support" },
  { text: "Contact us", href: "https://www.amp.com.au/contact-us" },
];

const LEGAL_LINKS = [
  { text: "Privacy", href: "https://www.amp.com.au/privacy" },
  { text: "Online security", href: "https://www.amp.com.au/amp/online-services/your-online-security" },
  { text: "Complaints", href: "https://www.amp.com.au/help-and-support/complaints" },
  { text: "Financial services guide", href: "https://www.amp.com.au/financial-services-guide" },
  { text: "Terms and conditions", href: "https://www.amp.com.au/terms-and-conditions" },
  { text: "Sitemap", href: "https://www.amp.com.au/sitemap" },
];

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/amp", icon: "linkedin" },
  { label: "X (Twitter)", href: "https://x.com/AMP_au", icon: "twitter" },
  { label: "Facebook", href: "https://www.facebook.com/AMPaustralia", icon: "facebook" },
  { label: "YouTube", href: "https://www.youtube.com/user/AMP", icon: "youtube" },
  { label: "TikTok", href: "https://www.tiktok.com/@amp_au", icon: "tiktok" },
];

function SocialIcon({ icon, label }: { icon: string; label: string }) {
  const cls = "h-5 w-5";
  if (icon === "linkedin")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
      </svg>
    );
  if (icon === "twitter")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (icon === "facebook")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  if (icon === "youtube")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  /* TikTok */
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-label={label}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.56a8.16 8.16 0 0 0 4.77 1.52V7.64a4.85 4.85 0 0 1-1-.95z" />
    </svg>
  );
}

export function AmpFooter() {
  return (
    <footer
      className="relative overflow-hidden bg-[#00152D] text-white"
      data-replica-primary
    >
      {/* Spark background SVG */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <Image
          src="/brands/amp-com-au/Spark-footer.svg"
          alt=""
          fill
          className="object-cover object-right"
        />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 py-12">
        {/* Top: logo + tagline */}
        <div className="mb-10 flex items-start justify-between gap-8">
          <div>
            <Link href="https://www.amp.com.au/" aria-label="AMP home">
              <AmpLogo className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p
              className="mt-3 text-[22px] font-semibold text-white"
              style={{ fontFamily: '"Hurme Geometric Sans-SemiBold", "Open Sans", Arial, sans-serif' }}
            >
              Whatever wealthy you want
            </p>
          </div>

          {/* App store badges */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="https://www.amp.com.au/help-and-support/banking-faqs/amp-bank-go/download-amp-bank-go" aria-label="Download on the App Store">
              <Image
                src="/brands/amp-com-au/apple-app-store.png"
                alt="Download on the App Store"
                width={135}
                height={40}
                className="h-10 w-auto"
              />
            </a>
            <a href="https://www.amp.com.au/help-and-support/banking-faqs/amp-bank-go/download-amp-bank-go" aria-label="Get it on Google Play">
              <Image
                src="/brands/amp-com-au/google-play-store.png"
                alt="Get it on Google Play"
                width={135}
                height={40}
                className="h-10 w-auto"
              />
            </a>
          </div>
        </div>

        {/* Nav grid */}
        <div className="mb-10 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <a
                href={col.href}
                className="mb-3 block text-[13px] font-bold text-white hover:text-[#00D5AC] transition-colors"
                style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
              >
                {col.heading}
              </a>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.text}>
                    <a
                      href={link.href}
                      className="text-[12px] text-[#A8B8CC] hover:text-white transition-colors"
                      style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-8 border-t border-white/10" />

        {/* AMP corporate + Quick links */}
        <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="mb-3 text-[13px] font-bold text-white"
              style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
            >
              AMP
            </p>
            <ul className="space-y-1.5">
              {AMP_LINKS.map((link) => (
                <li key={link.text}>
                  <a
                    href={link.href}
                    className="text-[12px] text-[#A8B8CC] hover:text-white transition-colors"
                    style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="mb-3 text-[13px] font-bold text-white"
              style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
            >
              Quick links
            </p>
            <ul className="grid grid-cols-2 gap-1.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.text}>
                  <a
                    href={link.href}
                    className="text-[12px] text-[#A8B8CC] hover:text-white transition-colors"
                    style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 border-t border-white/10" />

        {/* Bottom: legal + social */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-[11px] text-[#A8B8CC] hover:text-white transition-colors"
                style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
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
                className="text-[#A8B8CC] hover:text-white transition-colors"
                aria-label={s.label}
              >
                <SocialIcon icon={s.icon} label={s.label} />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <p
          className="mt-6 text-[11px] text-[#A8B8CC]"
          style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}
        >
          AMP Limited ABN 49 079 354 519. All rights reserved. AMP services and products are provided by various entities within the AMP group of companies.
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const FOOTER_COLUMNS = {
  helpSupport: {
    title: "Help & Support",
    links: [
      "Contact Us",
      "Feedback",
      "Product Safety",
      "Product Recalls",
      "Return Policy",
      "Scam Warning",
    ],
  },
  myAccount: {
    title: "My Account",
    links: [
      "View My Account",
      "Pick up",
      "Delivery",
      "Delivery Now",
      "New to Online Shopping?",
      "Shop for your Business",
      "Store Locations & Trading Hours",
    ],
  },
  discover: {
    title: "Discover",
    links: [
      "Everyday Rewards",
      "Recipes & Easy Dinner Ideas",
      "Woolworths Catalogue",
      "Our pricing",
      "Meal Planner",
      "Woolworths Fresh Magazine",
      "Woolworths App",
    ],
  },
  aboutUs: {
    title: "About Us",
    links: [
      "Careers",
      "Our Brands",
      "Woolworths Group Privacy Centre",
      "Community",
      "Suppliers",
      "Become an Affiliate",
      "Corporate Responsibility",
      "About Us",
    ],
  },
};

const SOCIAL_LINKS = [
  { platform: "Instagram", href: "http://instagram.com/woolworths_au" },
  { platform: "Facebook", href: "https://www.facebook.com/woolworths" },
  { platform: "Pinterest", href: "https://au.pinterest.com/woolworths/" },
  { platform: "YouTube", href: "https://www.youtube.com/WoolworthsAu" },
  { platform: "Twitter", href: "https://twitter.com/woolworths" },
];

const FULFILMENT_OPTIONS = [
  { label: "Delivery", icon: "/brands/woolworths-com-au/icon-direct-to-boot.svg" },
  { label: "Pick up", icon: "/brands/woolworths-com-au/icon-direct-to-boot-now.svg" },
  { label: "Direct to boot", icon: "/brands/woolworths-com-au/icon-direct-to-boot.svg" },
];

const PARTNER_LOGOS = [
  { name: "Everyday Rewards", src: "/brands/woolworths-com-au/everyday-rewards-logo.svg" },
  { name: "Everyday Insurance", src: "/brands/woolworths-com-au/everyday-insurance-logo.svg" },
  { name: "Everyday Market", src: "/brands/woolworths-com-au/everyday-market-logo.svg" },
  { name: "Everyday Mobile", src: "/brands/woolworths-com-au/everyday-mobile-logo.svg" },
  { name: "Gift Cards", src: "/brands/woolworths-com-au/gift-cards-logo.png" },
];

const LEGAL_LINKS = [
  "Woolworths Group Privacy Policy",
  "Woolworths Group Cookies Statement",
  "Woolworths Collection Notice",
  "Terms & Conditions",
  "Accessibility",
];

export function WWFooter() {
  return (
    <footer
      className="w-full"
      style={{ fontFamily: "var(--font-roboto), -apple-system, system-ui, sans-serif" }}
    >
      {/* Ways to shop + Fulfilment */}
      <div className="w-full bg-[#25251F] py-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <h3 className="mb-4 text-base font-medium text-white">Ways to shop</h3>
          <div className="flex flex-wrap items-center gap-6">
            {FULFILMENT_OPTIONS.map((opt) => (
              <div key={opt.label} className="flex items-center gap-2">
                <img src={opt.icon} alt={opt.label} className="h-8 w-8" />
                <span className="text-sm text-white">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="w-full bg-[#171C1F] py-10">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {Object.values(FOOTER_COLUMNS).map((col) => (
              <div key={col.title}>
                <h4 className="mb-3 text-sm font-bold text-white">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm text-[#A0A4A8] hover:text-white hover:underline"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Separator className="my-8 bg-[#3A3F42]" />

          {/* Social links */}
          <div className="mb-8 flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.platform}
                href={social.href}
                aria-label={social.platform}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3A3F42] text-white hover:bg-[#505558]"
              >
                <span className="text-xs font-bold">
                  {social.platform.charAt(0)}
                </span>
              </a>
            ))}
          </div>

          {/* Partner logos */}
          <div className="mb-8">
            <h4 className="mb-4 text-sm font-bold text-white">
              More from Woolworths
            </h4>
            <div className="flex flex-wrap items-center gap-6">
              {PARTNER_LOGOS.map((logo) => (
                <a key={logo.name} href="#" className="block">
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-8 object-contain brightness-0 invert"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* App download */}
          <div className="mb-8">
            <h4 className="mb-3 text-sm font-bold text-white">
              Download the Woolworths app
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex h-10 items-center gap-2 rounded-lg border border-[#A0A4A8] px-4 text-xs text-white hover:bg-white/5"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <div className="text-[10px] leading-none">Download on the</div>
                  <div className="text-sm font-medium leading-tight">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="flex h-10 items-center gap-2 rounded-lg border border-[#A0A4A8] px-4 text-xs text-white hover:bg-white/5"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302-2.533-2.533L17.698 9.508zM5.864 2.658L16.8 8.99l-2.301 2.302-8.636-8.635z" />
                </svg>
                <div>
                  <div className="text-[10px] leading-none">Get it on</div>
                  <div className="text-sm font-medium leading-tight">
                    Google Play
                  </div>
                </div>
              </a>
            </div>
          </div>

          <Separator className="my-8 bg-[#3A3F42]" />

          {/* Acknowledgement */}
          <div className="mb-6 flex items-start gap-4">
            <img
              src="/brands/woolworths-com-au/footer-care-deeply.png"
              alt="We care deeply"
              className="h-10 w-10 shrink-0"
            />
            <p className="text-xs leading-5 text-[#A0A4A8]">
              We acknowledge the Traditional Owners and Custodians of the lands on
              which we live, work and play, and pay our respects to Elders past,
              present and emerging.
            </p>
          </div>

          {/* Footer badges */}
          <div className="mb-6 flex items-center gap-4">
            <img
              src="/brands/woolworths-com-au/footer-accessibility.png"
              alt="Accessibility"
              className="h-8"
            />
            <img
              src="/brands/woolworths-com-au/footer-drinkwise.png"
              alt="DrinkWise"
              className="h-8"
            />
          </div>

          {/* Copyright + legal links */}
          <div className="space-y-3">
            <p className="text-xs text-[#A0A4A8]">
              &copy; Woolworths Group Limited 1997-2026 - All Rights Reserved.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {LEGAL_LINKS.map((link, idx) => (
                <span key={link} className="flex items-center gap-3">
                  {idx > 0 && (
                    <span className="text-[#3A3F42]">|</span>
                  )}
                  <Link
                    href="#"
                    className="text-xs text-[#A0A4A8] hover:text-white hover:underline"
                  >
                    {link}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { LuminaryLogo } from "./luminary-ai-logo";

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [{ text: "Overview", href: "#" }],
  },
  {
    title: "Resources",
    links: [
      { text: "News", href: "#" },
      { text: "Press", href: "#" },
      { text: "Events", href: "#" },
      { text: "Resources", href: "#" },
      { text: "Trust Center", href: "#" },
      { text: "Legal", href: "#" },
    ],
  },
  {
    title: "Industries",
    links: [
      { text: "Aerospace", href: "#" },
      { text: "Automotive", href: "#" },
      { text: "Defense", href: "#" },
      { text: "Industrial", href: "#" },
      { text: "Electronics", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { text: "About Us", href: "#" },
      { text: "Careers", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    href: "https://www.linkedin.com/company/luminarycloud",
    label: "LinkedIn",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.98 3.5C4.98 4.881 3.87 6 2.5 6C1.13 6 0 4.881 0 3.5C0 2.119 1.13 1 2.5 1C3.87 1 4.98 2.119 4.98 3.5ZM5 8H0V24H5V8ZM12.98 8H8.02V24H12.98V15.5C12.98 10.87 19.02 10.43 19.02 15.5V24H24V13.87C24 5.87 14.94 6.17 12.98 10.16V8Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "https://x.com/luminaryphysics",
    label: "X",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.808 10.468L20.88 2H19.2L13.128 9.352L8.232 2H2.8L10.24 12.764L2.8 22H4.48L10.792 14.212L15.928 22H21.36L13.808 10.468ZM11.68 13.18L10.84 11.964L4.96 3.28H7.72L12.448 10.084L13.288 11.3L19.44 20.68H16.68L11.68 13.18Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "https://www.youtube.com/@luminaryphysics",
    label: "YouTube",
    icon: (
      <svg width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M33.3 5.6C33.3 5.6 33 3.5 32 2.4C30.7 1 29.3 1 28.7 0.9C24 0.5 17 0.5 17 0.5H16.9C16.9 0.5 9.9 0.5 5.2 0.9C4.6 1 3.2 1 1.9 2.4C0.9 3.5 0.6 5.6 0.6 5.6C0.6 5.6 0.3 8.1 0.3 10.5V12.8C0.3 15.2 0.6 17.7 0.6 17.7C0.6 17.7 0.9 19.8 1.9 20.9C3.2 22.3 4.8 22.3 5.5 22.4C8.2 22.7 17 22.8 17 22.8C17 22.8 24 22.8 28.7 22.3C29.3 22.2 30.7 22.2 32 20.8C33 19.7 33.3 17.6 33.3 17.6C33.3 17.6 33.6 15.1 33.6 12.7V10.4C33.6 8.1 33.3 5.6 33.3 5.6ZM13.4 15.5V7.1L22.7 11.3L13.4 15.5Z" fill="currentColor" />
      </svg>
    ),
  },
];

export function LuminaryFooter() {
  return (
    <footer data-component="footer" className="bg-[#2a2c2f]">
      <div className="mx-auto flex min-h-[512px] flex-col px-4 pb-16 pt-16 md:px-8 md:py-12 xl:max-w-[1440px] xl:px-16">
        <div className="xl:grid xl:grid-cols-[334px_minmax(0,1fr)] xl:items-start">
          {/* Logo */}
          <Link href="/brands/luminary-ai/replica">
            <LuminaryLogo className="h-8 w-auto" invert />
            <span className="sr-only">Luminary</span>
          </Link>

          {/* Links */}
          <div className="mt-[72px] flex gap-x-4 md:grid md:grid-cols-8 md:gap-x-6 md:gap-y-8 xl:mt-0 xl:flex xl:flex-wrap xl:gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="flex-1 md:col-span-2 xl:w-[143px] xl:flex-none">
                <h4 className="mb-4 text-sm font-semibold text-[#fcfcfa]">{col.title}</h4>
                <ul className="mt-4 flex flex-col gap-3 xl:mt-0 xl:gap-2">
                  {col.links.map((link) => (
                    <li key={link.text}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#697077] transition-colors duration-300 hover:text-[#be95ff]"
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Social */}
            <div className="flex-1 md:col-span-2 xl:w-[143px] xl:flex-none">
              <h4 className="mb-4 text-sm font-semibold text-[#fcfcfa]">Follow Us On</h4>
              <div className="mt-4 flex items-center gap-4 xl:mt-0">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-[#fcfcfa] transition-opacity duration-150 hover:opacity-50"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-auto flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#697077] md:flex-row md:items-center">
          <p>© 2026 Luminary Cloud, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

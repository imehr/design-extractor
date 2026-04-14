import Link from "next/link";
import { Separator } from "@/components/ui/separator";
const FOOTER_COLUMNS = [
  {
    title: "Home",
    links: [
      { text: "Upcoming productions", href: "/brands/screenaustralia-gov-au/replica/upcoming-productions" },
      { text: "The Screen Guide", href: "#" },
      { text: "Media centre", href: "#" },
      { text: "Festivals and markets", href: "#" },
      { text: "Australian success", href: "#" },
      { text: "New directions", href: "#" },
      { text: "About us", href: "/brands/screenaustralia-gov-au/replica/about-us" },
    ],
  },
  {
    title: "Funding\u00a0and support",
    links: [
      { text: "Narrative Content Production", href: "#" },
      { text: "Narrative Content Development", href: "#" },
      { text: "Games", href: "#" },
      { text: "Documentary", href: "#" },
      { text: "First Nations", href: "#" },
      { text: "Industry development", href: "#" },
      { text: "Producer Offset", href: "#" },
      { text: "Co-production Program", href: "#" },
    ],
  },
  {
    title: "Data and Insights",
    links: [
      { text: "Reports and key issues", href: "#" },
      { text: "Infographics", href: "#" },
      { text: "People and businesses", href: "#" },
      { text: "Production trends", href: "#" },
      { text: "Cinema", href: "#" },
      { text: "Television", href: "#" },
      { text: "Video and online", href: "#" },
      { text: "Gender Matters", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  { platform: "Facebook", href: "https://www.facebook.com/screen.australia/", letter: "f" },
  { platform: "Twitter", href: "https://www.twitter.com/ScreenAustralia", letter: "t" },
  { platform: "Instagram", href: "https://www.instagram.com/screenaustralia/", letter: "in" },
  { platform: "LinkedIn", href: "https://www.linkedin.com/company/418970", letter: "li" },
];

export function SAFooter() {
  return (
    <footer
      className="w-full bg-[#1a1a1a]"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      {/* Acknowledgement of Country */}
      <div className="border-b border-white/10 bg-[#111]">
        <div className="mx-auto max-w-[1200px] px-6 py-8 text-center">
          <p className="text-sm leading-6 text-white/60">
            Screen Australia acknowledges the Traditional Custodians of the land on which
            we work and recognises their continuous connection to culture, community,
            land, waters and territories.
          </p>
          <p className="mt-4 text-sm leading-6 text-white/60">
            Aboriginal and Torres Strait Islander people are advised that this website
            contains images, voices and names of people who have passed.
          </p>
        </div>
      </div>

      {/* Sitemap navigation */}
      <nav className="border-b border-white/10">
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3
                  className="mb-4 text-sm font-bold uppercase tracking-wider text-[#f79c1f]"
                  style={{ fontFamily: "'Open Sans Condensed', 'Open Sans', sans-serif" }}
                >
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.text}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#777] transition-colors hover:text-white"
                      >
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom bar: logo + social */}
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Footer logo */}
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 811 149"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-auto"
              aria-label="Screen Australia"
            >
              <text
                x="0"
                y="60"
                fill="#f79c1f"
                fontFamily="'Open Sans Condensed', sans-serif"
                fontWeight="700"
                fontSize="50"
              >
                SCREEN
              </text>
              <text
                x="0"
                y="120"
                fill="white"
                fontFamily="'Open Sans Condensed', sans-serif"
                fontWeight="700"
                fontSize="40"
              >
                AUSTRALIA
              </text>
            </svg>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.platform}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.platform}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white transition-colors hover:bg-[#f79c1f]"
              >
                {social.letter}
              </a>
            ))}
          </div>
        </div>

        <Separator className="my-6 bg-white/10" />

        <p className="text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} Screen Australia. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

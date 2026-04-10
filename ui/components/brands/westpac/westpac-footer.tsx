import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { WestpacLogo } from "./westpac-logo";

// Extracted from actual DOM — consistent across all 5 pages
const LINK_COLUMNS = [
  [
    { text: "Complaints and compliments", href: "#" },
    { text: "Contact us", href: "#" },
    { text: "Careers", href: "#" },
  ],
  [
    { text: "Access and Inclusion", href: "#" },
    { text: "Investor centre", href: "#" },
    { text: "Westpac Group", href: "#" },
  ],
  [
    { text: "Security", href: "#" },
    { text: "FAQs", href: "#" },
    { text: "Privacy", href: "#" },
  ],
  [
    { text: "Website terms and conditions", href: "#" },
    { text: "Terms and Conditions", href: "#" },
  ],
  [
    { text: "Site index", href: "#" },
    { text: "Modern Slavery Statement", href: "#" },
  ],
];

const SOCIAL_ICONS = [
  { name: "Facebook", src: "/brands/westpac/social/facebook.svg" },
  { name: "X", src: "/brands/westpac/social/x.svg" },
  { name: "YouTube", src: "/brands/westpac/social/youtube.svg" },
  { name: "LinkedIn", src: "/brands/westpac/social/linkedin.svg" },
  { name: "Instagram", src: "/brands/westpac/social/instagram.svg" },
];

export function WestpacFooter() {
  return (
    <footer className="w-full">
      {/* Link columns with red chevrons */}
      <div className="w-full bg-white py-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 lg:grid-cols-5">
            {LINK_COLUMNS.map((col, colIdx) => (
              <div key={colIdx} className="space-y-1">
                {col.map((link) => (
                  <Link
                    key={link.text}
                    href={link.href}
                    className="flex items-center gap-1 py-1 text-sm text-[#575F65] hover:text-[#DA1710]"
                  >
                    <ChevronRight className="size-4 shrink-0 text-[#DA1710]" />
                    {link.text}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-[#DEDEE1]" />

      {/* Social icons row + Westpac logo */}
      <div className="w-full bg-white py-4">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            {SOCIAL_ICONS.map((icon) => (
              <a
                key={icon.name}
                href="#"
                aria-label={icon.name}
                className="block"
              >
                <img
                  src={icon.src}
                  alt={icon.name}
                  width={32}
                  height={32}
                  className="size-8"
                />
              </a>
            ))}
          </div>
          <WestpacLogo className="h-[26px] w-[69px]" />
        </div>
      </div>

      <Separator className="bg-[#DEDEE1]" />

      {/* Legal text with inline links */}
      <div className="w-full bg-white py-6">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="text-sm leading-6 text-[#575F65]">
            For Westpac issued products, conditions, fees and charges apply.
            These may change or we may introduce new ones in the future. Full
            details are available on request. Lending criteria apply to approval
            of credit products. This information does not take your personal
            objectives, circumstances or needs into account. Consider its
            appropriateness to these factors before acting on it. Read the
            disclosure documents for your selected product or service, including
            the{" "}
            <Link href="#" className="text-[#DA1710] underline">
              Terms and Conditions
            </Link>
            , before deciding.{" "}
            <Link href="#" className="text-[#DA1710] underline">
              Target Market Determinations
            </Link>{" "}
            for the products are available. Unless otherwise specified, the
            products and services described on this website are available only in
            Australia from &copy; Westpac Banking Corporation ABN 33 007 457 141
            AFSL and Australian credit licence 233714.
          </p>
        </div>
      </div>

      {/* Aboriginal artwork banner - actual downloaded image */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 360,
          backgroundImage: "url('/brands/westpac/acknowledgement-artwork.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Acknowledgement of Country - angled white band at bottom */}
        <div className="absolute inset-x-0 bottom-0 flex items-end">
          {/* White band with angled right edge */}
          <div className="relative flex-1" style={{ marginRight: 120 }}>
            <div
              style={{
                background: "white",
                padding: "20px 40px 20px 60px",
                clipPath: "polygon(0 0, calc(100% - 60px) 0, 100% 100%, 0 100%)",
              }}
            >
              <p className="text-xs leading-5 text-[#575F65]">
                Westpac acknowledges the Traditional Owners as the custodians of
                this land, recognising their connection to land, waters and
                community. We pay our respects to Australia&apos;s First
                Peoples, and to their Elders past and present. View our{" "}
                <Link href="#" className="text-[#DA1710] underline">
                  Indigenous Hub
                </Link>
              </p>
            </div>
          </div>
          {/* W logo at bottom right */}
          <div className="absolute bottom-3 right-6">
            <WestpacLogo className="h-[40px] w-[100px]" />
          </div>
        </div>
      </div>
    </footer>
  );
}

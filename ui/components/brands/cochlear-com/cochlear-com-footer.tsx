import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = [
  { text: "Investors", href: "https://www.cochlear.com/au/en/corporate/investors" },
  { text: "Careers", href: "https://www.cochlear.com/au/en/corporate/careers" },
  { text: "Media", href: "https://www.cochlear.com/au/en/corporate/media" },
  { text: "Global warnings", href: "https://www.cochlear.com/au/en/corporate/global-warnings" },
  { text: "Reliability reporting", href: "https://www.cochlear.com/au/en/home/products-and-accessories/cochlear-nucleus-system/nucleus-implant-reliability" },
];

const LEGAL_LINKS = [
  { text: "Privacy commitment", href: "https://www.cochlear.com/global/en/corporate/data-privacy-and-security" },
  { text: "Privacy notice", href: "https://www.cochlear.com/privacy" },
  { text: "Terms of use", href: "https://www.cochlear.com/au/en/corporate/terms-of-use" },
];

const SOCIAL_LINKS = [
  { href: "https://www.facebook.com/CochlearANZ", src: "/brands/cochlear-com/8a6ba205972d4fd182c8e1b99b6b61b0", alt: "Facebook logo", label: "Facebook" },
  { href: "https://www.youtube.com/user/CochlearAusNZ", src: "/brands/cochlear-com/cdd2477a961b4e1e9f60bb131e35fe1e", alt: "YouTube logo", label: "YouTube" },
  { href: "https://www.instagram.com/cochlear_global/", src: "/brands/cochlear-com/05cb5b517fb04023a8c641474053ceb4", alt: "Instagram logo", label: "Instagram" },
  { href: "https://www.linkedin.com/company/cochlear/", src: "/brands/cochlear-com/402753700756412abe7db70adb2f5417", alt: "LinkedIn logo", label: "LinkedIn" },
];

export function CochlearFooter() {
  return (
    <footer className="w-full bg-[#51515a] text-white" data-replica-primary>
      <div className="mx-auto max-w-[1280px] px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Logo */}
          <Link href="/brands/cochlear-com/replica" className="inline-block">
            <Image
              src="/brands/cochlear-com/a8c5c4166cba4bdd85fd69811a617275"
              alt="Cochlear logo"
              width={120}
              height={105}
              className="h-16 w-auto brightness-0 invert"
              unoptimized
            />
          </Link>

          {/* Footer links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-sm text-white/90 hover:text-white hover:underline"
                style={{ fontFamily: '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
              >
                {link.text}
              </a>
            ))}
          </nav>

          {/* Social links */}
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <Image
                  src={social.src}
                  alt={social.alt}
                  width={30}
                  height={30}
                  className="h-5 w-5 brightness-0 invert"
                  unoptimized
                />
              </a>
            ))}
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-sm text-white/90 hover:text-white hover:underline"
                style={{ fontFamily: '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}
              >
                {link.text}
              </a>
            ))}
          </nav>
          <div className="text-sm text-white/80" style={{ fontFamily: '"BlissPro-Light", "Trebuchet MS", "Gill Sans", "Helvetica Neue", Arial, sans-serif' }}>
            <a href="https://www.cochlear.com/global/en/corporate/cookies-notice" className="hover:text-white hover:underline">
              Cookies Notice
            </a>
            <span className="mx-2">|</span>
            <span>Copyright &copy; 2026 Cochlear Ltd. All rights reserved</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

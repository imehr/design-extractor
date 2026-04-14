import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { text: "About Us", href: "#" },
  { text: "Brands", href: "#" },
  { text: "Advertise", href: "#" },
  { text: "Research", href: "#" },
  { text: "News", href: "#" },
  { text: "Investors", href: "#" },
  { text: "Careers at Nine", href: "#" },
  { text: "Olympics and Paralympics", href: "#" },
  { text: "Nine in 2026", href: "#" },
];

interface NineHeaderProps {
  variant?: "dark" | "light";
}

export function NineHeader({ variant = "dark" }: NineHeaderProps) {
  const isDark = variant === "dark";
  const bg = isDark ? "bg-[#070720]" : "bg-white";
  const textColor = isDark ? "text-white" : "text-[#333333]";
  const hoverColor = isDark ? "hover:text-[#0493de]" : "hover:text-[#0493de]";
  const logoSrc = isDark ? "/brands/nineforbrands-com-au/site-logo-white.png" : "/brands/nineforbrands-com-au/Nine_FullColour_RGB.png";
  const logoH = isDark ? "h-[40px]" : "h-[36px]";

  return (
    <header
      data-component="nav"
      className="sticky top-0 z-50 w-full"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      {/* Top utility bar */}
      <div className={`w-full ${bg} ${!isDark ? "border-b border-[#f5f5f5]" : ""}`}>
        <div className="mx-auto flex h-[48px] max-w-[1200px] items-center justify-end gap-4 px-4">
          {/* Center: Logo */}
          <Link href="#" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src={logoSrc}
              alt="Nine for Brands"
              width={155}
              height={40}
              className={`${logoH} w-auto`}
              priority
            />
          </Link>

          {/* Right: Subscribe + LinkedIn + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="#"
              className={`flex items-center gap-1.5 text-[12px] font-[800] tracking-[0.25px] ${textColor} ${hoverColor}`}
            >
              Subscribe
            </Link>
            <Link href="#" className={`${textColor} ${hoverColor}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </Link>
            <button className={`${textColor} md:hidden`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className={`hidden w-full ${bg} md:block`}>
        <nav className="mx-auto flex max-w-[1200px] items-center justify-center px-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.text}
              href={link.href}
              className={`px-[12px] py-[16px] text-[14px] font-[800] tracking-[0.25px] ${textColor} transition-colors duration-300 ${hoverColor}`}
            >
              {link.text}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

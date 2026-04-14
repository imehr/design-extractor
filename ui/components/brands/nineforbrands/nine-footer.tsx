import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = [
  { text: "Careers at Nine", href: "#" },
  { text: "Help", href: "#" },
  { text: "Terms of Use", href: "#" },
  { text: "Privacy Policy", href: "#" },
  { text: "Advertise with Nine", href: "#" },
];

export function NineConnectBar() {
  return (
    <section
      className="w-full bg-white py-[60px]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-4 md:flex-row md:justify-between">
        <h2 className="text-[24px] font-[800] tracking-[0.25px] text-[#333333]">
          Connect with us
        </h2>
        <div className="flex gap-4">
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-[100px] bg-[#0493de] px-6 py-3 text-[14px] font-[800] tracking-[0.5px] text-white transition-colors duration-300 hover:bg-[#037ab8]"
          >
            Subscribe to Nine Insights
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-[100px] bg-[#0493de] px-6 py-3 text-[14px] font-[800] tracking-[0.5px] text-white transition-colors duration-300 hover:bg-[#037ab8]"
          >
            Follow us on LinkedIn
          </Link>
        </div>
      </div>
    </section>
  );
}

export function NineFooter() {
  return (
    <footer
      data-component="footer"
      className="w-full bg-[#070720]"
      style={{ fontFamily: '"Proxima Nova", Arial, sans-serif' }}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-[40px]">
        {/* Top row: Logo + Nav links */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Logo */}
          <Link href="#">
            <Image
              src="/brands/nineforbrands-com-au/site-logo-footer.png"
              alt="Nine for Brands"
              width={93}
              height={24}
              className="h-[24px] w-auto"
            />
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                className="text-[14px] text-white/70 transition-colors duration-300 hover:text-white"
              >
                {link.text}
              </Link>
            ))}
          </nav>
        </div>

        {/* Acknowledgement of Country */}
        <p className="mt-8 text-[12px] leading-[1.6] text-white/50">
          Acknowledgement: Nine acknowledges the traditional custodians of
          Country, and the connections of First Nations people to the lands and
          waterways on which we work and live. We pay our respects to elders
          past and present, and we commit to listening, learning and acting on
          our journey towards reconciliation.
        </p>

        {/* Bottom row: Newsletter + Copyright */}
        <div className="mt-8 flex flex-col items-start gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h5 className="text-[14px] font-[800] tracking-[0.25px] text-white">
              Nine Insights, straight to your inbox
            </h5>
            <p className="mt-1 text-[12px] text-white/50">
              News, Perspective &amp; Opportunity
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-[100px] bg-[#0493de] px-6 py-3 text-[14px] font-[800] tracking-[0.5px] text-white transition-colors duration-300 hover:bg-[#037ab8]"
          >
            Subscribe Now
          </Link>
        </div>

        <p className="mt-6 text-[12px] text-white/30">
          &copy; 2026 Nine Entertainment Company
        </p>
      </div>
    </footer>
  );
}
